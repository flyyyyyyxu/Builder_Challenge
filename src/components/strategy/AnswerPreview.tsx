import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, LayoutTemplate, Sparkles, Tags } from 'lucide-react'
import type { AnswerPoint, Post, QueryCategory, RenderedAnswer, StrategyConfig } from '../../types'
import type { PreviewVersion } from '../../store'
import { DiandianPhone } from '../answer-card/DiandianPhone'
import type { CardSlot, SlotId } from '../answer-card/slots'

export type CheckStatus =
  | { kind: 'not-run' }
  | { kind: 'current'; summary: { improved: number; same: number; regressed: number } }
  | { kind: 'stale' }

function checkStatusLabel(status: CheckStatus): string {
  if (status.kind === 'not-run') return '样例检查尚未运行'
  if (status.kind === 'stale') return '草稿已变更 · 需重跑'
  return status.summary.regressed > 0 ? `已检查 · ${status.summary.regressed} 条回归` : '已检查 · 无回归'
}

type Props = {
  before: RenderedAnswer
  after: RenderedAnswer
  /** Configs that produced `before` / `after`; they drive slot order and why a template slot is empty. */
  beforeConfig: StrategyConfig
  afterConfig: StrategyConfig
  query: { text: string; category: QueryCategory; persona?: string }
  mode: PreviewVersion
  onModeChange: (mode: PreviewVersion) => void
  onOpenSource: (point: AnswerPoint) => void
  onNavigateCoverage?: () => void
  diffSummary?: string
  isDraftModified: boolean
  checkStatus?: CheckStatus
  labelSponsored: boolean
  posts: Post[]
  /** Embedded (regression page): only the before/after tabs and the card, without workspace captions or CTA. */
  embedded?: boolean
  /** Template the card is rendered from, e.g. “护肤测评 · 选购 · 草稿 v1.2”. */
  templateLabel?: string
  /** Slot to light up because its strategy item is being edited. */
  focusedSlot?: SlotId | null
  /** Clicking a slot tag jumps to the strategy items that own it. */
  onSlotClick?: (slot: CardSlot) => void
  defaultShowSlots?: boolean
}

export function markAnswerDiff(before: RenderedAnswer, after: RenderedAnswer) {
  const beforeKeys = new Set(before.sections.flatMap((section) => section.points.map((point) => point.id)))
  const afterKeys = new Set(after.sections.flatMap((section) => section.points.map((point) => point.id)))
  const mark = (answer: RenderedAnswer, counterpart: Set<string>, side: 'before' | 'after'): RenderedAnswer => ({
    ...answer,
    sections: answer.sections.map((section) => ({
      ...section,
      points: section.points.map((point) => ({
        ...point,
        change: counterpart.has(point.id) ? 'unchanged' : side === 'after' ? 'added' : 'removed',
      })),
    })),
  })
  return { before: mark(before, afterKeys, 'before'), after: mark(after, beforeKeys, 'after') }
}

/** In the “after” view, points the draft dropped stay visible as struck-through ghosts at their old position. */
export function withRemovedGhosts(after: RenderedAnswer, before: RenderedAnswer): { answer: RenderedAnswer; ghostReasons: Map<string, string> } {
  const ghostReasons = new Map<string, string>()
  const sections = after.sections.map((section) => ({ ...section, points: [...section.points] }))
  for (const beforeSection of before.sections) {
    const removed = beforeSection.points.filter((point) => point.change === 'removed')
    if (removed.length === 0) continue
    let target = sections.find((section) => section.componentId === beforeSection.componentId)
    if (!target) {
      target = { ...beforeSection, points: [] }
      sections.push(target)
    }
    for (const point of removed) {
      const omitted = after.omittedPoints.find((entry) => entry.pointKey === point.id)
      const filtered = after.filteredEvidence.find((entry) => point.evidenceIds.includes(entry.evidenceId))
      ghostReasons.set(point.id, omitted?.reason ?? (filtered ? `支撑该要点的帖子被筛除：${filtered.reason}` : '改动后未进入答案。'))
      const beforeIndex = beforeSection.points.findIndex((entry) => entry.id === point.id)
      const anchor = beforeSection.points.slice(0, beforeIndex).reverse().find((entry) => target!.points.some((kept) => kept.id === entry.id))
      const at = anchor ? target.points.findIndex((kept) => kept.id === anchor.id) + 1 : 0
      target.points.splice(at, 0, point)
    }
  }
  return { answer: { ...after, sections }, ghostReasons }
}

export function AnswerPreview({
  before, after, beforeConfig, afterConfig, query, mode, onModeChange, onOpenSource, onNavigateCoverage, diffSummary,
  isDraftModified, checkStatus, labelSponsored, posts, embedded = false, templateLabel, focusedSlot, onSlotClick, defaultShowSlots = false,
}: Props) {
  const { answer, ghostReasons } = useMemo(
    () => mode === 'before' ? { answer: before, ghostReasons: new Map<string, string>() } : withRemovedGhosts(after, before),
    [mode, before, after],
  )
  const changedIds = useMemo(() => new Set(answer.sections.flatMap((section) => section.points.filter((point) => point.change !== 'unchanged').map((point) => point.id))), [answer])
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [showSlots, setShowSlots] = useState(defaultShowSlots)

  useEffect(() => {
    setHighlighted(changedIds)
    const timer = window.setTimeout(() => setHighlighted(new Set()), 1750)
    return () => window.clearTimeout(timer)
  }, [changedIds])

  const stateLabel = mode === 'before' ? '改动前 · 基线' : embedded ? '改动后 · 本次运行配置' : isDraftModified ? '草稿 · 实时预览' : '与基线一致'

  return (
    <div className={`s2-preview-card ${embedded ? 'is-embedded' : ''}`}>
      <div className="s2-preview-controls">
        <div className="s2-preview-version-label">{embedded ? '答案卡预览' : '预览版本'}</div>
        <div className="s2-preview-control-group">
          <button type="button" className={`s2-slot-toggle ${showSlots ? 'is-on' : ''}`} aria-pressed={showSlots} onClick={() => setShowSlots((on) => !on)} title="在卡片上标出模板槽位和负责角色"><Tags size={12} />槽位</button>
          <div className="s2-segmented-control" role="group" aria-label="切换改动前后预览">
            <button type="button" aria-pressed={mode === 'before'} className={mode === 'before' ? 'is-selected' : ''} onClick={() => onModeChange('before')}>改动前</button>
            <button type="button" aria-pressed={mode === 'after'} className={mode === 'after' ? 'is-selected' : ''} onClick={() => onModeChange('after')}>改动后</button>
          </div>
        </div>
      </div>
      {templateLabel && <div className="s2-preview-template"><LayoutTemplate size={12} /><span>模板</span><strong>{templateLabel}</strong></div>}
      {!embedded && diffSummary && <div className="s2-diff-summary" aria-live="polite"><span className="s2-diff-mark"><Sparkles size={13} /></span><span>{diffSummary}</span></div>}

      <DiandianPhone
        answer={answer}
        query={query}
        config={mode === 'before' ? beforeConfig : afterConfig}
        posts={posts}
        labelSponsored={labelSponsored}
        stateLabel={stateLabel}
        stateTone={mode === 'after' && isDraftModified ? 'draft' : 'neutral'}
        ghostReasons={ghostReasons}
        highlighted={highlighted}
        showSlots={showSlots}
        focusedSlot={focusedSlot}
        onOpenSource={onOpenSource}
        onSlotClick={onSlotClick}
      />

      <div className="s2-preview-caption"><span>点击答案中的要点，可查看引用的原帖{onSlotClick ? '；打开「槽位」后点槽位名可跳到负责的策略项' : ''}。</span></div>
      {!embedded && onNavigateCoverage && checkStatus && <button type="button" className="s2-go-coverage" onClick={onNavigateCoverage}>运行回归检查 <ArrowRight size={14} /><span className={`s2-check-status is-${checkStatus.kind}${checkStatus.kind === 'current' && checkStatus.summary.regressed > 0 ? ' has-regression' : ''}`}>{checkStatusLabel(checkStatus)}</span></button>}
    </div>
  )
}
