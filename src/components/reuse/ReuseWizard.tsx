import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Boxes, Check, ChefHat, FileCheck2, LockKeyhole, Utensils } from 'lucide-react'
import { COOKING_POSTS, COOKING_QUERY, COOKING_REUSE_TARGET, COMPONENTS, CAPABILITIES, DEMO_AS_OF_DATE, POINT_CATALOG, SCENES, SKINCARE_TEMPLATE } from '../../data'
import { getConfigVersion, renderAnswer, reuseReport as buildReuseReport } from '../../engine'
import { useDemoStore, type ReuseWizardStep } from '../../store'
import type { AnswerPoint, RenderedAnswer, StrategyConfig } from '../../types'
import { Sprout } from 'lucide-react'
import { EvidenceDrawer } from '../strategy/EvidenceDrawer'
import './reuse.css'

const WIZARD_STEPS: { id: ReuseWizardStep; title: string }[] = [
  { id: 1, title: '选择来源模板' },
  { id: 2, title: '确认目标场景' },
  { id: 3, title: '查看复用报告' },
]

const COMPONENT_EXPLANATIONS: Record<string, string> = {
  conclusion: '一句话结论结构及其引用关联方式可直接带入。',
  'step-list': '已有步骤列表组件可以直接承载新场景的步骤内容。',
  'pitfall-card': '有来源支持的踩坑提醒结构可以直接带入。',
  'source-footer': '引用来源计数、时间和追溯能力可以直接带入。',
  'source-tracing': '既有引用追溯能力可继续使用，原帖真实性仍不背书。',
  'fixed-sample-check': '检查规则能力可继续使用；家常菜样例集需单独重配。',
}

const CHANGE_LABELS: Record<string, string> = {
  'presentation.groupByPersona': '分组维度（同一分组能力）',
  'presentation.groupByPersonaAppliesTo': '适用问题类别',
  sampleSet: '固定样例集',
}

function cloneForCooking(config: StrategyConfig): StrategyConfig {
  return {
    evidence: { ...config.evidence, allowedKinds: [...config.evidence.allowedKinds] },
    presentation: {
      ...config.presentation,
      // Matches the “改配置” column: same grouping capability, dimension switched to utensil, scope 做法类.
      groupByPersona: true,
      groupByPersonaAppliesTo: ['做法类'],
      componentOrder: ['conclusion', 'step-list', 'pitfall-card', 'source-footer'],
    },
    guardrails: { ...config.guardrails },
  }
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

const GENERAL_GROUP = '通用步骤'

/** A step belongs to a utensil group only when every cited source names that same utensil. */
function getUtensilGroup(point: AnswerPoint): string {
  const utensils = new Set(point.evidenceIds.flatMap((id) => {
    const persona = COOKING_POSTS.find((post) => post.id === id)?.persona
    return persona && persona !== '通用' ? [persona] : ['通用']
  }))
  return utensils.size === 1 && !utensils.has('通用') ? [...utensils][0] : GENERAL_GROUP
}

function ReuseWizard() {
  const selectedTemplateId = useDemoStore((state) => state.selectedTemplateId)
  const reuseWizardStep = useDemoStore((state) => state.reuseWizardStep)
  const report = useDemoStore((state) => state.reuseReport)
  const setSelectedTemplateId = useDemoStore((state) => state.setSelectedTemplateId)
  const setReuseWizardStep = useDemoStore((state) => state.setReuseWizardStep)
  const setReuseReport = useDemoStore((state) => state.setReuseReport)
  const [sourcePoint, setSourcePoint] = useState<AnswerPoint | null>(null)

  const selectedTemplate = selectedTemplateId === SKINCARE_TEMPLATE.id ? SKINCARE_TEMPLATE : null
  const targetScene = SCENES.find((scene) => scene.id === COOKING_REUSE_TARGET.id)!
  const sourceVersion = getConfigVersion(SKINCARE_TEMPLATE.config)
  const targetConfig = useMemo(() => cloneForCooking(SKINCARE_TEMPLATE.config), [])
  const cookingAnswer = useMemo(() => report ? renderAnswer(targetConfig, COOKING_QUERY, COOKING_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE) : null, [report, targetConfig])

  function chooseTemplate() {
    setSelectedTemplateId(SKINCARE_TEMPLATE.id)
    setReuseWizardStep(2)
  }

  function confirmTarget() {
    setReuseWizardStep(3)
  }

  function generateReport() {
    if (!selectedTemplate) return
    setReuseReport(buildReuseReport(selectedTemplate, COOKING_REUSE_TARGET, COMPONENTS, CAPABILITIES))
  }

  const isReportReady = report !== null && cookingAnswer !== null

  return (
    <section className="reuse-wizard" aria-labelledby="workspace-page-title">
      <nav className="reuse-wizard-steps" aria-label="跨场景复用步骤">
        {WIZARD_STEPS.map((step, index) => {
          const completed = reuseWizardStep > step.id || (step.id === 3 && isReportReady)
          const current = reuseWizardStep === step.id
          const canVisit = step.id <= reuseWizardStep || (step.id === 3 && isReportReady)
          return <button type="button" key={step.id} className={`reuse-step ${current ? 'is-current' : ''} ${completed ? 'is-complete' : ''}`} onClick={() => canVisit && setReuseWizardStep(step.id)} disabled={!canVisit} aria-current={current ? 'step' : undefined}>
            <span>{completed ? <Check size={13} /> : `0${step.id}`}</span><strong>{step.title}</strong>{index < WIZARD_STEPS.length - 1 && <i aria-hidden="true" />}
          </button>
        })}
      </nav>

      {reuseWizardStep === 1 && (
        <section className="reuse-step-panel panel" aria-labelledby="reuse-source-title">
          <div className="reuse-step-heading"><h2 id="reuse-source-title">选择一个明确版本的来源模板</h2><p>当前策略草稿与模板版本分开；这里固定选择一个虚构的护肤答案模板。</p></div>
          <button type="button" className={`reuse-template-choice ${selectedTemplateId === SKINCARE_TEMPLATE.id ? 'is-selected' : ''}`} onClick={() => setSelectedTemplateId(SKINCARE_TEMPLATE.id)} aria-pressed={selectedTemplateId === SKINCARE_TEMPLATE.id}>
            <span className="reuse-radio" aria-hidden="true">{selectedTemplateId === SKINCARE_TEMPLATE.id && <span />}</span>
            <span className="reuse-template-choice-main"><strong>{SKINCARE_TEMPLATE.name}</strong><small>来源场景：护肤 · 选购怎么选 · 示例模板 ID：{SKINCARE_TEMPLATE.id}</small><span className="reuse-template-meta"><span><BadgeCheck size={12} />示例模板</span><span>配置指纹 <code>{sourceVersion}</code></span></span></span>
          </button>
          <div className="reuse-source-boundary"><LockKeyhole size={15} /><span>来源配置取自固定模板快照（配置指纹 {sourceVersion}），不是当前可编辑草稿；模板没有发布或线上版本含义。</span></div>
          <div className="reuse-step-actions"><span>下一步将确认固定目标“家常菜 → 做法步骤”。</span><button type="button" className="reuse-button reuse-button-primary" onClick={chooseTemplate} disabled={!selectedTemplateId}>选用此模板并继续 <ArrowRight size={15} /></button></div>
        </section>
      )}

      {reuseWizardStep === 2 && (
        <section className="reuse-step-panel panel" aria-labelledby="reuse-target-title">
          <div className="reuse-step-heading"><h2 id="reuse-target-title">确认目标场景和问题</h2><p>目标是预设的家常菜做法场景；不接受任意自然语言输入，避免把不存在的 mock 来源误展示为证据。</p></div>
          <div className="reuse-target-summary">
            <div className="reuse-scene-side"><span className="reuse-scene-label">来源模板</span><div className="reuse-scene-icon is-source"><SproutIcon /></div><strong>护肤 <i>→</i> 选购怎么选</strong><small>{SKINCARE_TEMPLATE.name} · {sourceVersion}</small></div>
            <div className="reuse-transfer-arrow"><ArrowRight size={19} /><span>复用已有能力</span></div>
            <div className="reuse-scene-side is-target"><span className="reuse-scene-label">固定目标（演示）</span><div className="reuse-scene-icon is-target"><Utensils size={18} /></div><strong>{targetScene.vertical} <i>→</i> {targetScene.intent}</strong><small>问题：{COOKING_QUERY.text}</small>
              <span className="reuse-query-id">样例问题 ID · {COOKING_QUERY.id}</span>
            </div>
          </div>
          <div className="reuse-confirm-boundaries"><div><Check size={14} /><span>保留已有引用溯源与步骤列表能力</span></div><div><Check size={14} /><span>分组维度从肤质调整为器具</span></div><div className="is-planned"><span className="reuse-dash-icon" /><span>参数分布条仍是待研发扩展点</span></div></div>
          <div className="reuse-step-actions"><button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(1)}><ArrowLeft size={14} />返回来源模板</button><span>当前目标只有这组固定 mock 来源。</span><button type="button" className="reuse-button reuse-button-primary" onClick={confirmTarget}>确认目标场景 <ArrowRight size={15} /></button></div>
        </section>
      )}

      {reuseWizardStep === 3 && selectedTemplate && (
        <section className="reuse-report-stage" aria-labelledby="reuse-report-title">
          <div className="reuse-report-toolbar panel">
            <div><h2 id="reuse-report-title">生成复用清单与目标答案预览</h2><p>来源：{selectedTemplate.name} · {sourceVersion}　｜　目标：{targetScene.vertical} · {targetScene.intent} · “{COOKING_QUERY.text}”</p></div>
            <div className="reuse-report-actions"><button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(2)}><ArrowLeft size={14} />返回目标确认</button><button type="button" className="reuse-button reuse-button-primary" onClick={generateReport}><FileCheck2 size={15} />{report ? '重新生成复用清单' : '生成复用清单'}</button></div>
          </div>

          {!isReportReady || !report ? (
            <div className="reuse-report-empty panel"><div className="reuse-report-empty-icon"><Boxes size={22} /></div><h3>尚未生成复用报告</h3><p>点击“生成复用清单”调用本地 reuseReport，报告和目标答案预览会按已选模板及固定目标计算。</p></div>
          ) : (
            <>
              <ReuseShare report={report} />
              <div className="reuse-report-grid" aria-label="复用能力清单">
                <ReuseColumn title="直接复用" kicker="已有能力 · 原样带走" count={report.reusedAsIs.length} tone="green">
                  {report.reusedAsIs.map((item) => <article className="reuse-report-item" key={`${item.kind}-${item.id}`}><span className="reuse-item-status is-existing"><Check size={11} /></span><div><strong>{item.name}</strong><small>{COMPONENT_EXPLANATIONS[item.id] ?? '已有能力，不更改组件状态。'}</small><code>{item.kind} · {item.id}</code></div></article>)}
                </ReuseColumn>
                <ReuseColumn title="改配置" kicker="已有能力 · 调整参数" count={report.reconfigured.length} tone="amber">
                  {report.reconfigured.map((item) => <article className="reuse-report-item" key={item.key}><span className="reuse-item-status is-reconfigured"><ArrowRight size={12} /></span><div><strong>{CHANGE_LABELS[item.key] ?? item.key}</strong><small><span className="reuse-from-value">{item.from}</span><ArrowRight size={11} /><span className="reuse-to-value">{item.to}</span></small><code>{item.key}</code></div></article>)}
                </ReuseColumn>
                <ReuseColumn title="待研发扩展点" kicker="不计入复用占比" count={report.plannedExtensions.length} tone="planned">
                  {report.plannedExtensions.map((item) => <article className="reuse-report-item is-planned" key={item.id}><span className="reuse-item-status is-planned"><span className="reuse-dash-icon" /></span><div><strong>{item.name}</strong><small>{item.reason}</small><code>planned · {item.id}</code></div></article>)}
                  <p className="reuse-planned-footnote">虚线边框为概念占位，不属于现有答案组件，也不进入复用占比。</p>
                </ReuseColumn>
              </div>

              {cookingAnswer && <CookingAnswerPreview answer={cookingAnswer} groupByUtensil={targetConfig.presentation.groupByPersona && targetConfig.presentation.groupByPersonaAppliesTo.includes(COOKING_QUERY.category)} onOpenSource={setSourcePoint} />}
              <div className="reuse-report-footer"><span>模板版本固定于 {sourceVersion}；家常菜答案仅使用 existing 组件和可追溯 mock 来源。</span><button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(1)}>重新选择来源模板</button></div>
            </>
          )}
        </section>
      )}

      {sourcePoint && cookingAnswer && <EvidenceDrawer point={sourcePoint} answer={cookingAnswer} posts={COOKING_POSTS} onClose={() => setSourcePoint(null)} />}
    </section>
  )
}

function SproutIcon() {
  return <Sprout size={18} />
}

function ReuseShare({ report }: { report: NonNullable<ReturnType<typeof buildReuseReport>> }) {
  return <section className="reuse-share-card panel" aria-label="复用占比口径">
    <div className="reuse-share-visual"><strong>{formatPercent(report.reuseShare)}</strong><span>示例复用占比</span></div>
    <div className="reuse-share-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, report.reuseShare * 100))}%` }} /></div>
    <div className="reuse-share-copy"><strong>{report.reusedAsIs.length} / {report.denominator} 个可复用或需重配的现有项直接复用</strong><span>分子 = 直接复用已有组件 / 能力；分母 = 直接复用 + 需重配置的现有项。planned 扩展点不计入分子或分母。</span><small>这是本地 mock 能力清单的计算比例，不是线上复用收益或效率提升。</small></div>
  </section>
}

function ReuseColumn({ title, kicker, count, tone, children }: { title: string; kicker: string; count: number; tone: 'green' | 'amber' | 'planned'; children: React.ReactNode }) {
  return <section className={`reuse-report-column is-${tone}`}><header><div><span>{kicker}</span><h3>{title}</h3></div><strong>{count}</strong></header><div className="reuse-report-items">{count > 0 ? children : <p className="reuse-column-empty">此目标没有对应项目。</p>}</div></section>
}

function CookingAnswerPreview({ answer, groupByUtensil, onOpenSource }: { answer: RenderedAnswer; groupByUtensil: boolean; onOpenSource: (point: AnswerPoint) => void }) {
  const conclusion = answer.sections.find((section) => section.componentId === 'conclusion')
  const steps = answer.sections.find((section) => section.componentId === 'step-list')
  const pitfalls = answer.sections.find((section) => section.componentId === 'pitfall-card')
  const groupedSteps = new Map<string, AnswerPoint[]>()
  for (const point of steps?.points ?? []) {
    const group = groupByUtensil ? getUtensilGroup(point) : GENERAL_GROUP
    const current = groupedSteps.get(group) ?? []
    current.push(point)
    groupedSteps.set(group, current)
  }
  const orderedGroups = [...groupedSteps.entries()].sort(([a], [b]) => Number(b === GENERAL_GROUP) - Number(a === GENERAL_GROUP))
  const sourceCount = answer.sections.flatMap((section) => section.points).reduce((sum, point) => sum + point.evidenceIds.length, 0)

  return <section className="reuse-preview-panel panel" aria-labelledby="reuse-answer-title">
    <div className="reuse-preview-heading"><div><h3 id="reuse-answer-title">家常菜答案预览</h3><p>问题：{COOKING_QUERY.text} · 展示内容均来自已标注的本地 mock 来源</p></div><span className="reuse-existing-badge"><Check size={12} />existing 组件</span></div>
    <div className="reuse-preview-layout">
      <div className="reuse-phone-wrap"><div className="reuse-phone-frame"><div className="reuse-phone-top"><span className="reuse-phone-camera" /><span>小红书 AI 搜</span></div><div className="reuse-phone-content">
        <div className="reuse-phone-kicker">问题</div><h4 className="reuse-phone-query">{COOKING_QUERY.text}</h4><div className="reuse-phone-state"><span />模板复用演示 · 内容来自 15 条 mock 来源</div>
        {conclusion && <section className="reuse-answer-section is-conclusion"><div className="reuse-section-title"><span className="reuse-section-dot" /><strong>{conclusion.title}</strong><span>existing</span></div>{conclusion.points.map((point) => <AnswerAction key={point.id} point={point} onClick={() => onOpenSource(point)} />)}</section>}
        {steps && <section className="reuse-answer-section is-steps"><div className="reuse-section-title"><span className="reuse-section-dot" /><strong>{steps.title}</strong><span>existing</span></div>
          {orderedGroups.map(([group, points]) => <div className="reuse-utensil-group" key={group}><div className="reuse-utensil-label"><ChefHat size={12} />{group === GENERAL_GROUP ? group : `器具 · ${group}`}</div><ol>{points.map((point) => <li key={point.id}><AnswerAction point={point} onClick={() => onOpenSource(point)} /></li>)}</ol></div>)}
        </section>}
        {pitfalls && pitfalls.points.length > 0 && <section className="reuse-answer-section is-pitfall"><div className="reuse-section-title"><span className="reuse-section-dot" /><strong>{pitfalls.title}</strong><span>existing</span></div>{pitfalls.points.map((point) => <AnswerAction key={point.id} point={point} onClick={() => onOpenSource(point)} />)}</section>}
        <div className="reuse-source-footer"><div><strong>引用来源</strong><span>{answer.footer.noteCount} 笔记 · {answer.footer.commentCount} 评论</span></div><small>{sourceCount} 个引用关联 · 最近示例 {answer.footer.latestDate ?? '—'}</small></div>
      </div></div></div>
      <aside className="reuse-preview-aside"><div className="reuse-aside-card"><span className="reuse-aside-kicker">带走了什么</span><h4>当前答案主体仅包含已有能力</h4><ul>{answer.sections.map((section) => <li key={section.componentId}><span className="reuse-status-dot" /><span>{section.title}</span><code>{section.status}</code></li>)}</ul><p>点击答案要点可检查来源原文、立场、时间和规则 trace。</p></div>
        <div className="reuse-planned-preview"><div className="reuse-planned-preview-heading"><span className="reuse-dash-icon" /><div><strong>做法参数分布条</strong><small>待研发概念占位 · 不在答案主体中</small></div><span className="reuse-planned-label">planned</span></div><div className="reuse-planned-placeholder"><span>待研发能力位</span><small>未接入参数数据，不展示虚构比例</small></div></div>
        <div className="reuse-target-note"><Utensils size={14} /><span>按器具分组复用了护肤的分组能力，只把维度从肤质换成器具：所有来源都指向同一器具的步骤归入该器具，其余归入通用步骤。器具标签来自 mock 来源元数据。</span></div>
      </aside>
    </div>
  </section>
}

function AnswerAction({ point, onClick }: { point: AnswerPoint; onClick: () => void }) {
  const hasSponsoredSource = point.evidenceIds.some((id) => COOKING_POSTS.find((post) => post.id === id)?.sponsored)
  return <button type="button" className="reuse-answer-point" onClick={onClick}><span>{point.text}</span><small><span>{point.evidenceIds.length} 条引用</span>{hasSponsoredSource && <em>合作示例已标注</em>}<b>查看来源</b></small></button>
}

export { ReuseWizard }
