import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { AudioLines, Camera, ChevronLeft, ChevronRight, CirclePlus, Copy, Ellipsis, FileSearch, FileText, RotateCcw, Share2, Star, ThumbsDown } from 'lucide-react'
import { ROLE_TAB_LABELS } from '../../store'
import type { AnswerPoint, Post, QueryCategory, RenderedAnswer, StrategyConfig } from '../../types'
import { CARD_SLOTS, bodySlotOrder, hiddenSlotReason, type CardSlot, type SlotId } from './slots'
import './diandian.css'

type Section = RenderedAnswer['sections'][number]

export type DiandianPhoneProps = {
  answer: RenderedAnswer
  query: { text: string; category: QueryCategory; persona?: string }
  /** Config that produced `answer`; decides slot order and why a slot is missing. */
  config: StrategyConfig
  posts: Post[]
  labelSponsored: boolean
  /** Tool-layer pill above the card (not part of the 点点 UI), e.g. “草稿 · 实时预览”. */
  stateLabel: string
  stateTone?: 'draft' | 'neutral'
  /** Points shown only as “removed” ghosts, with the reason they dropped out. */
  ghostReasons?: Map<string, string>
  highlighted?: Set<string>
  showSlots?: boolean
  focusedSlot?: SlotId | null
  onOpenSource: (point: AnswerPoint) => void
  onSlotClick?: (slot: CardSlot) => void
}

function shortDate(date?: string) {
  return date ? date.slice(5) : ''
}

function SlotFrame({ slot, index, show, focused, hidden, onSlotClick, children, slotRef }: {
  slot: CardSlot
  index: number
  show: boolean
  focused: boolean
  hidden?: string
  onSlotClick?: (slot: CardSlot) => void
  children?: ReactNode
  slotRef: (node: HTMLDivElement | null) => void
}) {
  const strategy = `${slot.name} · ${ROLE_TAB_LABELS[slot.owner]}负责 · ${slot.binding}`
  const tagBody = <><span className="dd-slot-num">{index}</span>{slot.name}<em>{ROLE_TAB_LABELS[slot.owner]}</em>{onSlotClick && <ChevronRight size={10} />}</>
  return (
    <div ref={slotRef} className={`dd-slot is-${slot.id} ${show ? 'is-annotated' : ''} ${focused ? 'is-focused' : ''} ${hidden ? 'is-hidden' : ''}`} data-slot={slot.id}>
      {show && (onSlotClick
        ? <button type="button" className="dd-slot-tag" title={`${strategy}。点击查看负责的策略项`} onClick={() => onSlotClick(slot)}>{tagBody}</button>
        : <span className="dd-slot-tag" title={strategy}>{tagBody}</span>)}
      {hidden ? <div className="dd-slot-ghost">{slot.name} · {hidden}</div> : children}
    </div>
  )
}

export function DiandianPhone({
  answer, query, config, posts, labelSponsored, stateLabel, stateTone = 'neutral', ghostReasons, highlighted,
  showSlots = false, focusedSlot = null, onOpenSource, onSlotClick,
}: DiandianPhoneProps) {
  const postsById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts])
  const sectionsById = useMemo(() => new Map(answer.sections.map((section) => [section.componentId, section])), [answer])
  const chatRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef(new Map<SlotId, HTMLDivElement>())
  const setSlotRef = (id: SlotId) => (node: HTMLDivElement | null) => {
    if (node) slotRefs.current.set(id, node)
    else slotRefs.current.delete(id)
  }

  // Scroll only the phone's own chat area so editing a strategy item never moves the page.
  useEffect(() => {
    const chat = chatRef.current
    const node = focusedSlot ? slotRefs.current.get(focusedSlot) : null
    if (!chat || !node) return
    const top = node.getBoundingClientRect().top - chat.getBoundingClientRect().top + chat.scrollTop - 12
    const bottom = top + node.offsetHeight + 24
    if (top < chat.scrollTop || bottom > chat.scrollTop + chat.clientHeight) chat.scrollTo({ top, behavior: 'smooth' })
  }, [focusedSlot])

  const hasRealPoints = answer.sections.some((section) => section.points.some((point) => !ghostReasons?.has(point.id)))
  const body = bodySlotOrder(config)
  let slotIndex = 1

  const pointButton = (point: AnswerPoint, variant: 'headline' | 'line' = 'line') => {
    const sponsoredCount = point.evidenceIds.filter((id) => postsById.get(id)?.sponsored).length
    const ghost = ghostReasons?.get(point.id)
    const pulsing = highlighted?.has(point.id) && point.change !== 'unchanged'
    const diffTag = ghost !== undefined
      ? <span className="dd-diff is-removed">已移除</span>
      : point.change === 'added' ? <span className="dd-diff is-added">新增</span>
        : point.change === 'removed' ? <span className="dd-diff is-removed">改动后移除</span> : null
    return (
      <button
        type="button"
        key={point.id}
        className={`dd-pt is-${variant} ${point.change !== 'unchanged' ? `is-${point.change}` : ''} ${ghost !== undefined ? 'is-ghost' : ''} ${pulsing ? 'is-pulsing' : ''}`}
        onClick={() => onOpenSource(point)}
        title={ghost}
        aria-label={`查看引用来源：${point.text}`}
      >
        <span className="dd-pt-text">{point.lead && <b>{point.lead}：</b>}{point.text}</span>
        <span className="dd-cite"><FileText size={9} />{point.evidenceIds.length}</span>
        {sponsoredCount > 0 && <span className={`dd-spon ${labelSponsored ? '' : 'is-unlabeled'}`}>{labelSponsored ? `合作 ${sponsoredCount}` : `合作未标注 ${sponsoredCount}`}</span>}
        {diffTag}
      </button>
    )
  }

  const renderSection = (section: Section): ReactNode => {
    const slot = CARD_SLOTS[section.componentId as SlotId]
    switch (section.componentId) {
      case 'conclusion':
        return <div className="dd-headline">{section.points.map((point) => pointButton(point, 'headline'))}</div>
      case 'persona-groups': {
        const groups = new Map<string, AnswerPoint[]>()
        for (const point of section.points) groups.set(point.persona ?? '通用', [...(groups.get(point.persona ?? '通用') ?? []), point])
        return (
          <>
            <div className="dd-sec-title">{slot.emoji} {slot.heading}</div>
            {[...groups.entries()].map(([persona, points]) => (
              <div className="dd-group" key={persona}>
                <div className="dd-group-head"><span className="dd-group-name">{persona}</span>{persona === query.persona && <span className="dd-group-pill">你的肤质</span>}</div>
                <ul className="dd-dots">{points.map((point) => <li key={point.id}>{pointButton(point)}</li>)}</ul>
              </div>
            ))}
          </>
        )
      }
      case 'step-list':
        return (
          <>
            <div className="dd-sec-title">{slot.emoji} {slot.heading}</div>
            <ol className="dd-steps">{section.points.map((point) => <li key={point.id} className={ghostReasons?.has(point.id) ? 'is-ghost' : ''}>{pointButton(point)}</li>)}</ol>
          </>
        )
      case 'pitfall-card':
        return (
          <div className="dd-tip">
            <div className="dd-sec-title">{slot.emoji} {slot.heading}</div>
            <ul className="dd-dots">{section.points.map((point) => <li key={point.id}>{pointButton(point)}</li>)}</ul>
          </div>
        )
      default:
        return (
          <>
            <div className="dd-sec-title">{section.title}</div>
            <ul className="dd-dots">{section.points.map((point) => <li key={point.id}>{pointButton(point)}</li>)}</ul>
          </>
        )
    }
  }

  const footer = answer.footer
  return (
    <div className="dd-phone">
      <div className="dd-screen">
        <div className="dd-status"><span>9:41</span><span className="dd-island" /><span className="dd-sig">5G<span className="dd-bat" /></span></div>
        <div className="dd-nav"><ChevronLeft size={20} /><span className="dd-orb" /><strong>点点</strong><span className="dd-sim">规则模拟</span><Ellipsis size={18} className="dd-more" /></div>

        <div className="dd-chat" ref={chatRef}>
          <div className="dd-user">{query.text}</div>
          <div className={`dd-state is-${stateTone}`}><i />{stateLabel}</div>

          <div className="dd-answer">
            <SlotFrame slot={CARD_SLOTS['source-footer']} index={slotIndex++} show={showSlots} focused={focusedSlot === 'source-footer'} onSlotClick={onSlotClick} slotRef={setSlotRef('source-footer')}>
              <div className="dd-refs" title={footer.sponsoredLabeledCount > 0 ? `其中合作内容已标注 ${footer.sponsoredLabeledCount} 条` : undefined}>
                <span>参考 {footer.noteCount} 篇笔记{footer.commentCount > 0 ? ` · ${footer.commentCount} 条评论` : ''}</span>
                <span className="dd-avatars"><i /><i /><i /></span>
                <ChevronRight size={12} />
                {footer.latestDate && <span className="dd-date">截至 {shortDate(footer.latestDate)}</span>}
              </div>
            </SlotFrame>

            {!hasRealPoints && <div className="dd-empty"><FileSearch size={14} /><span>当前策略条件下没有足够的引用支持此答案。可调整来源条件或隐藏无来源结论。</span></div>}

            {body.map((id) => {
              const section = sectionsById.get(id)
              const slot = CARD_SLOTS[id]
              if (section && section.points.length > 0) {
                return <SlotFrame key={id} slot={slot} index={slotIndex++} show={showSlots} focused={focusedSlot === id} onSlotClick={onSlotClick} slotRef={setSlotRef(id)}>{renderSection(section)}</SlotFrame>
              }
              if (!showSlots && focusedSlot !== id) return null
              return <SlotFrame key={id} slot={slot} index={slotIndex++} show={showSlots} focused={focusedSlot === id} onSlotClick={onSlotClick} slotRef={setSlotRef(id)} hidden={hiddenSlotReason(id, config, query.category, answer)} />
            })}

            <div className="dd-actions" aria-hidden="true"><Copy size={15} /><Star size={15} /><Share2 size={15} /><span /><ThumbsDown size={15} /><RotateCcw size={15} /></div>
          </div>
        </div>

        <div className="dd-composer" aria-hidden="true"><AudioLines size={17} /><span>发消息或按住说话...</span><Camera size={17} /><CirclePlus size={17} /></div>
        <div className="dd-ai-note">内容由AI生成</div>
      </div>
    </div>
  )
}
