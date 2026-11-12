import { describe, expect, it } from 'vitest'
import {
  BASELINE_CONFIG,
  CAPABILITIES,
  COMPONENTS,
  COOKING_POSTS,
  COOKING_QUERY,
  DEMO_AS_OF_DATE,
  FIXED_SCOPE_CONFIG,
  POINT_CATALOG,
  REGRESSION_DEMO_CONFIG,
  REUSABLE_RULES,
  SKINCARE_POSTS,
  SKINCARE_SAMPLES,
  SKINCARE_TEMPLATE,
  STRATEGY_ITEMS,
  USAGE_REUSE_TARGET,
} from '../data'
import { detectConflicts, getConfigVersion, renderAnswer, resolveConfig, reuseReport, runCoverageCheck } from './index'

describe('mock data contracts', () => {
  it('keeps the agreed source and fixed sample counts, with independent fictional annotations', () => {
    expect(SKINCARE_POSTS).toHaveLength(28)
    expect(COOKING_POSTS).toHaveLength(15)
    expect(SKINCARE_SAMPLES).toHaveLength(8)
    expect(SKINCARE_SAMPLES.every((sample) => sample.expectedPoints.length > 0)).toBe(true)
    expect(SKINCARE_SAMPLES.every((sample) => sample.annotatedBy.includes('独立标注'))).toBe(true)
    expect(SKINCARE_SAMPLES.find((sample) => sample.id === 'skin-q7')?.expectedPoints.map((point) => point.key)).toContain('wait-film')
    expect([...SKINCARE_POSTS, ...COOKING_POSTS].every((post) => post.mock)).toBe(true)
  })

  it('maps every post point to the local point catalog', () => {
    const known = new Set(POINT_CATALOG.map((point) => point.key))
    for (const post of [...SKINCARE_POSTS, ...COOKING_POSTS]) {
      for (const point of post.points) expect(known.has(point)).toBe(true)
    }
  })
})

describe('resolveConfig', () => {
  it('merges draft values without mutating baseline and attaches field provenance', () => {
    const resolved = resolveConfig(BASELINE_CONFIG, {
      presentation: { groupByPersona: true, groupByPersonaAppliesTo: ['选购类'] },
    }, STRATEGY_ITEMS)
    expect(resolved.config.presentation.groupByPersona).toBe(true)
    expect(resolved.config.presentation.groupByPersonaAppliesTo).toEqual(['选购类'])
    expect(BASELINE_CONFIG.presentation.groupByPersona).toBe(false)
    expect(resolved.sources['presentation.groupByPersona'].source).toBe('business-draft')
    expect(resolved.sources['presentation.groupByPersona'].appliesTo).toEqual(['选购类'])
    expect(resolved.sources['presentation.groupByPersona'].setBy.name).toContain('虚构')
    expect(resolved.sources['presentation.groupByPersona'].editable).toBe(true)
    expect(resolved.sources['guardrails.sponsoredPosition'].isExampleGuardrail).toBe(true)
    resolved.config.presentation.groupByPersonaAppliesTo.push('用法类')
    expect(BASELINE_CONFIG.presentation.groupByPersonaAppliesTo).toEqual(['选购类', '用法类'])
  })
})

describe('detectConflicts', () => {
  it('returns a fictional rule source and discussion options without accepting or mutating the draft', () => {
    const draft = { ...REGRESSION_DEMO_CONFIG, guardrails: { sponsoredPosition: 'beforeConclusion' as const } }
    const before = JSON.stringify(draft)
    const conflicts = detectConflicts(draft)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].guardrail.isExample).toBe(true)
    expect(conflicts[0].guardrail.ownerName).toContain('虚构')
    expect(conflicts[0].status).toBe('needs_discussion')
    expect(conflicts[0].options).toHaveLength(2)
    expect(JSON.stringify(draft)).toBe(before)
    expect(detectConflicts(REGRESSION_DEMO_CONFIG)).toEqual([])
  })
})

describe('renderAnswer', () => {
  it('keeps the pitfall reminder off at baseline so enabling it is a visible change', () => {
    const baseline = renderAnswer(BASELINE_CONFIG, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(baseline.sections.map((section) => section.componentId)).not.toContain('pitfall-card')
  })

  it('only renders points backed by eligible sources and existing components, with source traces', () => {
    const answer = renderAnswer(REGRESSION_DEMO_CONFIG, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const rendered = answer.sections.flatMap((section) => section.points)
    expect(rendered.some((point) => point.id === 'oil-light-texture')).toBe(true)
    expect(rendered.every((point) => point.evidenceIds.length > 0)).toBe(true)
    expect(rendered.every((point) => COMPONENTS.find((component) => component.id === point.componentId)?.status === 'existing')).toBe(true)
    expect(rendered.find((point) => point.id === 'oil-light-texture')?.trace.length).toBeGreaterThan(0)
    expect(rendered.find((point) => point.id === 'pilling-pitfall')?.evidenceIds).toHaveLength(3)
    expect(answer.filteredEvidence.some((item) => item.ruleId === 'freshness-window')).toBe(false)
  })

  it('explains the broad-scope regression and restores “等待成膜” when usage questions leave scope', () => {
    const sample = SKINCARE_SAMPLES.find((item) => item.id === 'skin-q7')!
    const broken = renderAnswer(REGRESSION_DEMO_CONFIG, sample, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const repaired = renderAnswer(FIXED_SCOPE_CONFIG, sample, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(broken.sections.flatMap((section) => section.points).map((point) => point.id)).not.toContain('wait-film')
    expect(broken.omittedPoints.find((point) => point.pointKey === 'wait-film')?.reason).toContain('用法类')
    expect(repaired.sections.flatMap((section) => section.points).map((point) => point.id)).toContain('wait-film')
    expect(repaired.sections.flatMap((section) => section.points).find((point) => point.id === 'wait-film')?.evidenceIds).toContain('skin-post-23')
  })

  it('does not render a point if its only evidence is filtered by source type or freshness', () => {
    const query = { ...SKINCARE_SAMPLES[2], id: 'skin-q3' }
    const strict: typeof BASELINE_CONFIG = {
      ...BASELINE_CONFIG,
      evidence: { ...BASELINE_CONFIG.evidence, allowedKinds: ['note', 'comment'], freshnessDays: 90 },
    }
    const answer = renderAnswer(strict, query, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.filteredEvidence.some((item) => item.evidenceId === 'skin-post-11' && item.ruleId === 'freshness-window')).toBe(true)
    expect(answer.eligibleEvidenceIds).not.toContain('skin-post-11')
  })

  it('keeps the cooking answer body on existing components; planned parameter distribution stays out', () => {
    const answer = renderAnswer(FIXED_SCOPE_CONFIG, COOKING_QUERY, COOKING_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.sections.length).toBeGreaterThan(0)
    expect(answer.sections.every((section) => section.status === 'existing')).toBe(true)
    expect(answer.sections.map((section) => section.componentId)).not.toContain('parameter-distribution')
    expect(answer.sections.flatMap((section) => section.points).some((point) => point.id === 'egg-water-ratio')).toBe(true)
  })

  it('tracks cited sponsored sources and marks unlabeled commercial evidence as a guardrail regression', () => {
    const unlabeledConfig = {
      ...BASELINE_CONFIG,
      evidence: { ...BASELINE_CONFIG.evidence, labelSponsored: false },
    }
    const answer = renderAnswer(unlabeledConfig, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.sections.flatMap((section) => section.points).some((point) => point.evidenceIds.includes('skin-post-05'))).toBe(true)
    expect(answer.footer.sponsoredLabeledCount).toBe(0)
    const run = runCoverageCheck(BASELINE_CONFIG, unlabeledConfig, [SKINCARE_SAMPLES[0]], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(run.results[0].sponsoredUnlabeledAfter).toBe(1)
    expect(run.results[0].delta).toBe('regressed')
  })

  it('drops sponsored posts from the candidate pool when the commercial role disallows them', () => {
    const noSponsored = { ...BASELINE_CONFIG, evidence: { ...BASELINE_CONFIG.evidence, allowSponsored: false } }
    const answer = renderAnswer(noSponsored, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.sections.flatMap((section) => section.points).some((point) => point.evidenceIds.includes('skin-post-05'))).toBe(false)
    expect(answer.filteredEvidence.find((entry) => entry.evidenceId === 'skin-post-05')?.ruleId).toBe('allow-sponsored')
  })

  it('filters notes below the industry-ops like threshold but never comments', () => {
    const strict = { ...BASELINE_CONFIG, evidence: { ...BASELINE_CONFIG.evidence, minNoteLikes: 40 as const } }
    const answer = renderAnswer(strict, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const byLikes = answer.filteredEvidence.filter((entry) => entry.ruleId === 'min-note-likes').map((entry) => entry.evidenceId).sort()
    expect(byLikes).toEqual(['skin-post-01', 'skin-post-05', 'skin-post-07'])
    expect(answer.eligibleEvidenceIds).toContain('skin-post-04')
  })

  it('drops sponsored posts aimed at another persona when the commercial role requires a match', () => {
    const dryQuestion = { ...SKINCARE_SAMPLES[0], persona: '干皮' }
    const answer = renderAnswer(BASELINE_CONFIG, dryQuestion, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.filteredEvidence.find((entry) => entry.evidenceId === 'skin-post-05')?.ruleId).toBe('sponsored-persona-match')
    const off = { ...BASELINE_CONFIG, evidence: { ...BASELINE_CONFIG.evidence, sponsoredPersonaMatch: false } }
    expect(renderAnswer(off, dryQuestion, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE).eligibleEvidenceIds).toContain('skin-post-05')
  })

  it('caps sponsored posts per card at the community limit, keeping the highest-ranked one', () => {
    const extra = { ...SKINCARE_POSTS.find((post) => post.id === 'skin-post-05')!, id: 'skin-post-extra', date: '2026-06-01' }
    const answer = renderAnswer(BASELINE_CONFIG, SKINCARE_SAMPLES[0], [...SKINCARE_POSTS, extra], COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(answer.eligibleEvidenceIds).toContain('skin-post-05')
    expect(answer.filteredEvidence.find((entry) => entry.evidenceId === 'skin-post-extra')?.ruleId).toBe('sponsored-cap')
  })
})

describe('runCoverageCheck', () => {
  it('computes 6 improved, 1 same and 1 regressed from the 8 sample records', () => {
    const run = runCoverageCheck(BASELINE_CONFIG, REGRESSION_DEMO_CONFIG, SKINCARE_SAMPLES, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(run.results).toHaveLength(8)
    expect(run.summary).toEqual({ improved: 6, same: 1, regressed: 1 })
    expect(run.configVersion).toMatch(/^cfg-[a-f0-9]{8}$/)
    const regression = run.results.find((result) => result.sampleId === 'skin-q7')!
    expect(regression.delta).toBe('regressed')
    expect(regression.missedAfter).toContain('wait-film')
    expect(regression.reason).toContain('用法类')
    expect(regression.traceableRateAfter).toBe(1)
  })

  it('stores a detached config snapshot whose fingerprint matches the run version', () => {
    const run = runCoverageCheck(BASELINE_CONFIG, REGRESSION_DEMO_CONFIG, SKINCARE_SAMPLES, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    expect(run.configSnapshot).toEqual(REGRESSION_DEMO_CONFIG)
    expect(run.configSnapshot).not.toBe(REGRESSION_DEMO_CONFIG)
    expect(run.configVersion).toBe(getConfigVersion(run.configSnapshot))
    run.configSnapshot.presentation.groupByPersonaAppliesTo.push('做法类')
    expect(REGRESSION_DEMO_CONFIG.presentation.groupByPersonaAppliesTo).toEqual(['选购类', '用法类'])
  })

  it('counts stale citations against the fixed scene standard when the freshness window is loosened', () => {
    const loose = { ...FIXED_SCOPE_CONFIG, evidence: { ...FIXED_SCOPE_CONFIG.evidence, freshnessDays: '不限' as const } }
    const run = runCoverageCheck(FIXED_SCOPE_CONFIG, loose, SKINCARE_SAMPLES, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const sensitive = run.results.find((result) => result.sampleId === 'skin-q3')!
    expect(sensitive.staleCountBefore).toBe(0)
    expect(sensitive.staleCountAfter).toBe(1)
    expect(sensitive.delta).toBe('regressed')
    expect(sensitive.reason).toContain('时效标准')
  })

  it('re-running after narrowing scope removes the regression without hardcoded result counts', () => {
    const repairedRun = runCoverageCheck(BASELINE_CONFIG, FIXED_SCOPE_CONFIG, SKINCARE_SAMPLES, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const regression = repairedRun.results.find((result) => result.sampleId === 'skin-q7')!
    expect(repairedRun.summary).toEqual({ improved: 6, same: 2, regressed: 0 })
    expect(regression.missedAfter).not.toContain('wait-film')
    expect(regression.after.sections.flatMap((section) => section.points).some((point) => point.id === 'wait-film')).toBe(true)
  })
})

describe('reuseReport', () => {
  it('keeps the planned parameter chart visible but outside the reuse numerator and denominator', () => {
    const report = reuseReport(SKINCARE_TEMPLATE, USAGE_REUSE_TARGET, COMPONENTS, CAPABILITIES)
    expect(report.reusedAsIs.some((item) => item.id === 'source-footer')).toBe(true)
    expect(report.reusedAsIs.some((item) => item.id === 'step-list')).toBe(true)
    expect(report.reconfigured.some((item) => item.key === 'sampleSet')).toBe(true)
    expect(report.plannedExtensions.map((item) => item.id)).toContain('parameter-distribution')
    expect(report.denominator).toBe(report.reusedAsIs.length + report.reconfigured.length)
    expect(report.denominator).not.toBe(report.reusedAsIs.length + report.reconfigured.length + report.plannedExtensions.length)
    expect(report.reuseShare).toBe(report.reusedAsIs.length / report.denominator)
  })

  it('names reused strategies exactly as steps 01 and 02 do, grouped by step', () => {
    const report = reuseReport(SKINCARE_TEMPLATE, USAGE_REUSE_TARGET, COMPONENTS, CAPABILITIES, REUSABLE_RULES)
    const stepLabels = new Set(STRATEGY_ITEMS.map((item) => item.label))
    const filterNames = report.reusedAsIs.filter((item) => item.group === '筛选策略').map((item) => item.name)
    expect(filterNames).toContain('时效窗口')
    expect(filterNames).toContain('合作内容入卡上限')
    expect(filterNames).not.toContain('接入反馈评测结果')
    for (const item of report.reusedAsIs.filter((entry) => entry.kind === 'rule' && entry.group === '卡片模板')) expect(stepLabels.has(item.name)).toBe(true)
    expect(report.reusedAsIs.find((item) => item.id === 'conclusion')?.name).toBe('一句话结论')
    expect(report.reconfigured.find((item) => item.key === 'presentation.groupByPersona')?.label).toBe('按肤质分组')
  })
})
