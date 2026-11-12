import type { ReuseTargetScene, StrategyTemplate } from '../types'
import { COMPONENTS } from './components-lib'
import { FIXED_SCOPE_CONFIG } from './strategy-config'

export const SKINCARE_TEMPLATE: StrategyTemplate = {
  id: 'skincare-answer-template',
  name: '护肤选购答案模板（示例）',
  sceneId: 'skincare-shopping',
  componentIds: ['conclusion', 'persona-groups', 'step-list', 'pitfall-card', 'source-footer'],
  capabilityIds: ['source-tracing', 'fixed-sample-check'],
  config: FIXED_SCOPE_CONFIG,
  isExample: true,
}

export const COOKING_REUSE_TARGET: ReuseTargetScene = {
  id: 'home-cooking-steps',
  vertical: '家常菜',
  intent: '做法步骤',
  requiredComponentIds: ['conclusion', 'step-list', 'pitfall-card', 'source-footer'],
  plannedComponentIds: COMPONENTS.filter((component) => component.status === 'planned').map((component) => component.id),
  requiredCapabilityIds: ['source-tracing', 'fixed-sample-check'],
  configChanges: [
    { key: 'presentation.groupByPersona', from: '按肤质分组', to: '按器具分组' },
    { key: 'presentation.groupByPersonaAppliesTo', from: '选购类', to: '做法类' },
    { key: 'sampleSet', from: '护肤固定样例集', to: '家常菜做法样例集（需重配）' },
  ],
}

export const CAPABILITIES = [
  { id: 'source-tracing', name: '引用溯源', status: 'existing' as const },
  { id: 'fixed-sample-check', name: '固定样例规则检查', status: 'existing' as const },
]
