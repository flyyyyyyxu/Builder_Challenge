import type { ConfigPath, StrategyItem } from '../types'

const ops = {
  role: 'industry_ops' as const,
  team: '护肤行业运营（示例）',
  name: '演示操作者（虚构）',
  isExample: true as const,
}
const ads = {
  role: 'ads' as const,
  team: '商业化（示例）',
  name: '示例商业负责人（虚构）',
  isExample: true as const,
}
const community = {
  role: 'community' as const,
  team: '社区治理（示例）',
  name: '示例规则负责人（虚构）',
  isExample: true as const,
}

export const STRATEGY_ITEMS: StrategyItem[] = [
  // ── 筛选策略 · 行业运营：懂这个垂类，判断什么样的帖子对这类问题有用 ──
  { id: 'allowed-kinds', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.allowedKinds', label: '内容来源类型', value: ['note', 'comment'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '护肤笔记的评论区常有“用了一周搓泥”这类补充反馈，是否纳入评论因垂类而异。' },
  { id: 'freshness-window', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.freshnessDays', label: '时效窗口', value: 180, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '防晒配方迭代快、有季节性，窗口长短取决于这个垂类的内容更新节奏。' },
  { id: 'min-note-likes', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.minNoteLikes', label: '笔记互动门槛', value: 0, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '低于门槛的笔记不入卡，评论不受限制。各垂类的互动量级不同；门槛过高会挤掉素人的真实经验。' },
  { id: 'prefer-first-hand', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.preferFirstHand', label: '优先展示亲身经验', value: true, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '护肤看实际上脸的感受。只调整排序；哪些帖子算亲身经验由平台识别，不代表平台验证了真实性。' },
  { id: 'prefer-matching-persona', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.preferMatchingPersona', label: '同肤质经验优先', value: false, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '提问里带了肤质（如油皮）时，同肤质用户的帖子排在前面。只调整排序，不减少入卡帖子。' },
  // ── 筛选策略 · 商业化：管理合作内容的商业供给 ──
  { id: 'allow-sponsored', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.allowSponsored', label: '允许合作内容进入候选', value: true, setBy: ads, source: 'scene-template', isExampleGuardrail: false, editableBy: ['ads'], explanation: '这个场景是否开放给合作内容，取决于商业化的投放规划。关闭后合作内容不进入候选。' },
  { id: 'sponsored-persona-match', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.sponsoredPersonaMatch', label: '合作内容须匹配提问人群', value: true, setBy: ads, source: 'scene-template', isExampleGuardrail: false, editableBy: ['ads'], explanation: '面向干皮的合作笔记不出现在油皮的问题下。人群定向本来就是商业化的工作，投错人群对品牌和用户都没有好处。' },
  // ── 筛选策略 · 社区治理：守住入卡底线，其他角色的规则不能越过 ──
  { id: 'counter-evidence', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.includeCounterEvidence', label: '保留正反面经验', value: true, setBy: community, source: 'example-guardrail', isExampleGuardrail: false, editableBy: ['community'], explanation: '答案卡里要能看到“不推荐”和踩坑经验，不能只剩正面种草。归社区治理负责，避免在商业或运营压力下被关掉。' },
  { id: 'sponsored-cap', sceneId: 'skincare-shopping', tab: 'evidence', key: 'evidence.sponsoredCap', label: '合作内容入卡上限', value: 1, setBy: community, source: 'example-guardrail', isExampleGuardrail: false, editableBy: ['community'], explanation: '每张答案卡最多放几条合作内容。上限由社区治理设定，商业化只能在这个范围内调整供给。' },
  // ── 卡片模板 · 行业运营 ──
  { id: 'conclusion-card', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.showConclusion', label: '一句话结论', value: true, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '选购类问题用户想先看到结论。结论必须关联来源，没有依据时不补写。' },
  { id: 'persona-grouping', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.groupByPersona', label: '按肤质分组', value: false, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '护肤的答案往往因肤质而异，把经验按油皮、干皮等分开呈现。' },
  { id: 'persona-group-scope', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.groupByPersonaAppliesTo', label: '分组适用范围', value: ['选购类', '用法类'], appliesTo: ['选购类', '用法类'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '分组对哪类问题生效。用法类问题按肤质拆分会打断步骤，范围设宽可能造成回归。' },
  { id: 'pitfall-card', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.showPitfall', label: '踩坑提醒', value: false, setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '单独列出搓泥、闷痘这类常见踩坑，只展示有引用依据的经验。' },
  { id: 'component-order', sceneId: 'skincare-shopping', tab: 'presentation', key: 'presentation.componentOrder', label: '组件顺序', value: ['conclusion', 'persona-groups', 'step-list', 'pitfall-card', 'source-footer'], setBy: ops, source: 'scene-template', isExampleGuardrail: false, editableBy: ['industry_ops', 'dots_pm'], explanation: '调整已有组件在卡片中的先后顺序。关闭的组件不参与排序；来源底栏固定在末尾。' },
  // ── 卡片模板 · 社区治理 ──
  { id: 'sponsored-label', sceneId: 'skincare-shopping', tab: 'presentation', key: 'evidence.labelSponsored', label: '合作内容标识', value: true, setBy: community, source: 'example-guardrail', isExampleGuardrail: false, editableBy: [], explanation: '合作内容在卡片里必须带“合作”标识。广告法要求广告具有可识别性，因此锁定为始终开启。' },
  { id: 'sponsored-position', sceneId: 'skincare-shopping', tab: 'guardrail', key: 'guardrails.sponsoredPosition', label: '合作内容不早于结论', value: 'afterConclusion', setBy: community, source: 'example-guardrail', isExampleGuardrail: true, editableBy: [], explanation: '社区底线规则：商业内容只能出现在一句话结论之后；其他角色的调整只会生成待讨论事项。' },
]

export const STRATEGY_ITEMS_BY_PATH = Object.fromEntries(
  STRATEGY_ITEMS.map((item) => [item.key as ConfigPath, item]),
) as Record<ConfigPath, StrategyItem>
