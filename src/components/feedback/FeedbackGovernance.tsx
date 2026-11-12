import { ArrowDown, Construction } from 'lucide-react'
import './feedback.css'

/** Concept-only page: the feedback evaluation pipeline is explained on the home page and marked in-development here. */
export const FEEDBACK_PIPELINE = [
  { title: '用户反馈', body: '对答案卡中的帖子反馈：不相关、疑似软广、内容过时、信息不实。' },
  { title: '自动评测打分', body: '从软广可能性、与问题的相关性、时效、信息可信度等维度打分，并附上证据条数。' },
  { title: '分级处置', body: '高置信：自动移出答案卡或降权，可撤销。中置信：进入社区治理人工复核队列。低置信：记录观察，反馈累积后重新评测。' },
  { title: '复核回流', body: '人工复核结论用于校准打分阈值；典型帖子补进回归样例集。' },
]

export function FeedbackGovernance() {
  return (
    <section className="fb-page panel" aria-labelledby="fb-title">
      <div className="fb-status"><Construction size={15} />开发中 · 本页仅展示设计</div>
      <h2 id="fb-title">反馈治理</h2>
      <p className="fb-lead">对用户反馈过的帖子做评测打分和分级处置，让大部分反馈自动分流，人工只处理需要判断的部分。</p>

      <ol className="fb-pipeline">
        {FEEDBACK_PIPELINE.map((step, index) => (
          <li key={step.title}>
            <div className="fb-step"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.title}</strong><p>{step.body}</p></div></div>
            {index < FEEDBACK_PIPELINE.length - 1 && <ArrowDown size={15} className="fb-arrow" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <div className="fb-value">
        <div><strong>效率</strong><p>系统自动分流，人工只看中置信的一档，处理时长缩短。</p></div>
        <div><strong>成效</strong><p>处置准确率以复核结论为准；同类问题的复发率下降。</p></div>
      </div>
      <p className="fb-link">与筛选策略的关系：评测结果将接入「配置筛选策略 → 社区治理」中的规则，按评分分级生效。</p>
    </section>
  )
}
