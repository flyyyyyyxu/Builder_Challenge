import type { StrategyConfig } from '../types'

export const BASELINE_CONFIG: StrategyConfig = {
  evidence: {
    preferFirstHand: true,
    allowedKinds: ['note', 'comment'],
    freshnessDays: 180,
    includeCounterEvidence: true,
    labelSponsored: true,
  },
  presentation: {
    groupByPersona: false,
    groupByPersonaAppliesTo: ['选购类', '用法类'],
    showPitfall: true,
    showConclusion: true,
    componentOrder: ['conclusion', 'persona-groups', 'step-list', 'pitfall-card', 'source-footer'],
    groupPointLimit: 2,
  },
  guardrails: {
    sponsoredPosition: 'afterConclusion',
  },
}

/**
 * This explicit local draft enables persona grouping across shopping and usage questions.
 * The usage scope is intentionally broad so the fixed regression can be reproduced.
 */
export const REGRESSION_DEMO_CONFIG: StrategyConfig = {
  ...BASELINE_CONFIG,
  evidence: { ...BASELINE_CONFIG.evidence, allowedKinds: [...BASELINE_CONFIG.evidence.allowedKinds] },
  presentation: {
    ...BASELINE_CONFIG.presentation,
    groupByPersona: true,
    groupByPersonaAppliesTo: ['选购类', '用法类'],
    componentOrder: [...BASELINE_CONFIG.presentation.componentOrder],
  },
  guardrails: { ...BASELINE_CONFIG.guardrails },
}

/** Same presentation strategy with scope narrowed to shopping questions only. */
export const FIXED_SCOPE_CONFIG: StrategyConfig = {
  ...REGRESSION_DEMO_CONFIG,
  evidence: { ...REGRESSION_DEMO_CONFIG.evidence, allowedKinds: [...REGRESSION_DEMO_CONFIG.evidence.allowedKinds] },
  presentation: {
    ...REGRESSION_DEMO_CONFIG.presentation,
    groupByPersonaAppliesTo: ['选购类'],
    componentOrder: [...REGRESSION_DEMO_CONFIG.presentation.componentOrder],
  },
  guardrails: { ...REGRESSION_DEMO_CONFIG.guardrails },
}
