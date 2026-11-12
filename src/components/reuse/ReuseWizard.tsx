import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, BadgeCheck, Boxes, Check, LockKeyhole, Sparkles, X } from 'lucide-react'
import { COMPONENTS, CAPABILITIES, DEMO_AS_OF_DATE, POINT_CATALOG, REUSABLE_RULES, SCENES, SKINCARE_POSTS, SKINCARE_SAMPLES, SKINCARE_TEMPLATE, TEMPLATE_DRAFT_VERSION, USAGE_REUSE_TARGET } from '../../data'
import { getConfigVersion, renderAnswer, reuseReport as buildReuseReport } from '../../engine'
import { useDemoStore, type ReuseWizardStep } from '../../store'
import type { AnswerPoint, Query, RenderedAnswer, ReuseGroup, ReuseReport, StrategyConfig } from '../../types'
import { Sprout } from 'lucide-react'
import { EvidenceDrawer } from '../strategy/EvidenceDrawer'
import { DiandianPhone } from '../answer-card/DiandianPhone'
import './reuse.css'

const WIZARD_STEPS: { id: ReuseWizardStep; title: string }[] = [
  { id: 1, title: '选择来源模板' },
  { id: 2, title: '确认目标场景' },
  { id: 3, title: '查看复用报告' },
]

/** Only items that carry a real caveat get a note; the rest are self-explanatory. */
const COMPONENT_NOTES: Record<string, string> = {
  'source-footer': '溯源不代表平台为原帖真实性背书',
}

const REUSE_GROUPS: ReuseGroup[] = ['卡片模板', '筛选策略', '回归检查']

const PLANNED_NOTES: Record<string, string> = {
  'parameter-distribution': '把“用多少、等多久成膜”做成分布展示',
}

/** Matches the “改配置” column: usage questions are not split by skin type, components re-ordered for steps. */
function cloneForUsage(config: StrategyConfig): StrategyConfig {
  return {
    evidence: { ...config.evidence, allowedKinds: [...config.evidence.allowedKinds] },
    presentation: {
      ...config.presentation,
      groupByPersona: false,
      groupByPersonaAppliesTo: [...config.presentation.groupByPersonaAppliesTo],
      componentOrder: ['conclusion', 'step-list', 'pitfall-card', 'source-footer'],
    },
    guardrails: { ...config.guardrails },
  }
}

/** The usage scene reuses the skincare post pool; its sample question is the fixed 用法类 sample. */
const USAGE_QUERY: Query = SKINCARE_SAMPLES.find((sample) => sample.id === 'skin-q7')!

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function ReuseWizard() {
  const selectedTemplateId = useDemoStore((state) => state.selectedTemplateId)
  const reuseWizardStep = useDemoStore((state) => state.reuseWizardStep)
  const report = useDemoStore((state) => state.reuseReport)
  const setSelectedTemplateId = useDemoStore((state) => state.setSelectedTemplateId)
  const setReuseWizardStep = useDemoStore((state) => state.setReuseWizardStep)
  const setReuseReport = useDemoStore((state) => state.setReuseReport)
  const [sourcePoint, setSourcePoint] = useState<AnswerPoint | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const selectedTemplate = selectedTemplateId === SKINCARE_TEMPLATE.id ? SKINCARE_TEMPLATE : null
  const targetScene = SCENES.find((scene) => scene.id === USAGE_REUSE_TARGET.id)!
  const sourceVersion = getConfigVersion(SKINCARE_TEMPLATE.config)
  /** The fixed template equals the narrowed config; once that config is launched in 03, say so instead of calling it a bare snapshot. */
  const sourceLaunched = useDemoStore((state) => state.launchedConfigVersion) === sourceVersion
  const targetConfig = useMemo(() => cloneForUsage(SKINCARE_TEMPLATE.config), [])
  const usageAnswer = useMemo(() => report ? renderAnswer(targetConfig, USAGE_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE) : null, [report, targetConfig])

  function chooseTemplate() {
    setSelectedTemplateId(SKINCARE_TEMPLATE.id)
    setReuseWizardStep(2)
  }

  function generateReport() {
    if (!selectedTemplate) return
    setReuseReport(buildReuseReport(selectedTemplate, USAGE_REUSE_TARGET, COMPONENTS, CAPABILITIES, REUSABLE_RULES))
  }

  /** Confirming the target goes straight to the checklist; there is nothing left to choose before it. */
  function confirmTarget() {
    generateReport()
    setReuseWizardStep(3)
  }

  // Safety net: landing on step 3 any other way (e.g. after a reset of the report) still shows the checklist.
  useEffect(() => {
    if (reuseWizardStep === 3 && !report) generateReport()
  }, [reuseWizardStep, report])

  const isReportReady = report !== null && usageAnswer !== null

  return (
    <section className="reuse-wizard" aria-labelledby="workspace-page-title">
      <nav className="reuse-wizard-steps" aria-label="复用已有场景步骤">
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
          <div className="reuse-source-boundary"><LockKeyhole size={15} />{sourceLaunched
            ? <span>来源为已通过回归检查、正在灰度的 {TEMPLATE_DRAFT_VERSION}（0 回归，配置指纹 {sourceVersion}），复用的是已验证的版本，不是可编辑草稿。</span>
            : <span>来源配置取自固定模板快照（配置指纹 {sourceVersion}），不是当前可编辑草稿；模板没有发布或线上版本含义。</span>}</div>
          <div className="reuse-step-actions"><span>下一步将确认目标“护肤 → 怎么使用”。</span><button type="button" className="reuse-button reuse-button-primary" onClick={chooseTemplate} disabled={!selectedTemplateId}>选用此模板并继续 <ArrowRight size={15} /></button></div>
        </section>
      )}

      {reuseWizardStep === 2 && (
        <section className="reuse-step-panel panel" aria-labelledby="reuse-target-title">
          <div className="reuse-step-heading"><h2 id="reuse-target-title">确认目标场景和问题</h2><p>回归检查发现用法类问题需要完整步骤、不能按肤质拆开，所以把它们拆成独立场景。同一垂类下，用法问题与选购问题共用帖子池和大部分组件，只需要调整呈现方式。</p></div>
          <div className="reuse-target-summary">
            <div className="reuse-scene-side"><span className="reuse-scene-label">来源模板</span><div className="reuse-scene-icon is-source"><SproutIcon /></div><strong>护肤 <i>→</i> 选购怎么选</strong><small>{SKINCARE_TEMPLATE.name} · {sourceVersion}</small></div>
            <div className="reuse-transfer-arrow"><ArrowRight size={19} /><span>复用已有能力</span></div>
            <div className="reuse-scene-side is-target"><span className="reuse-scene-label">固定目标（演示）</span><div className="reuse-scene-icon is-target"><SproutIcon /></div><strong>{targetScene.vertical} <i>→</i> {targetScene.intent}</strong><small>问题：{USAGE_QUERY.text}</small>
              <span className="reuse-query-id">样例问题 ID · {USAGE_QUERY.id}</span>
            </div>
          </div>
          <div className="reuse-confirm-boundaries"><div><Check size={14} /><span>与来源场景共用帖子池、筛选策略、步骤列表及来源底栏与溯源</span></div><div><Check size={14} /><span>用法类问题关闭按肤质分组，步骤完整呈现</span></div><div className="is-planned"><span className="reuse-dash-icon" /><span>用量与等待时长参数条仍是待研发扩展点</span></div></div>
          <div className="reuse-step-actions"><button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(1)}><ArrowLeft size={14} />返回来源模板</button><span>帖子来自护肤场景的 mock 来源。</span><button type="button" className="reuse-button reuse-button-primary" onClick={confirmTarget}>确认目标场景 <ArrowRight size={15} /></button></div>
        </section>
      )}

      {reuseWizardStep === 3 && selectedTemplate && (
        <section className="reuse-report-stage" aria-labelledby="reuse-report-title">
          <div className="reuse-report-toolbar panel">
            <div><h2 id="reuse-report-title">复用清单</h2><p>护肤 · 选购怎么选 <ArrowRight size={13} /> {targetScene.vertical} · {targetScene.intent}</p></div>
            <div className="reuse-report-actions"><button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(2)}><ArrowLeft size={14} />返回目标确认</button></div>
          </div>

          {!isReportReady || !report ? (
            <div className="reuse-report-empty panel"><div className="reuse-report-empty-icon"><Boxes size={22} /></div><h3>尚未生成复用清单</h3><p>生成后将列出可直接复用、需调整配置及待研发的各项能力。</p></div>
          ) : (
            <>
              <ReuseShare report={report} />
              <div className="reuse-report-grid" aria-label="复用能力清单">
                <ReuseColumn title="直接复用" subtitle="沿用来源场景的现有配置" count={report.reusedAsIs.length} tone="green">
                  <ReusedGroups items={report.reusedAsIs} />
                </ReuseColumn>
                <ReuseColumn title="改配置" subtitle="沿用已有能力，调整配置取值" count={report.reconfigured.length} tone="amber">
                  {report.reconfigured.map((item) => <article className="reuse-report-item" key={item.key}><span className="reuse-item-status is-reconfigured"><ArrowRight size={12} /></span><div><strong>{item.label}<em className="reuse-stage-tag">{item.stage}</em></strong><small className="reuse-change"><span className="reuse-from-value">{item.from}</span><ArrowRight size={12} /><span className="reuse-to-value">{item.to}</span></small></div></article>)}
                </ReuseColumn>
                <ReuseColumn title="待研发" subtitle="需研发新增组件，不计入复用占比" count={report.plannedExtensions.length} tone="planned">
                  {report.plannedExtensions.map((item) => <article className="reuse-report-item is-planned" key={item.id}><span className="reuse-item-status is-planned"><span className="reuse-dash-icon" /></span><div><strong>{item.name}</strong><small>{PLANNED_NOTES[item.id] ?? item.reason}</small></div></article>)}
                </ReuseColumn>
              </div>

              {usageAnswer && <UsageAnswerPreview answer={usageAnswer} config={targetConfig} onOpenSource={setSourcePoint} />}
              <div className="reuse-report-footer">
                <button type="button" className="reuse-button reuse-button-quiet" onClick={() => setReuseWizardStep(1)}><ArrowLeft size={14} />重新选择来源模板</button>
                <button type="button" className="reuse-button reuse-button-primary reuse-create-button" onClick={() => setCreateOpen(true)}><Sparkles size={16} />一键生成新场景</button>
              </div>
            </>
          )}
        </section>
      )}

      {createOpen && <CreateSceneDialog target={`${targetScene.vertical} · ${targetScene.intent}`} onClose={() => setCreateOpen(false)} />}
      {sourcePoint && usageAnswer && <EvidenceDrawer point={sourcePoint} answer={usageAnswer} posts={SKINCARE_POSTS} onClose={() => setSourcePoint(null)} />}
    </section>
  )
}

function SproutIcon() {
  return <Sprout size={18} />
}

function ReuseShare({ report }: { report: NonNullable<ReturnType<typeof buildReuseReport>> }) {
  return <section className="reuse-share-card panel" aria-label="复用占比">
    <div className="reuse-share-visual"><strong>{formatPercent(report.reuseShare)}</strong><span>复用占比</span></div>
    <div className="reuse-share-body">
      <p className="reuse-share-headline"><strong>{report.reusedAsIs.length} / {report.denominator}</strong> 项已有能力可直接复用</p>
      <div className="reuse-share-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, report.reuseShare * 100))}%` }} /></div>
      <small>分母为“直接复用 + 改配置”，待研发项不计入；基于本地示例计算，不代表线上收益。</small>
    </div>
  </section>
}

function ReusedGroups({ items }: { items: ReuseReport['reusedAsIs'] }) {
  return <>{REUSE_GROUPS.map((group) => {
    const groupItems = items.filter((item) => item.group === group)
    if (groupItems.length === 0) return null
    return <div className={`reuse-group ${groupItems.length > 6 ? 'is-wide' : ''}`} key={group}>
      <h4 className="reuse-group-title">{group}<span>{groupItems.length}</span></h4>
      {groupItems.map((item) => <article className="reuse-report-item" key={`${item.kind}-${item.id}`}><span className="reuse-item-status is-existing"><Check size={12} /></span><div><strong>{item.name}</strong>{COMPONENT_NOTES[item.id] && <small>{COMPONENT_NOTES[item.id]}</small>}</div></article>)}
    </div>
  })}</>
}

function ReuseColumn({ title, subtitle, count, tone, children }: { title: string; subtitle: string; count: number; tone: 'green' | 'amber' | 'planned'; children: React.ReactNode }) {
  return <section className={`reuse-report-column is-${tone}`}><header><div><h3>{title}</h3><span>{subtitle}</span></div><strong>{count}</strong></header><div className="reuse-report-items">{count > 0 ? children : <p className="reuse-column-empty">没有对应项目。</p>}</div></section>
}

function CreateSceneDialog({ target, onClose }: { target: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="s2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="s2-modal reuse-create-dialog" role="dialog" aria-modal="true" aria-labelledby="reuse-create-title">
        <button type="button" className="s2-modal-close" onClick={onClose} aria-label="关闭"><X size={16} /></button>
        <span className="reuse-dev-tag">开发中</span>
        <h3 id="reuse-create-title">一键生成新场景</h3>
        <p className="s2-modal-lead">系统将依据本复用清单创建“{target}”场景：直接复用项沿用来源场景配置，改配置项按清单预填，待研发项提交研发排期。</p>
        <p className="reuse-create-note">该功能尚在开发中，当前演示不会创建场景。</p>
        <div className="reuse-create-actions"><button type="button" className="reuse-button reuse-button-primary" onClick={onClose}>知道了</button></div>
      </div>
    </div>,
    document.body,
  )
}

function UsageAnswerPreview({ answer, config, onOpenSource }: { answer: RenderedAnswer; config: StrategyConfig; onOpenSource: (point: AnswerPoint) => void }) {
  const [showSlots, setShowSlots] = useState(true)
  return <section className="reuse-preview-panel panel" aria-labelledby="reuse-answer-title">
    <div className="reuse-preview-heading"><div><h3 id="reuse-answer-title">新场景答案预览</h3><p>{USAGE_QUERY.text} · 模板「{SKINCARE_TEMPLATE.name}」复用到「护肤 · 怎么使用」· 点击要点可查看来源</p></div><span className="reuse-existing-badge"><Check size={13} />答案主体均为已有组件</span></div>
    <div className="reuse-preview-layout">
      <div className="reuse-phone-wrap">
        <button type="button" className={`reuse-slot-toggle ${showSlots ? 'is-on' : ''}`} aria-pressed={showSlots} onClick={() => setShowSlots((on) => !on)}>{showSlots ? '隐藏槽位标注' : '显示槽位标注'}</button>
        <DiandianPhone
          answer={answer}
          query={USAGE_QUERY}
          config={config}
          posts={SKINCARE_POSTS}
          labelSponsored={config.evidence.labelSponsored}
          stateLabel="复用模板 · 与来源场景共用帖子池"
          showSlots={showSlots}
          onOpenSource={onOpenSource}
        />
      </div>
      <aside className="reuse-preview-aside">
        <div className="reuse-aside-card"><h4>答案组件构成</h4><ul>{answer.sections.map((section) => <li key={section.componentId}><span className="reuse-status-dot" /><span>{section.title}</span><em>已有</em></li>)}<li><span className="reuse-status-dot" /><span>来源底栏与溯源</span><em>已有 · 锁定</em></li></ul></div>
        <div className="reuse-planned-preview"><div className="reuse-planned-preview-heading"><span className="reuse-dash-icon" /><strong>用量与等待时长参数条</strong><em>待研发</em></div><div className="reuse-planned-placeholder">尚未纳入答案结构</div></div>
        <div className="reuse-target-note"><Sprout size={16} /><span><strong>配置调整说明：</strong>用法类问题关闭按肤质分组，避免“等待成膜”等步骤被拆分。卡片里「按肤质分组」槽位因此显示为已关闭。</span></div>
      </aside>
    </div>
  </section>
}

export { ReuseWizard }
