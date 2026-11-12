import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, FileSearch, Sparkles } from 'lucide-react'
import type { AnswerPoint, Post, RenderedAnswer } from '../../types'
import type { PreviewVersion } from '../../store'

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
  queryText: string
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

function pointRows(points: AnswerPoint[], onOpenSource: (point: AnswerPoint) => void, postsById: Map<string, Post>, labelSponsored: boolean, highlighted: Set<string>) {
  return points.map((point) => {
    const sponsoredCount = point.evidenceIds.filter((id) => postsById.get(id)?.sponsored).length
    const isHighlighted = highlighted.has(point.id) && point.change !== 'unchanged'
    return (
      <button
        type="button"
        key={point.id}
        className={`s2-answer-point ${point.change !== 'unchanged' ? `is-${point.change}` : ''} ${isHighlighted ? 'is-pulsing' : ''}`}
        onClick={() => onOpenSource(point)}
        aria-label={`查看引用来源：${point.text}`}
      >
        <span className="s2-answer-point-text">{point.text}</span>
        <span className="s2-answer-point-footer">
          <span><FileSearch size={12} />{point.evidenceIds.length} 条模拟来源</span>
          {sponsoredCount > 0 && <span className={labelSponsored ? 's2-sponsored-tag' : 's2-sponsored-tag is-unlabeled'}>{labelSponsored ? `合作内容已标注 · ${sponsoredCount}` : `合作内容未标注 · ${sponsoredCount}`}</span>}
          <span className="s2-view-source">查看溯源 <ArrowRight size={12} /></span>
        </span>
      </button>
    )
  })
}

function AnswerSection({ section, onOpenSource, postsById, labelSponsored, highlighted }: {
  section: RenderedAnswer['sections'][number]
  onOpenSource: (point: AnswerPoint) => void
  postsById: Map<string, Post>
  labelSponsored: boolean
  highlighted: Set<string>
}) {
  const renderRows = (points: AnswerPoint[]) => pointRows(points, onOpenSource, postsById, labelSponsored, highlighted)
  const groups = useMemo(() => {
    if (section.componentId !== 'persona-groups') return []
    const byPersona = new Map<string, AnswerPoint[]>()
    for (const point of section.points) {
      const label = point.persona ?? '未分组'
      byPersona.set(label, [...(byPersona.get(label) ?? []), point])
    }
    return [...byPersona.entries()]
  }, [section.componentId, section.points])

  return (
    <section className={`s2-answer-section is-${section.componentId}`}>
      <div className="s2-answer-section-heading">
        {section.componentId === 'pitfall-card' ? <AlertTriangle size={14} /> : section.componentId === 'conclusion' ? <Sparkles size={14} /> : <span className="s2-answer-section-dot" />}
        <strong>{section.componentId === 'conclusion' ? '一句话结论' : section.title}</strong>
        {section.status === 'existing' && <span className="s2-existing-label"><Check size={11} />已有组件</span>}
      </div>
      {section.componentId === 'persona-groups' ? (
        <div className="s2-persona-groups">
          {groups.map(([persona, points]) => (
            <div className="s2-persona-group" key={persona}>
              <div className="s2-persona-label">{persona}</div>
              {renderRows(points)}
            </div>
          ))}
        </div>
      ) : section.componentId === 'step-list' ? (
        <div className="s2-step-points">{renderRows(section.points)}</div>
      ) : (
        <div className="s2-point-list">{renderRows(section.points)}</div>
      )}
    </section>
  )
}

export function AnswerPreview({ before, after, queryText, mode, onModeChange, onOpenSource, onNavigateCoverage, diffSummary, isDraftModified, checkStatus, labelSponsored, posts, embedded = false }: Props) {
  const answer = mode === 'before' ? before : after
  const postsById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts])
  const changedIds = useMemo(() => new Set(answer.sections.flatMap((section) => section.points.filter((point) => point.change !== 'unchanged').map((point) => point.id))), [answer])
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  useEffect(() => {
    setHighlighted(changedIds)
    const timer = window.setTimeout(() => setHighlighted(new Set()), 1750)
    return () => window.clearTimeout(timer)
  }, [changedIds])

  const hasPoints = answer.sections.some((section) => section.points.length > 0)
  const stateLabel = mode === 'before' ? '改动前 · 基线' : embedded ? '改动后 · 本次运行配置' : isDraftModified ? '草稿 · 实时预览' : '与基线一致'

  return (
    <div className={`s2-preview-card ${embedded ? 'is-embedded' : ''}`}>
      <div className="s2-preview-controls">
        <div className="s2-preview-version-label">{embedded ? '答案卡预览' : '预览版本'}</div>
        <div className="s2-segmented-control" role="group" aria-label="切换改动前后预览">
          <button type="button" aria-pressed={mode === 'before'} className={mode === 'before' ? 'is-selected' : ''} onClick={() => onModeChange('before')}>改动前</button>
          <button type="button" aria-pressed={mode === 'after'} className={mode === 'after' ? 'is-selected' : ''} onClick={() => onModeChange('after')}>改动后</button>
        </div>
      </div>
      {!embedded && diffSummary && <div className="s2-diff-summary" aria-live="polite"><span className="s2-diff-mark"><Sparkles size={13} /></span><span>{diffSummary}</span></div>}

      <div className="s2-phone-frame">
        <div className="s2-phone-top"><span className="s2-phone-camera" /><span className="s2-phone-brand">小红书 <i>AI 搜</i></span><span className="s2-phone-search" /></div>
        <div className="s2-phone-content">
          <div className="s2-phone-question-label">AI 搜答案 · 规则模拟</div>
          <h3 className="s2-phone-query">{queryText}</h3>
          <div className={`s2-phone-state ${mode === 'after' && isDraftModified ? 'is-draft' : ''}`}><span className="s2-live-dot" />{stateLabel}</div>
          {hasPoints ? (
            <div className="s2-answer-sections">
              {answer.sections.map((section) => (
                <AnswerSection
                  key={section.componentId}
                  section={section}
                  onOpenSource={onOpenSource}
                  postsById={postsById}
                  labelSponsored={labelSponsored}
                  highlighted={highlighted}
                />
              ))}
            </div>
          ) : (
            <div className="s2-empty-answer"><FileSearch size={16} /><span>当前策略条件下没有足够的引用支持此答案。可调整来源条件或隐藏无来源结论。</span></div>
          )}
          <div className="s2-phone-source-footer">
            <div className="s2-footer-heading"><FileSearch size={13} /><strong>来源底栏</strong></div>
            <div className="s2-footer-counts">
              <span>笔记 {answer.footer.noteCount}</span><span>评论 {answer.footer.commentCount}</span>
              {answer.footer.sponsoredLabeledCount > 0 && <span>合作已标注 {answer.footer.sponsoredLabeledCount}</span>}
            </div>
            {answer.footer.latestDate && <div className="s2-footer-date">引用示例截至 {answer.footer.latestDate}</div>}
          </div>
        </div>
      </div>

      <div className="s2-preview-caption"><span>点击答案中的要点，可查看引用的原帖。</span></div>
      {!embedded && onNavigateCoverage && checkStatus && <button type="button" className="s2-go-coverage" onClick={onNavigateCoverage}>运行回归检查 <ArrowRight size={14} /><span className={`s2-check-status is-${checkStatus.kind}${checkStatus.kind === 'current' && checkStatus.summary.regressed > 0 ? ' has-regression' : ''}`}>{checkStatusLabel(checkStatus)}</span></button>}
    </div>
  )
}
