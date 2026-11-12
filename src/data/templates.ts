import type { ReusableRule, ReuseTargetScene, StrategyTemplate } from '../types'
import { COMPONENTS } from './components-lib'
import { FILTER_RULES } from './filter-rules'
import { FIXED_SCOPE_CONFIG } from './strategy-config'
import { STRATEGY_ITEMS, STRATEGY_ITEMS_BY_PATH } from './strategy-items'

export const SKINCARE_TEMPLATE: StrategyTemplate = {
  id: 'skincare-answer-template',
  name: '护肤测评 · 选购',
  sceneId: 'skincare-shopping',
  componentIds: ['conclusion', 'persona-groups', 'step-list', 'pitfall-card', 'source-footer'],
  capabilityIds: ['source-tracing', 'fixed-sample-check'],
  config: FIXED_SCOPE_CONFIG,
  isExample: true,
}

/** Template rules (step 01) and filter rules (step 02), named exactly as on those pages. */
export const REUSABLE_RULES: ReusableRule[] = [
  ...['sponsored-label', 'sponsored-position'].map((id) => {
    const item = STRATEGY_ITEMS.find((entry) => entry.id === id)!
    return { id, name: item.label, group: '卡片模板' as const }
  }),
  ...FILTER_RULES.filter((rule) => rule.badge !== '开发中').map((rule) => ({
    id: rule.id,
    name: rule.path ? STRATEGY_ITEMS_BY_PATH[rule.path].label : rule.label ?? rule.id,
    group: '筛选策略' as const,
  })),
]

/** Reuse target inside the same vertical: 护肤 · 选购怎么选 → 护肤 · 怎么使用. */
export const USAGE_REUSE_TARGET: ReuseTargetScene = {
  id: 'skincare-usage',
  vertical: '护肤',
  intent: '怎么使用',
  requiredComponentIds: ['conclusion', 'step-list', 'pitfall-card', 'source-footer'],
  plannedComponentIds: COMPONENTS.filter((component) => component.status === 'planned').map((component) => component.id),
  requiredCapabilityIds: ['fixed-sample-check'],
  // Same vertical, same post pool: every template rule and filter rule carries over unchanged.
  requiredRuleIds: REUSABLE_RULES.map((rule) => rule.id),
  configChanges: [
    { key: 'presentation.groupByPersona', label: '按肤质分组', stage: '卡片模板', from: '开启', to: '关闭，按步骤完整呈现' },
    { key: 'presentation.componentOrder', label: '组件顺序', stage: '卡片模板', from: '一句话结论 → 肤质分组 → 步骤列表 → 踩坑提醒', to: '一句话结论 → 步骤列表 → 踩坑提醒' },
    { key: 'sampleSet', label: '固定样例集', stage: '回归检查', from: '护肤选购样例（8 条）', to: '护肤用法样例（需补充标注）' },
  ],
}

export const CAPABILITIES = [
  { id: 'source-tracing', name: '来源底栏与溯源', status: 'existing' as const },
  { id: 'fixed-sample-check', name: '回归检查规则', status: 'existing' as const },
]

/** Card-template library shown on step 01; only the skincare template is interactive in the demo. */
export const TEMPLATE_LIBRARY = [
  { id: 'skincare-answer-template', name: '护肤测评 · 选购', sceneCount: 3, interactive: true },
  { id: 'travel-guide-template', name: '旅行攻略', sceneCount: 5, interactive: false },
  { id: 'study-experience-template', name: '学习经验', sceneCount: 2, interactive: false },
  { id: 'home-cooking-template', name: '家常菜做法', sceneCount: 4, interactive: false },
] as const

/** Version the current scene is pinned to, and the version a new draft would become. */
export const TEMPLATE_PINNED_VERSION = 'v1.1'
export const TEMPLATE_DRAFT_VERSION = 'v1.2'

/** Example version history; each entry records which role changed which slot. All entries are fictional. */
export const TEMPLATE_VERSION_HISTORY = [
  { version: 'v1.1', role: 'industry_ops' as const, date: '2026-10-28', note: '调整组件顺序：一句话结论置顶' },
  { version: 'v1.0', role: 'community' as const, date: '2026-10-12', note: '锁定来源底栏；设定合作内容不早于结论' },
  { version: 'v1.0', role: 'ads' as const, date: '2026-10-12', note: '设定品牌说位于结论之后' },
  { version: 'v1.0', role: 'industry_ops' as const, date: '2026-10-12', note: '创建模板：一句话结论、步骤列表、来源底栏与溯源' },
]
