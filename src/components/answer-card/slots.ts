import type { DemoRole } from '../../store'
import type { ConfigPath, QueryCategory, RenderedAnswer, StrategyConfig } from '../../types'

/** The six template slots of the 护肤 answer card; the 点点 card only re-skins them, it never adds new ones. */
export type SlotId = 'conclusion' | 'brand-voice' | 'persona-groups' | 'step-list' | 'pitfall-card' | 'source-footer'

export interface CardSlot {
  id: SlotId
  /** Slot name as it appears in the card template (step 01). */
  name: string
  /** Heading used inside the 点点 card; empty for the headline-style conclusion and the reference row. */
  heading: string
  emoji: string
  /** Role tab on step 01 that owns this slot. */
  owner: DemoRole
  /** Strategy items that switch, scope or order this slot. */
  paths: ConfigPath[]
  /** How the slot is bound in the template. */
  binding: string
}

export const CARD_SLOTS: Record<SlotId, CardSlot> = {
  conclusion: {
    id: 'conclusion', name: '一句话结论', heading: '', emoji: '', owner: 'industry_ops',
    paths: ['presentation.showConclusion', 'presentation.componentOrder'],
    binding: '开关「一句话结论」',
  },
  'brand-voice': {
    id: 'brand-voice', name: '品牌说', heading: '品牌说', emoji: '', owner: 'ads',
    paths: ['guardrails.sponsoredPosition', 'evidence.allowSponsored', 'evidence.sponsoredPersonaMatch'],
    binding: '位置由商业化提议、受社区治理底线约束（不早于结论）',
  },
  'persona-groups': {
    id: 'persona-groups', name: '按肤质分组', heading: '按肤质挑质地', emoji: '✨', owner: 'industry_ops',
    paths: ['presentation.groupByPersona', 'presentation.groupByPersonaAppliesTo', 'presentation.componentOrder'],
    binding: '开关「按肤质分组」+ 分组适用范围',
  },
  'step-list': {
    id: 'step-list', name: '步骤列表', heading: '正确步骤', emoji: '📝', owner: 'industry_ops',
    paths: ['presentation.componentOrder'],
    binding: '常驻，只参与排序',
  },
  'pitfall-card': {
    id: 'pitfall-card', name: '踩坑提醒', heading: '踩坑提醒', emoji: '⚠️', owner: 'industry_ops',
    paths: ['presentation.showPitfall', 'presentation.componentOrder'],
    binding: '开关「踩坑提醒」',
  },
  'source-footer': {
    id: 'source-footer', name: '来源底栏与溯源', heading: '', emoji: '', owner: 'community',
    // The reference row's counts and date move with every step-02 filter rule.
    paths: [
      'evidence.labelSponsored', 'evidence.allowedKinds', 'evidence.freshnessDays', 'evidence.minNoteLikes',
      'evidence.preferFirstHand', 'evidence.preferMatchingPersona', 'evidence.allowSponsored',
      'evidence.sponsoredPersonaMatch', 'evidence.includeCounterEvidence', 'evidence.sponsoredCap',
    ],
    binding: '社区治理锁定 · 固定在卡片顶部',
  },
}

/** Body slots in template order; the reference row is pinned on top and 品牌说 sits right after the conclusion. */
export function bodySlotOrder(config: StrategyConfig): SlotId[] {
  const ids = config.presentation.componentOrder.filter((id): id is SlotId => id in CARD_SLOTS && id !== 'source-footer' && id !== 'brand-voice')
  for (const id of ['conclusion', 'persona-groups', 'step-list', 'pitfall-card'] as SlotId[]) if (!ids.includes(id)) ids.push(id)
  const conclusionAt = ids.indexOf('conclusion')
  const brandAt = config.guardrails.sponsoredPosition === 'beforeConclusion' ? conclusionAt : conclusionAt + 1
  ids.splice(brandAt, 0, 'brand-voice')
  return ids
}

/** The first slot whose template binding mentions this strategy item; used to light up the card from the editor. */
export function slotForPath(path: ConfigPath): SlotId | null {
  if (path === 'presentation.componentOrder') return null
  const slot = (Object.values(CARD_SLOTS) as CardSlot[]).find((entry) => entry.paths.includes(path))
  return slot?.id ?? null
}

/** Why a template slot is absent from this answer, phrased in the template's own terms. */
export function hiddenSlotReason(slot: SlotId, config: StrategyConfig, category: QueryCategory, answer: RenderedAnswer): string {
  const p = config.presentation
  if (slot === 'conclusion' && !p.showConclusion) return '模板中已关闭'
  if (slot === 'brand-voice') return config.evidence.allowSponsored ? '这道题没有通过筛选的合作内容' : '商业化未允许合作内容进入候选'
  if (slot === 'pitfall-card' && !p.showPitfall) return '模板中已关闭'
  if (slot === 'persona-groups') {
    if (!p.groupByPersona) return '模板中已关闭'
    if (!p.groupByPersonaAppliesTo.includes(category)) return `「${category}」不在分组适用范围`
  }
  if (answer.omittedPoints.some((point) => point.ruleId === 'existing-component-support')) return '组件不承载这类要点'
  return '这道题没有可放进该槽位的要点'
}
