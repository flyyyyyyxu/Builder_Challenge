import { describe, expect, it } from 'vitest'
import {
  BASELINE_CONFIG,
  CAPABILITIES,
  COMPONENTS,
  COOKING_POSTS,
  COOKING_QUERY,
  COOKING_REUSE_TARGET,
  DEMO_AS_OF_DATE,
  FIXED_SCOPE_CONFIG,
  POINT_CATALOG,
  REGRESSION_DEMO_CONFIG,
  SKINCARE_POSTS,
  SKINCARE_SAMPLES,
  SKINCARE_TEMPLATE,
  STRATEGY_ITEMS,
} from '../data'
import { detectConflicts, getConfigVersion, renderAnswer, resolveConfig, reuseReport, runCoverageCheck } from './index'

describe('mock data contracts', () => {
  it('keeps the agreed source and fixed sample counts, with independent fictional annotations', () => {
    expect(SKINCARE_POSTS).toHaveLength(25)
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
  it('only renders points backed by eligible sources and existing components, with source traces', () => {
    const answer = renderAnswer(REGRESSION_DEMO_CONFIG, SKINCARE_SAMPLES[0], SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const rendered = answer.sections.flatMap((section) => section.points)
    expect(rendered.some((point) => point.id === 'oil-light-texture')).toBe(true)
    expect(rendered.every((point) => point.evidenceIds.length > 0)).toBe(true)
    expect(rendered.every((point) => COMPONENTS.find((component) => component.id === point.componentId)?.status === 'existing')).toBe(true)
    expect(rendered.find((point) => point.id === 'oil-light-texture')?.trace.length).toBeGreaterThan(0)
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
    expect(regression.reason).toContain('等待防晒成膜')
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
    const report = reuseReport(SKINCARE_TEMPLATE, COOKING_REUSE_TARGET, COMPONENTS, CAPABILITIES)
    expect(report.reusedAsIs.some((item) => item.id === 'source-footer')).toBe(true)
    expect(report.reusedAsIs.some((item) => item.id === 'step-list')).toBe(true)
    expect(report.reconfigured.some((item) => item.key === 'sampleSet')).toBe(true)
    expect(report.plannedExtensions.map((item) => item.id)).toContain('parameter-distribution')
    expect(report.denominator).toBe(report.reusedAsIs.length + report.reconfigured.length)
    expect(report.denominator).not.toBe(report.reusedAsIs.length + report.reconfigured.length + report.plannedExtensions.length)
    expect(report.reuseShare).toBe(report.reusedAsIs.length / report.denominator)
  })
})
