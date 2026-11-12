import type { AnswerPoint, ComponentDef, CoverageRun, PointDefinition, Post, RenderedAnswer, Sample, StrategyConfig } from '../types'
import { STALE_REFERENCE_DAYS } from '../data/scenes'
import { renderAnswer } from './renderAnswer'

const DAY_MS = 86_400_000

function flattenPoints(answer: RenderedAnswer): AnswerPoint[] {
  return answer.sections.flatMap((section) => section.points)
}

function withDiff(before: RenderedAnswer, after: RenderedAnswer): { before: RenderedAnswer; after: RenderedAnswer } {
  const beforeKeys = new Set(flattenPoints(before).map((point) => point.id))
  const afterKeys = new Set(flattenPoints(after).map((point) => point.id))
  const apply = (answer: RenderedAnswer, counterpart: Set<string>, side: 'before' | 'after'): RenderedAnswer => ({
    ...answer,
    sections: answer.sections.map((section) => ({
      ...section,
      points: section.points.map((point) => ({
        ...point,
        change: counterpart.has(point.id) ? 'unchanged' : side === 'after' ? 'added' : 'removed',
      })),
    })),
  })
  return { before: apply(before, afterKeys, 'before'), after: apply(after, beforeKeys, 'after') }
}

export function getConfigVersion(config: StrategyConfig): string {
  const value = JSON.stringify(config)
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `cfg-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function cloneConfig(config: StrategyConfig): StrategyConfig {
  return {
    evidence: { ...config.evidence, allowedKinds: [...config.evidence.allowedKinds] },
    presentation: {
      ...config.presentation,
      groupByPersonaAppliesTo: [...config.presentation.groupByPersonaAppliesTo],
      componentOrder: [...config.presentation.componentOrder],
    },
    guardrails: { ...config.guardrails },
  }
}

/**
 * Stale citations are measured against a fixed scene standard rather than the editable
 * freshness window; otherwise the window would filter every stale post before it could be counted.
 */
function citationMetrics(answer: RenderedAnswer, posts: Post[], asOf: string, config: StrategyConfig, staleThresholdDays: number) {
  const postById = new Map(posts.map((post) => [post.id, post]))
  const citations = flattenPoints(answer).flatMap((point) => point.evidenceIds)
  if (citations.length === 0) {
    return { traceableRate: null, staleCount: 0, sponsoredUnlabeled: 0 }
  }
  const traceable = citations.filter((id) => postById.has(id)).length
  const uniquePosts = [...new Set(citations)].flatMap((id) => {
    const post = postById.get(id)
    return post ? [post] : []
  })
  const staleCount = uniquePosts.filter((post) => {
    const age = Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${post.date}T00:00:00Z`)) / DAY_MS)
    return age > staleThresholdDays
  }).length
  const sponsoredUnlabeled = config.evidence.labelSponsored
    ? 0
    : uniquePosts.filter((post) => post.sponsored).length
  return { traceableRate: traceable / citations.length, staleCount, sponsoredUnlabeled }
}

function coveredExpected(sample: Sample, answer: RenderedAnswer, posts: Post[]): string[] {
  const traceableIds = new Set(posts.map((post) => post.id))
  const pointsWithEvidence = new Set(flattenPoints(answer)
    .filter((point) => point.evidenceIds.some((id) => traceableIds.has(id)))
    .map((point) => point.id))
  return sample.expectedPoints.map((point) => point.key).filter((key) => pointsWithEvidence.has(key))
}

function classify(
  beforeCovered: string[],
  afterCovered: string[],
  expectedCount: number,
  beforeMetrics: ReturnType<typeof citationMetrics>,
  afterMetrics: ReturnType<typeof citationMetrics>,
): 'improved' | 'same' | 'regressed' {
  const missedBefore = expectedCount - beforeCovered.length
  const missedAfter = expectedCount - afterCovered.length
  const guardrailWorsened = afterMetrics.staleCount > beforeMetrics.staleCount
    || afterMetrics.sponsoredUnlabeled > beforeMetrics.sponsoredUnlabeled
    || (beforeMetrics.traceableRate !== null && afterMetrics.traceableRate !== null && afterMetrics.traceableRate < beforeMetrics.traceableRate)
  if (missedAfter > missedBefore || guardrailWorsened) return 'regressed'
  const guardrailImproved = afterMetrics.staleCount < beforeMetrics.staleCount
    || afterMetrics.sponsoredUnlabeled < beforeMetrics.sponsoredUnlabeled
  if (afterCovered.length > beforeCovered.length || guardrailImproved) return 'improved'
  return 'same'
}

function getReason(delta: 'improved' | 'same' | 'regressed', answer: RenderedAnswer, missedAfter: string[], sample: Sample): string | undefined {
  if (delta === 'improved') return '改动后答出了更多期望要点，或引用质量变好。'
  if (delta === 'same') return '此样例覆盖的期望要点数没有变化，引用质量也没有变差。'
  if (missedAfter.length === 0) return '独立标注要点仍全部覆盖，但改动后引用了超出场景时效标准的内容或未标注的商业内容。'
  const omitted = answer.omittedPoints.find((point) => missedAfter.includes(point.pointKey))
  if (omitted) return omitted.reason
  const missingLabel = sample.expectedPoints.find((point) => missedAfter.includes(point.key))?.label
  return missingLabel ? `改动后未覆盖独立标注要点“${missingLabel}”，需查看对应规则与来源。` : '策略改动使样例的要点覆盖或引用质量变差。'
}

export function runCoverageCheck(
  configBefore: StrategyConfig,
  configAfter: StrategyConfig,
  samples: Sample[],
  posts: Post[],
  components: ComponentDef[],
  pointCatalog: PointDefinition[],
  asOf: string,
  staleThresholdDays: number = STALE_REFERENCE_DAYS,
): CoverageRun {
  const results = samples.map((sample) => {
    const rawBefore = renderAnswer(configBefore, sample, posts, components, pointCatalog, asOf)
    const rawAfter = renderAnswer(configAfter, sample, posts, components, pointCatalog, asOf)
    const diff = withDiff(rawBefore, rawAfter)
    const expectedPointKeys = sample.expectedPoints.map((point) => point.key)
    const coveredBefore = coveredExpected(sample, diff.before, posts)
    const coveredAfter = coveredExpected(sample, diff.after, posts)
    const missedBefore = expectedPointKeys.filter((key) => !coveredBefore.includes(key))
    const missedAfter = expectedPointKeys.filter((key) => !coveredAfter.includes(key))
    const beforeMetrics = citationMetrics(diff.before, posts, asOf, configBefore, staleThresholdDays)
    const afterMetrics = citationMetrics(diff.after, posts, asOf, configAfter, staleThresholdDays)
    const delta = classify(coveredBefore, coveredAfter, expectedPointKeys.length, beforeMetrics, afterMetrics)

    return {
      sampleId: sample.id,
      query: sample.text,
      expectedPointKeys,
      before: diff.before,
      after: diff.after,
      coveredBefore,
      coveredAfter,
      missedBefore,
      missedAfter,
      traceableRateBefore: beforeMetrics.traceableRate,
      traceableRateAfter: afterMetrics.traceableRate,
      staleCountBefore: beforeMetrics.staleCount,
      staleCountAfter: afterMetrics.staleCount,
      sponsoredUnlabeledBefore: beforeMetrics.sponsoredUnlabeled,
      sponsoredUnlabeledAfter: afterMetrics.sponsoredUnlabeled,
      delta,
      reason: getReason(delta, diff.after, missedAfter, sample),
    }
  })

  return {
    configVersion: getConfigVersion(configAfter),
    configSnapshot: cloneConfig(configAfter),
    asOf,
    results,
    summary: {
      improved: results.filter((result) => result.delta === 'improved').length,
      same: results.filter((result) => result.delta === 'same').length,
      regressed: results.filter((result) => result.delta === 'regressed').length,
    },
  }
}
