import type { ConfigPath, ConfigValue, Role } from '../types'

/**
 * Post-filter rules on step 02, grouped by the role that owns them.
 *
 * Ownership principle: whoever bears the consequence of a rule owns it.
 * - 行业运营 knows the vertical: which posts are useful for this kind of question.
 * - 商业化 manages commercial supply: whether partner content takes part, and for whom.
 * - 社区治理 holds the floor every other role's rules must stay within: balance, ad volume, account penalties.
 *
 * A rule with a `path` edits a config field; deleting it sets that field to `neutral`, i.e. the rule no longer filters
 * or reorders anything. A rule without a `path` is a fixed capability shown for completeness (its `badge` says why).
 */
export interface FilterRuleDef {
  id: string
  role: Extract<Role, 'industry_ops' | 'ads' | 'community'>
  path?: ConfigPath
  neutral?: ConfigValue
  /** Used for rules without a config path. */
  label?: string
  description?: string
  badge?: string
}

export const FILTER_RULES: FilterRuleDef[] = [
  { id: 'allowed-kinds', role: 'industry_ops', path: 'evidence.allowedKinds', neutral: ['note', 'comment'] },
  { id: 'freshness-window', role: 'industry_ops', path: 'evidence.freshnessDays', neutral: '不限' },
  { id: 'min-note-likes', role: 'industry_ops', path: 'evidence.minNoteLikes', neutral: 0 },
  { id: 'prefer-first-hand', role: 'industry_ops', path: 'evidence.preferFirstHand', neutral: false },
  { id: 'prefer-matching-persona', role: 'industry_ops', path: 'evidence.preferMatchingPersona', neutral: false },

  { id: 'allow-sponsored', role: 'ads', path: 'evidence.allowSponsored', neutral: true },
  { id: 'sponsored-persona-match', role: 'ads', path: 'evidence.sponsoredPersonaMatch', neutral: false },
  {
    id: 'brand-qualification',
    role: 'ads',
    label: '合作品牌须有品类资质',
    description: '防晒属于特殊化妆品，合作品牌需持有对应注册证才能进入候选。资质审核本来就在商业化的广告审核链路里，这里直接复用资质库的结果。',
    badge: '对接资质库',
  },

  { id: 'counter-evidence', role: 'community', path: 'evidence.includeCounterEvidence', neutral: true },
  { id: 'sponsored-cap', role: 'community', path: 'evidence.sponsoredCap', neutral: '不限' },
  {
    id: 'penalized-authors',
    role: 'community',
    label: '处罚期账号的内容不入卡',
    description: '因虚假种草、搬运等被处罚的账号，在处罚期内的帖子不进入答案卡，与社区已有的处罚结果保持一致。',
    badge: '对接处罚记录',
  },
  {
    id: 'feedback-eval',
    role: 'community',
    label: '接入反馈评测结果',
    description: '用户反馈过的帖子经评测打分后分级处置：高置信自动移出或降权，中置信进入人工复核。',
    badge: '开发中',
  },
]

export const FILTER_RULES_BY_ID = Object.fromEntries(FILTER_RULES.map((rule) => [rule.id, rule])) as Record<string, FilterRuleDef>

/** One-line statement of what each role owns, shown above its tab on steps 01 and 02. */
export const ROLE_DUTIES = {
  template: {
    industry_ops: '负责卡片的内容结构：这个垂类的用户最需要先看到什么、怎么分组。',
    ads: '负责合作内容在卡片里的露出方式，只能在社区治理的底线之内调整。',
    community: '负责卡片里其他角色都不能改的部分：来源可查、合作可识别、商业内容不压过结论。',
  },
  filter: {
    industry_ops: '懂这个垂类，判断什么样的帖子对这类问题有用：形态、时效、互动和匹配度。',
    ads: '管理合作内容的商业供给：这个场景是否开放、投给哪类人群、品牌是否合规。',
    community: '守住入卡底线：立场平衡、合作内容不过量、违规账号不入卡。其他角色的规则不能越过这些底线。',
  },
} as const
