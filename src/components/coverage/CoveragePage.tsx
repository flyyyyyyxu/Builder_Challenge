import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleCheck, ClipboardCheck, RefreshCw, X } from 'lucide-react'
import { BASELINE_CONFIG } from '../../data/strategy-config'
import { COMPONENTS, DEMO_AS_OF_DATE, POINT_CATALOG, REGRESSION_DEMO_CONFIG, SKINCARE_POSTS, SKINCARE_SAMPLES, STALE_REFERENCE_DAYS } from '../../data'
import { getConfigVersion, runCoverageCheck } from '../../engine'
import { useDemoStore, type PreviewVersion } from '../../store'
import { AnswerPreview } from '../strategy/AnswerPreview'
import { EvidenceDrawer } from '../strategy/EvidenceDrawer'
import { ReleaseActions } from './ReleaseActions'
import type { AnswerPoint, CoverageRun, QueryCategory, Sample, SampleResult, StrategyConfig } from '../../types'
import './coverage.css'

const REGRESSION_SAMPLE_ID = 'skin-q7'
const RESTORED_POINT_KEY = 'wait-film'

const DELTA_LABELS: Record<SampleResult['delta'], string> = { improved: '提升', same: '持平', regressed: '回归' }
const DELTA_RULES: Record<SampleResult['delta'], string> = {
  improved: '答出的期望要点比基线多，或引用质量变好，且没有变差的地方',
  same: '答出的期望要点数量不变，引用质量也没有变差',
  regressed: '漏掉了基线能答出的期望要点，或引用质量变差',
}
const CATEGORY_HINTS: Partial<Record<QueryCategory, string>> = {
  选购类: '本场景的主体问题，覆盖不同肤质和使用场景',
  用法类: '边界样例：检查规则会不会误伤非选购问题',
}

function citationIssues(run: CoverageRun, side: 'Before' | 'After'): number {
  return run.results.reduce((sum, result) => sum + result[`staleCount${side}`] + result[`sponsoredUnlabeled${side}`], 0)
}

function CoveragePage() {
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const coverageRun = useDemoStore((state) => state.coverageRun)
  const selectedSampleId = useDemoStore((state) => state.selectedSampleId)
  const setDraftConfig = useDemoStore((state) => state.setDraftConfig)
  const setCoverageRun = useDemoStore((state) => state.setCoverageRun)
  const setSelectedSampleId = useDemoStore((state) => state.setSelectedSampleId)
  const navigate = useDemoStore((state) => state.navigate)
  const [recovered, setRecovered] = useState(false)

  const currentConfigVersion = useMemo(() => getConfigVersion(draftConfig), [draftConfig])
  const draftModified = JSON.stringify(draftConfig) !== JSON.stringify(BASELINE_CONFIG)
  const isStale = coverageRun !== null && coverageRun.configVersion !== currentConfigVersion
  const selectedResult = coverageRun?.results.find((result) => result.sampleId === selectedSampleId)
    ?? coverageRun?.results.find((result) => result.delta === 'regressed')
    ?? coverageRun?.results[0]
  const selectedSample = selectedResult ? SKINCARE_SAMPLES.find((sample) => sample.id === selectedResult.sampleId) ?? null : null

  function executeRun(config: StrategyConfig, previousRun: CoverageRun | null, preferredSampleId?: string | null) {
    const nextRun = runCoverageCheck(BASELINE_CONFIG, config, SKINCARE_SAMPLES, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE)
    const preferred = preferredSampleId && nextRun.results.some((result) => result.sampleId === preferredSampleId)
      ? preferredSampleId
      : nextRun.results.find((result) => result.delta === 'regressed')?.sampleId ?? nextRun.results[0]?.sampleId ?? null
    const prior = previousRun?.results.find((result) => result.sampleId === REGRESSION_SAMPLE_ID)
    const next = nextRun.results.find((result) => result.sampleId === REGRESSION_SAMPLE_ID)
    setRecovered(Boolean(prior?.missedAfter.includes(RESTORED_POINT_KEY) && next && !next.missedAfter.includes(RESTORED_POINT_KEY)))
    setCoverageRun(nextRun)
    setSelectedSampleId(preferred)
  }

  const handleRun = () => executeRun(draftConfig, coverageRun, selectedSampleId)

  /** No edits yet: apply the demo main-line change (行业运营 turns on grouping + pitfall) to the draft, then run. */
  function handleRunWithDemoChange() {
    const demoConfig: StrategyConfig = {
      ...draftConfig,
      presentation: {
        ...draftConfig.presentation,
        groupByPersona: REGRESSION_DEMO_CONFIG.presentation.groupByPersona,
        groupByPersonaAppliesTo: [...REGRESSION_DEMO_CONFIG.presentation.groupByPersonaAppliesTo],
        showPitfall: REGRESSION_DEMO_CONFIG.presentation.showPitfall,
      },
    }
    setDraftConfig(demoConfig)
    executeRun(demoConfig, null, null)
  }

  function handleNarrowAndRerun() {
    const nextConfig: StrategyConfig = {
      ...draftConfig,
      presentation: { ...draftConfig.presentation, groupByPersona: true, groupByPersonaAppliesTo: ['选购类'] },
    }
    setDraftConfig(nextConfig)
    executeRun(nextConfig, coverageRun, selectedResult?.sampleId ?? REGRESSION_SAMPLE_ID)
  }

  const backButtons = (
    <>
      <button type="button" className="cv-button cv-button-quiet" onClick={() => navigate('template')}><ArrowLeft size={14} />返回卡片模板</button>
      <button type="button" className="cv-button cv-button-quiet" onClick={() => navigate('strategy')}><ArrowLeft size={14} />返回筛选策略</button>
    </>
  )

  return (
    <section className="coverage-page" aria-labelledby="workspace-page-title">
      <p className="cv-lead" title={`数据基准 ${DEMO_AS_OF_DATE}`}>分别用基线和当前草稿回答 8 个固定问题，对照期望要点和引用质量，判定每个问题是提升、持平还是回归。</p>

      {coverageRun && isStale && (
        <div className="cv-stale" role="status">
          <CircleAlert size={17} />
          <span>草稿在上次检查后又改过，下面是旧结果。</span>
          <button type="button" className="cv-button cv-button-primary" onClick={handleRun}><RefreshCw size={14} />按当前草稿重跑</button>
        </div>
      )}

      {!coverageRun ? (
        <div className="cv-empty panel">
          <div className="cv-empty-icon"><ClipboardCheck size={22} /></div>
          {draftModified ? (
            <div className="cv-empty-copy"><h2>草稿已改动，可以开始检查</h2><p>8 个固定问题会分别用基线和当前草稿各回答一次。</p></div>
          ) : (
            <div className="cv-empty-copy"><h2>当前草稿与基线一致</h2><p>可以载入演示改动：行业运营在卡片模板里开启「按肤质分组」和「踩坑提醒」，再运行检查。</p></div>
          )}
          <div className="cv-empty-actions">
            {draftModified
              ? <button type="button" className="cv-button cv-button-primary" onClick={handleRun}><ClipboardCheck size={15} />运行 8 个样例</button>
              : <button type="button" className="cv-button cv-button-primary" onClick={handleRunWithDemoChange}><ClipboardCheck size={15} />开始运行</button>}
          </div>
        </div>
      ) : (
        <>
          <CoverageSummary run={coverageRun} onRun={handleRun} isStale={isStale} />

          <div className="cv-results">
            <SampleList run={coverageRun} selectedId={selectedResult?.sampleId} onSelect={(sample) => setSelectedSampleId(sample.id)} />

            {selectedResult && selectedSample ? (
              <CoverageDetail
                sample={selectedSample}
                result={selectedResult}
                runSnapshot={coverageRun.configSnapshot}
                currentDraft={draftConfig}
                previousScope={coverageRun.configSnapshot.presentation.groupByPersonaAppliesTo}
                isStale={isStale}
                recovered={recovered}
                run={coverageRun}
                onNarrowAndRerun={handleNarrowAndRerun}
                onRun={handleRun}
                backButtons={backButtons}
                onContinue={() => navigate('reuse')}
              />
            ) : (
              <div className="cv-detail panel">运行结果中没有找到对应样例，请重置演示后重新运行。</div>
            )}
          </div>

          <details className="cv-notes panel">
            <summary>指标口径与样例说明</summary>
            <ul>
              <li><strong>样例怎么选：</strong>由场景负责人维护，来源是高频问题、典型人群、边界问题和线上投诉回流；期望要点独立标注，改动人不能自己判定通过。</li>
              <li><strong>期望要点覆盖：</strong>答案里出现该要点，并且至少有一条可追溯的引用。</li>
              <li><strong>引用问题：</strong>引用了超过 {STALE_REFERENCE_DAYS} 天的帖子（场景时效标准，不随草稿的时效窗口变化），或引用了未标注的合作内容。</li>
              <li><strong>边界：</strong>本页是规则模拟，只检查固定 mock 样例，不代表语义判断准确率、原帖真实性或上线收益。</li>
            </ul>
          </details>
        </>
      )}
    </section>
  )
}

function CoverageSummary({ run, onRun, isStale }: { run: CoverageRun; onRun: () => void; isStale: boolean }) {
  const expected = run.results.reduce((sum, result) => sum + result.expectedPointKeys.length, 0)
  const coveredBefore = run.results.reduce((sum, result) => sum + result.coveredBefore.length, 0)
  const coveredAfter = run.results.reduce((sum, result) => sum + result.coveredAfter.length, 0)
  return (
    <section className="cv-summary panel" aria-label="检查结论" title={`运行配置 ${run.configVersion}`}>
      <div className="cv-verdict">
        {(['improved', 'same', 'regressed'] as const).map((delta) => (
          <span key={delta} className={`cv-verdict-item is-${delta}`} title={DELTA_RULES[delta]}><strong>{run.summary[delta]}</strong>{DELTA_LABELS[delta]}</span>
        ))}
      </div>
      <div className="cv-stat"><span>期望要点覆盖</span><strong>{coveredBefore}/{expected} <i>→</i> {coveredAfter}/{expected}</strong></div>
      <div className="cv-stat" title={`超过 ${STALE_REFERENCE_DAYS} 天的引用 + 未标注的合作内容`}><span>引用问题</span><strong>{citationIssues(run, 'Before')} <i>→</i> {citationIssues(run, 'After')}</strong></div>
      {!isStale && <button type="button" className="cv-button cv-button-quiet" onClick={onRun}><RefreshCw size={14} />重新运行</button>}
    </section>
  )
}

function SampleList({ run, selectedId, onSelect }: { run: CoverageRun; selectedId?: string; onSelect: (sample: Sample) => void }) {
  const categories = [...new Set(SKINCARE_SAMPLES.map((sample) => sample.category))]
  return (
    <section className="cv-list panel" aria-label="样例列表">
      {categories.map((category) => {
        const samples = SKINCARE_SAMPLES.filter((sample) => sample.category === category)
        return (
          <div key={category} className="cv-list-group">
            <div className="cv-list-heading" title={CATEGORY_HINTS[category]}>{category} · {samples.length}</div>
            {samples.map((sample) => {
              const result = run.results.find((item) => item.sampleId === sample.id)
              if (!result) return null
              const total = result.expectedPointKeys.length
              return (
                <button type="button" key={sample.id} className={`cv-row ${selectedId === sample.id ? 'is-selected' : ''}`} onClick={() => onSelect(sample)} aria-pressed={selectedId === sample.id}>
                  <span className="cv-row-text"><strong>{sample.text}</strong><small>覆盖 {result.coveredBefore.length}/{total} → {result.coveredAfter.length}/{total}</small></span>
                  <span className={`cv-chip is-${result.delta}`} title={DELTA_RULES[result.delta]}>{DELTA_LABELS[result.delta]}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}

function CoverageDetail({ sample, result, runSnapshot, currentDraft, previousScope, isStale, recovered, run, onNarrowAndRerun, onRun, backButtons, onContinue }: {
  sample: Sample
  result: SampleResult
  runSnapshot: StrategyConfig
  currentDraft: StrategyConfig
  previousScope: QueryCategory[]
  isStale: boolean
  recovered: boolean
  run: CoverageRun
  onNarrowAndRerun: () => void
  onRun: () => void
  backButtons: React.ReactNode
  onContinue: () => void
}) {
  const [previewMode, setPreviewMode] = useState<PreviewVersion>('after')
  const [sourcePoint, setSourcePoint] = useState<AnswerPoint | null>(null)
  const coveredBefore = new Set(result.coveredBefore)
  const coveredAfter = new Set(result.coveredAfter)
  const labelOf = (key: string) => sample.expectedPoints.find((point) => point.key === key)?.label ?? key
  const lost = result.coveredBefore.filter((key) => !coveredAfter.has(key))
  const gained = result.coveredAfter.filter((key) => !coveredBefore.has(key))
  const fixable = result.sampleId === REGRESSION_SAMPLE_ID && result.delta === 'regressed' && lost.includes(RESTORED_POINT_KEY)
  const alreadyNarrowed = currentDraft.presentation.groupByPersona
    && currentDraft.presentation.groupByPersonaAppliesTo.length === 1
    && currentDraft.presentation.groupByPersonaAppliesTo[0] === '选购类'
  const resolved = recovered && result.sampleId === REGRESSION_SAMPLE_ID && !result.missedAfter.includes(RESTORED_POINT_KEY) && !isStale

  const qualityLines: Array<{ tone: 'bad' | 'good'; label: string; text: string }> = []
  const staleDiff = result.staleCountAfter - result.staleCountBefore
  const unlabeledDiff = result.sponsoredUnlabeledAfter - result.sponsoredUnlabeledBefore
  if (staleDiff > 0) qualityLines.push({ tone: 'bad', label: '引用质量下降', text: `新增 ${staleDiff} 条超过 ${STALE_REFERENCE_DAYS} 天的引用。` })
  if (staleDiff < 0) qualityLines.push({ tone: 'good', label: '引用质量提升', text: `减少 ${-staleDiff} 条超过 ${STALE_REFERENCE_DAYS} 天的引用。` })
  if (unlabeledDiff > 0) qualityLines.push({ tone: 'bad', label: '引用质量下降', text: `新增 ${unlabeledDiff} 条未标注的合作内容。` })
  if (unlabeledDiff < 0) qualityLines.push({ tone: 'good', label: '引用质量提升', text: `未标注的合作内容减少 ${-unlabeledDiff} 条。` })
  const selectedAnswer = previewMode === 'before' ? result.before : result.after

  return (
    <article className="cv-detail panel" aria-labelledby="cv-detail-title">
      <header className="cv-detail-head">
        <h3 id="cv-detail-title">{sample.text}</h3>
        <span className="cv-chip is-neutral">{sample.category}</span>
        <span className={`cv-chip is-${result.delta}`} title={DELTA_RULES[result.delta]}>{DELTA_LABELS[result.delta]}</span>
      </header>

      <div className="cv-detail-body">
        <div className="cv-analysis">
          <section className="cv-block">
            <h4><span className="cv-step">01</span><span title="期望要点由场景负责人独立标注，和答案输出分开维护">问题与期望要点</span></h4>
            <div className="cv-expected">
              <div className="cv-expected-head"><span /><span>改动前</span><span>改动后</span></div>
              {sample.expectedPoints.map((point) => (
                <div className="cv-expected-row" key={point.key}>
                  <span>{point.label}</span>
                  <Mark ok={coveredBefore.has(point.key)} />
                  <Mark ok={coveredAfter.has(point.key)} />
                </div>
              ))}
            </div>
          </section>

          <section className={`cv-block cv-why is-${result.delta}`}>
            <h4><span className="cv-step">02</span>{result.delta === 'regressed' ? '回归原因' : '变化解释'}</h4>
            {lost.map((key) => {
              const omitted = result.after.omittedPoints.find((point) => point.pointKey === key)
              // If no template rule dropped the point, its supporting posts were filtered out by the strategy.
              const beforeEvidence = result.before.sections.flatMap((section) => section.points).find((point) => point.id === key)?.evidenceIds ?? []
              const filtered = result.after.filteredEvidence.find((entry) => beforeEvidence.includes(entry.evidenceId))
              const reason = omitted?.reason ?? (filtered ? `支撑该要点的帖子被筛除：${filtered.reason}` : '该要点未出现在改动后输出中。')
              const rule = omitted?.ruleId ?? filtered?.ruleId
              return <div key={key} className="cv-cause is-bad" title={rule ? `触发规则：${rule}` : undefined}><strong>遗漏：{labelOf(key)}</strong><span>{reason}</span></div>
            })}
            {gained.map((key) => <div key={key} className="cv-cause is-good"><strong>新增覆盖：{labelOf(key)}</strong><span>该要点在改动后获得了可追溯来源。</span></div>)}
            {qualityLines.map((line) => <div key={line.text} className={`cv-cause is-${line.tone}`}><strong>{line.label}</strong><span>{line.text}</span></div>)}
            {lost.length === 0 && gained.length === 0 && qualityLines.length === 0 && <p className="cv-why-none">期望要点覆盖与引用质量均未变化。</p>}
          </section>

          {fixable && !resolved && (
            <section className="cv-fix">
              <h4><span className="cv-step">03</span>修复适用范围并重跑</h4>
              <p>回归样例属于用法类，而「按肤质分组」的适用范围包含用法类。建议仅收窄适用范围，不手工修改结果。</p>
              <div className="cv-scope"><div><small>本次运行范围</small><strong>{previousScope.join('、') || '未选择'}</strong></div><ArrowRight size={15} /><div><small>建议范围</small><strong>选购类</strong></div></div>
              <button type="button" className="cv-button cv-button-primary" onClick={alreadyNarrowed ? onRun : onNarrowAndRerun}><RefreshCw size={14} />{alreadyNarrowed ? '按当前范围重跑' : '收窄到选购类并重跑'}</button>
            </section>
          )}

          {resolved && <section className="cv-resolved"><CircleCheck size={16} /><span>目标回归已在本次重跑中消失：「等待成膜」重新进入改动后输出。</span></section>}
        </div>

        <aside className="cv-preview" aria-label="答案卡预览">
          <AnswerPreview
            before={result.before}
            after={result.after}
            queryText={sample.text}
            mode={previewMode}
            onModeChange={setPreviewMode}
            onOpenSource={setSourcePoint}
            isDraftModified
            labelSponsored={previewMode === 'before' ? BASELINE_CONFIG.evidence.labelSponsored : runSnapshot.evidence.labelSponsored}
            posts={SKINCARE_POSTS}
            embedded
          />
        </aside>
      </div>

      <footer className="cv-detail-foot">
        <div className="cv-detail-back">{backButtons}</div>
        <ReleaseActions run={run} onReuse={onContinue} />
      </footer>

      {sourcePoint && <EvidenceDrawer point={sourcePoint} answer={selectedAnswer} posts={SKINCARE_POSTS} onClose={() => setSourcePoint(null)} />}
    </article>
  )
}

function Mark({ ok }: { ok: boolean }) {
  return <span className={`cv-mark ${ok ? 'is-ok' : 'is-miss'}`} aria-label={ok ? '已答出' : '未答出'}>{ok ? <Check size={13} /> : <X size={13} />}</span>
}

export { CoveragePage }
