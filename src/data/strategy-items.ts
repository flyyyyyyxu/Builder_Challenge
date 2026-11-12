import type { ConfigPath, StrategyItem } from '../types'

const ops = {
  role: 'industry_ops' as const,
  team: '护肤行业运营（示例）',
  name: '演示操作者（虚构）',
  isExample: true as const,
}
const platform = {
  role: 'dots_pm' as const,
  team: '平台默认配置（示例）',
  name: '演示平台配置（虚构）',
  isExample: true as const,
}
const community = {
  role: 'community' as const,
  team: '社区治理（示例）',
  name: '示例规则负责人（虚构）',
  isExample: true as const,
}

export const STRATEGY_ITEMS: StrategyItem[] = [
  { id: 'prefer-first-hand', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.preferFirstHand', label: '优先展示亲身经验', value: true, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '只改变候选来源排序，不代表平台验证了内容真实性。' },
  { id: 'allowed-kinds', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.allowedKinds', label: '内容来源类型', value: ['note', 'comment'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '在已有笔记与评论类型中筛选，不接入新数据源。' },
  { id: 'freshness-window', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.freshnessDays', label: '时效窗口', value: 180, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '按发布日期过滤超过窗口的示例内容。' },
  { id: 'counter-evidence', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.includeCounterEvidence', label: '保留正反面经验', value: true, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '保留不同立场作为可追溯的经验样例，不把计数视为真实性证明。' },
  { id: 'sponsored-label', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.labelSponsored', label: '商业内容标注', value: true, setBy: platform, source: 'platform-default', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '合作内容进入候选时保留商业标注。' },
  { id: 'persona-grouping', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.groupByPersona', label: '按肤质分组', value: false, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '仅使用已有分组组件；影响范围由适用问题类型限定。' },
  { id: 'persona-group-scope', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.groupByPersonaAppliesTo', label: '分组适用范围', value: ['选购类', '用法类'], appliesTo: ['选购类', '用法类'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '默认示例范围包含用法类，用于复现一条可解释的模拟回归。' },
  { id: 'pitfall-card', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.showPitfall', label: '踩坑提醒', value: true, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '只展示有引用依据且由现有提醒组件承载的内容。' },
  { id: 'conclusion-card', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.showConclusion', label: '一句话结论', value: true, setBy: platform, source: 'platform-default', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '结论条必须关联来源，不对无证据内容补写结论。' },
  { id: 'component-order', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.componentOrder', label: '已有组件顺序', value: ['conclusion', 'persona-groups', 'step-list', 'pitfall-card', 'source-footer'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '仅调整当前场景已有答案组件的排列，不创建新组件。' },
  { id: 'sponsored-position', sceneId: 'skincare-shopping', tab: 'guardrail', key: 'guardrails.sponsoredPosition', label: '商业内容呈现位置', value: 'afterConclusion', setBy: community, source: 'example-guardrail', isExampleGuardrail: true, editableBy: [], explanation: '示例护栏 · 只读；冲突时仅生成待讨论事项，不自动采纳。' },
]

export const STRATEGY_ITEMS_BY_PATH = Object.fromEntries(
  STRATEGY_ITEMS.map((item) => [item.key as ConfigPath, item]),
) as Record<ConfigPath, StrategyItem>
