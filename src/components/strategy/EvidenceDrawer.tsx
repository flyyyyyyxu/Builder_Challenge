import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle, Check, Clock3, FileSearch, ShieldCheck, X } from 'lucide-react'
import type { AnswerPoint, Post, RenderedAnswer } from '../../types'

type Props = {
  point: AnswerPoint
  answer: RenderedAnswer
  posts: Post[]
  onClose: () => void
}

const STANCE_LABELS: Record<Post['stance'], string> = {
  推荐: '推荐',
  不推荐: '不推荐',
  踩坑: '踩坑',
  中立: '中立',
}

export function EvidenceDrawer({ point, answer, posts, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const postsById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts])
  const citedSources = point.evidenceIds.flatMap((id) => {
    const post = postsById.get(id)
    return post ? [post] : []
  })
  const citedIdSet = new Set(citedSources.map((post) => post.id))
  const filteredRelated = answer.filteredEvidence.flatMap((item) => {
    const post = postsById.get(item.evidenceId)
    return post && post.points.includes(point.id) && !citedIdSet.has(post.id) ? [{ post, reason: item.reason, ruleId: item.ruleId }] : []
  })
  const stanceCounts = citedSources.reduce<Record<Post['stance'], number>>((counts, post) => {
    counts[post.stance] += 1
    return counts
  }, { 推荐: 0, 不推荐: 0, 踩坑: 0, 中立: 0 })

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="s2-drawer-layer">
      <button type="button" className="s2-drawer-scrim" aria-label="关闭溯源面板" onClick={onClose} />
      <aside className="s2-evidence-drawer" role="dialog" aria-modal="true" aria-labelledby="s2-drawer-title">
        <header className="s2-drawer-header">
          <div><h2 id="s2-drawer-title">引用来源与规则 trace</h2></div>
          <button ref={closeRef} type="button" className="s2-drawer-close" aria-label="关闭溯源面板" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="s2-drawer-scroll">
          <section className="s2-drawer-answer-point">
            <span className="s2-drawer-eyebrow">当前答案要点</span>
            <p>{point.text}</p>
            {point.persona && <span className="s2-persona-chip">{point.persona}</span>}
          </section>

          <section className="s2-source-counts" aria-label="引用立场样例计数">
            <div><strong>{citedSources.length}</strong><span>条 mock 引用</span></div>
            <div><strong>{stanceCounts['推荐']}</strong><span>推荐</span></div>
            <div><strong>{stanceCounts['不推荐'] + stanceCounts['踩坑']}</strong><span>不推荐 / 踩坑</span></div>
            <div><strong>{stanceCounts['中立']}</strong><span>中立</span></div>
          </section>
          <p className="s2-counts-disclaimer">立场计数只描述演示来源标签，不代表人数、真实性或观点正确性。</p>

          <section className="s2-drawer-section">
            <div className="s2-drawer-section-heading"><FileSearch size={15} /><h3>被引用的 mock 来源</h3></div>
            {citedSources.length === 0 ? <p className="s2-drawer-empty">当前要点没有可展示的来源。</p> : citedSources.map((post) => (
              <article className="s2-source-card" key={post.id}>
                <div className="s2-source-card-top"><span className="s2-source-kind">{post.kind === 'note' ? '笔记' : '评论'}</span><span className={`s2-source-stance is-${post.stance === '推荐' ? 'positive' : post.stance === '中立' ? 'neutral' : 'caution'}`}>{STANCE_LABELS[post.stance]}</span>{post.firstHand && <span className="s2-source-firsthand"><Check size={11} />亲身经验标记</span>}{post.sponsored && <span className="s2-sponsored-tag">商业合作示例</span>}</div>
                <blockquote>“{post.text}”</blockquote>
                <div className="s2-source-meta-grid">
                  <span><strong>作者类型</strong>{post.authorType}</span>
                  <span><strong>示例作者</strong>{post.author}</span>
                  <span><strong>发布时间</strong><Clock3 size={12} />{post.date}</span>
                  <span><strong>来源 ID</strong><code>{post.id}</code></span>
                </div>
                {post.parentId && <div className="s2-parent-note">关联父级示例：{post.parentId}</div>}
                <div className="s2-source-support"><Check size={13} />通过当前来源策略并支撑此答案要点；可查看下方规则 trace。</div>
              </article>
            ))}
          </section>

          <section className="s2-drawer-section">
            <div className="s2-drawer-section-heading"><ShieldCheck size={15} /><h3>当前策略过滤原因</h3></div>
            {filteredRelated.length > 0 ? filteredRelated.map(({ post, reason, ruleId }) => (
              <div className="s2-filtered-source" key={post.id}><strong>{post.kind === 'note' ? '笔记' : '评论'} · {post.date} · {post.id}</strong><span>{reason}</span><code>{ruleId}</code></div>
            )) : <p className="s2-drawer-empty">当前问题中，没有因来源类型、时效或立场条件被过滤且命中此要点的示例来源。</p>}
          </section>

          <section className="s2-drawer-section">
            <div className="s2-drawer-section-heading"><AlertTriangle size={15} /><h3>命中的规则 trace</h3></div>
            <div className="s2-trace-list">
              {point.trace.map((trace) => <div className="s2-trace-item" key={trace.ruleId}><span className={`s2-trace-status ${trace.matched ? 'is-matched' : ''}`}>{trace.matched ? <Check size={11} /> : <X size={11} />}</span><div><strong>{trace.label}</strong><span>{trace.explanation}</span><small>{trace.source} · {trace.owner}</small></div></div>)}
            </div>
          </section>

          <div className="s2-drawer-disclaimer"><ShieldCheck size={15} /><span>所有作者、原文片段、时间和互动信息均为本地虚构 mock。溯源保障可追溯、有依据，不代表平台为原帖真实性背书。</span></div>
        </div>
      </aside>
    </div>
  )
}
