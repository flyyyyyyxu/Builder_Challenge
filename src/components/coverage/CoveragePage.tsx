import { useMemo, useState } from 'react'
import { ArrowRight, Check, CircleAlert, CircleCheck, ClipboardCheck, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react'
import { BASELINE_CONFIG } from '../../data/strategy-config'
import { COMPONENTS, DEMO_AS_OF_DATE, POINT_CATALOG, SKINCARE_POSTS, SKINCARE_SAMPLES, STALE_REFERENCE_DAYS } from '../../data'
import { getConfigVersion, runCoverageCheck } from '../../engine'
import { useDemoStore } from '../../store'
import type { CoverageRun, RenderedAnswer, Sample, SampleResult, StrategyConfig } from '../../types'
import './coverage.css'

const REGRESSION_SAMPLE_ID = 'skin-q7'
const RESTORED_POINT_KEY = 'wait-film'

type RunNotice = { tone: 'success' | 'info' | 'warning'; text: string }

function formatRate(rate: number | null): string {
  return rate === null ? '无引用' : `${Math.round(rate * 100)}%`
}

function formatScope(categories: string[]): string {
  return categories.length > 0 ? categories.join('、') : '未选择类别'
}

function deltaLabel(delta: SampleResult['delta']): string {
  if (delta === 'improved') return '提升'
  if (delta === 'regressed') return '回归'
  return '持平'
}

function getAggregateMetrics(run: CoverageRun) {
  const expectedTotal = run.results.reduce((sum, result) => sum + result.expectedPointKeys.length, 0)
  const coveredBefore = run.results.reduce((sum, result) => sum + result.coveredBefore.length, 0)
  const coveredAfter = run.results.reduce((sum, result) => sum + result.coveredAfter.length, 0)
  const beforeRates = run.results.flatMap((result) => result.traceableRateBefore === null ? [] : [result.traceableRateBefore])
  const afterRates = run.results.flatMap((result) => result.traceableRateAfter === null ? [] : [result.traceableRateAfter])
  const average = (rates: number[]) => rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null
  return {
    expectedTotal,
    coveredBefore,
    coveredAfter,
    traceableBefore: average(beforeRates),
    traceableAfter: average(afterRates),
    staleBefore: run.results.reduce((sum, result) => sum + result.staleCountBefore, 0),
    staleAfter: run.results.reduce((sum, result) => sum + result.staleCountAfter, 0),
    sponsoredBefore: run.results.reduce((sum, result) => sum + result.sponsoredUnlabeledBefore, 0),
    sponsoredAfter: run.results.reduce((sum, result) => sum + result.sponsoredUnlabeledAfter, 0),
  }
}

function CoveragePage() {
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const coverageRun = useDemoStore((state) => state.coverageRun)
  const selectedSampleId = useDemoStore((state) => state.selectedSampleId)
  const setDraftConfig = useDemoStore((state) => state.setDraftConfig)
  const setCoverageRun = useDemoStore((state) => state.setCoverageRun)
  const setSelectedSampleId = useDemoStore((state) => state.setSelectedSampleId)
  const navigate = useDemoStore((state) => state.navigate)
  const [runNotice, setRunNotice] = useState<RunNotice | null>(null)

  const currentConfigVersion = useMemo(() => getConfigVersion(draftConfig), [draftConfig])
  const isStale = coverageRun !== null && coverageRun.configVersion !== currentConfigVersion
  const aggregate = useMemo(() => coverageRun ? getAggregateMetrics(coverageRun) : null, [coverageRun])
  const selectedResult = coverageRun?.results.find((result) => result.sampleId === selectedSampleId)
    ?? coverageRun?.results.find((result) => result.delta === 'regressed')
    ?? coverageRun?.results[0]
  const selectedSample = selectedResult ? SKINCARE_SAMPLES.find((sample) => sample.id === selectedResult.sampleId) ?? null : null
  const previousScope = coverageRun?.configSnapshot.presentation.groupByPersonaAppliesTo ?? []
  const isAlreadyNarrowed = draftConfig.presentation.groupByPersona
    && draftConfig.presentation.groupByPersonaAppliesTo.length === 1
    && draftConfig.presentation.groupByPersonaAppliesTo[0] === '选购类'

  function executeRun(config: StrategyConfig, previousRun: CoverageRun | null, preferredSampleId?: string | null) {
    const nextRun = runCoverageCheck(
      BASELINE_CONFIG,
      config,
      SKINCARE_SAMPLES,
      SKINCARE_POSTS,
      COMPONENTS,
      POINT_CATALOG,
      DEMO_AS_OF_DATE,
    )
    const nextRegressionCount = nextRun.summary.regressed
    const preferred = preferredSampleId && nextRun.results.some((result) => result.sampleId === preferredSampleId)
      ? preferredSampleId
      : nextRun.results.find((result) => result.delta === 'regressed')?.sampleId ?? nextRun.results[0]?.sampleId ?? null
    setCoverageRun(nextRun)
    setSelectedSampleId(preferred)

    const priorTarget = previousRun?.results.find((result) => result.sampleId === REGRESSION_SAMPLE_ID)
    const nextTarget = nextRun.results.find((result) => result.sampleId === REGRESSION_SAMPLE_ID)
    const restored = priorTarget?.missedAfter.includes(RESTORED_POINT_KEY)
      && Boolean(nextTarget && !nextTarget.missedAfter.includes(RESTORED_POINT_KEY))

    if (restored && priorTarget && nextTarget) {
      const expectedCount = nextTarget.expectedPointKeys.length
      setRunNotice({
        tone: 'success',
        text: `已按当前草稿重新运行：目标样例的“等待成膜”已恢复；改动后覆盖 ${priorTarget.coveredAfter.length}/${expectedCount} → ${nextTarget.coveredAfter.length}/${expectedCount}。回归数 ${previousRun?.summary.regressed ?? 0} → ${nextRegressionCount}。`,
      })
    } else if (nextRegressionCount > 0) {
      setRunNotice({ tone: 'warning', text: `运行完成：当前草稿在固定样例中发现 ${nextRegressionCount} 条回归。请选择回归样例查看漏项和触发规则。` })
    } else {
      setRunNotice({ tone: 'success', text: previousRun ? '重跑完成：当前样例集未发现回归。结果来自本次实际计算。' : '运行完成：结果已按当前草稿计算，可逐条查看独立标注和引用指标。' })
    }
  }

  function handleRun() {
    executeRun(draftConfig, coverageRun, selectedSampleId)
  }

  function handleNarrowAndRerun() {
    const nextConfig: StrategyConfig = {
      ...draftConfig,
      presentation: {
        ...draftConfig.presentation,
        groupByPersona: true,
        groupByPersonaAppliesTo: ['选购类'],
      },
    }
    setDraftConfig(nextConfig)
    executeRun(nextConfig, coverageRun, selectedResult?.sampleId ?? REGRESSION_SAMPLE_ID)
  }

  function handleSelect(sample: Sample) {
    setSelectedSampleId(sample.id)
  }

  return (
    <section className="coverage-page" aria-labelledby="workspace-page-title">
      <div className="coverage-page-intro">
        <div>
          <p>运行 8 条独立标注的护肤固定样例，查看当前草稿对要点覆盖与引用护栏的影响。</p>
        </div>
        <div className="coverage-intro-badges">
          <span className="coverage-pill coverage-pill-outline">数据基准 {DEMO_AS_OF_DATE}</span>
        </div>
      </div>

      <div className="coverage-disclaimer" role="note">
        <ShieldAlert size={17} />
        <span>用于检查策略改动对固定样例的影响，不代表语义判断准确率。样例集由场景负责人维护并独立标注期望要点，改动人不能单独判定通过；具体责任人待与业务确认。</span>
      </div>

      {coverageRun && isStale && (
        <div className="coverage-stale-banner" role="status">
          <CircleAlert size={18} />
          <div><strong>当前草稿已变化，下面仍是旧运行结果</strong><span>上次配置 {coverageRun.configVersion} · 当前草稿 {currentConfigVersion}。结果未被静默替换，请按当前草稿重跑后再判断。</span></div>
          <button type="button" className="coverage-button coverage-button-primary" onClick={handleRun}><RefreshCw size={15} />按当前草稿重跑 8 条</button>
        </div>
      )}

      {runNotice && (
        <div className={`coverage-run-notice is-${runNotice.tone}`} role="status">
          {runNotice.tone === 'success' ? <CircleCheck size={17} /> : runNotice.tone === 'warning' ? <CircleAlert size={17} /> : <Sparkles size={17} />}
          <span>{runNotice.text}</span>
        </div>
      )}

      {!coverageRun ? (
        <div className="coverage-empty panel">
          <div className="coverage-empty-icon"><ClipboardCheck size={24} /></div>
          <div className="coverage-empty-copy">
            <h2>样例尚未按当前草稿运行</h2>
            <p>{draftConfig.presentation.groupByPersona
              ? '当前草稿已启用按肤质分组。运行后将逐条计算提升、持平或回归，并记录本次配置版本。'
              : '可以直接运行作为当前基线；若要复现演示回归，先返回策略配置，在“答案呈现”中开启按肤质分组。'}</p>
          </div>
          <div className="coverage-empty-actions">
            <button type="button" className="coverage-button coverage-button-primary" onClick={handleRun}><ClipboardCheck size={16} />运行 8 条样例</button>
            <button type="button" className="coverage-button coverage-button-quiet" onClick={() => navigate('strategy')}>返回策略配置 <ArrowRight size={15} /></button>
          </div>
        </div>
      ) : (
        <>
          <section className="coverage-run-heading">
            <div><h2>最近一次运行结果</h2><p>配置版本 <code>{coverageRun.configVersion}</code> · 样例期望要点与规则输出分开维护</p></div>
            {!isStale && <button type="button" className="coverage-button coverage-button-quiet" onClick={handleRun}><RefreshCw size={15} />重新运行</button>}
          </section>

          {aggregate && <CoverageMetrics run={coverageRun} aggregate={aggregate} />}

          <div className="coverage-results-grid">
            <section className="coverage-sample-list panel" aria-labelledby="sample-list-title">
              <div className="coverage-panel-heading"><div><h3 id="sample-list-title">护肤样例 · {coverageRun.results.length} 条</h3></div><span className="coverage-count-badge">独立标注</span></div>
              <div className="coverage-sample-list-body">
                {SKINCARE_SAMPLES.map((sample) => {
                  const result = coverageRun.results.find((item) => item.sampleId === sample.id)
                  if (!result) return null
                  const selected = selectedResult?.sampleId === sample.id
                  return <button type="button" key={sample.id} className={`coverage-sample-row ${selected ? 'is-selected' : ''}`} onClick={() => handleSelect(sample)} aria-pressed={selected}>
                    <span className={`coverage-delta-mark is-${result.delta}`} aria-hidden="true">{result.delta === 'improved' ? <ArrowRight size={14} /> : result.delta === 'regressed' ? <CircleAlert size={14} /> : <span>—</span>}</span>
                    <span className="coverage-sample-copy"><strong>{sample.text}</strong><small>{sample.category} · 覆盖 {result.coveredBefore.length}/{result.expectedPointKeys.length} → {result.coveredAfter.length}/{result.expectedPointKeys.length}</small></span>
                    <span className={`coverage-delta-label is-${result.delta}`}>{deltaLabel(result.delta)}</span>
                  </button>
                })}
              </div>
              <div className="coverage-list-foot">点击样例查看期望要点、前后输出及对应规则。</div>
            </section>

            {selectedResult && selectedSample ? (
              <CoverageDetail
                sample={selectedSample}
                result={selectedResult}
                run={coverageRun}
                currentDraft={draftConfig}
                onNarrowAndRerun={handleNarrowAndRerun}
                onRun={handleRun}
                onContinue={() => navigate('reuse')}
                isStale={isStale}
                previousScope={previousScope}
                isAlreadyNarrowed={isAlreadyNarrowed}
                recoveryConfirmed={Boolean(runNotice?.text.includes('“等待成膜”已恢复'))}
              />
            ) : (
              <div className="coverage-detail-empty panel"><CircleAlert size={19} />运行结果中没有找到对应样例，请重置演示后重新运行。</div>
            )}
          </div>

          <details className="coverage-maintenance panel">
            <summary>指标口径与判断边界</summary>
            <div className="coverage-maintenance-body">
              <p>样例由场景负责人维护，改动人不应单独判定通过；线上问题可以补入样例集，具体责任人待业务确认。本页面只模拟固定 mock 样例，不判断原帖真实性、语义质量或上线收益。</p>
              <p>覆盖按“有独立期望要点且至少关联一条可追溯引用”计算；陈旧引用对照固定的场景时效标准（示例 {STALE_REFERENCE_DAYS} 天），不随草稿里的时效窗口变化，放宽窗口时会被检出；未标注商业内容逐样例汇总。</p>
            </div>
          </details>
        </>
      )}
    </section>
  )
}

function CoverageMetrics({ run, aggregate }: { run: CoverageRun; aggregate: ReturnType<typeof getAggregateMetrics> }) {
  const beforeCoverage = aggregate.expectedTotal ? `${aggregate.coveredBefore}/${aggregate.expectedTotal}` : '—'
  const afterCoverage = aggregate.expectedTotal ? `${aggregate.coveredAfter}/${aggregate.expectedTotal}` : '—'
  return (
    <div className="coverage-metrics-grid" aria-label="总体检查指标">
      <MetricCard label="独立要点覆盖" before={beforeCoverage} after={afterCoverage} helper="覆盖 / 期望要点总数" />
      <MetricCard label="引用可追溯率" before={formatRate(aggregate.traceableBefore)} after={formatRate(aggregate.traceableAfter)} helper="非空样例等权平均" />
      <MetricCard label="陈旧引用" before={String(aggregate.staleBefore)} after={String(aggregate.staleAfter)} helper={`引用发布超过 ${STALE_REFERENCE_DAYS} 天（场景时效标准）`} />
      <MetricCard label="商业内容未标注" before={String(aggregate.sponsoredBefore)} after={String(aggregate.sponsoredAfter)} helper="逐样例合计" />
      <div className="coverage-delta-summary">
        <span className="section-kicker">本次变化 · {run.results.length} 条样例</span>
        <div><strong className="is-improved">{run.summary.improved} 提升</strong><strong className="is-same">{run.summary.same} 持平</strong><strong className="is-regressed">{run.summary.regressed} 回归</strong></div>
        <small>分类由本次规则引擎计算，不是静态指标。</small>
      </div>
    </div>
  )
}

function MetricCard({ label, before, after, helper }: { label: string; before: string; after: string; helper: string }) {
  return <div className="coverage-metric-card"><span>{label}</span><strong>{before} <i>→</i> {after}</strong><small>{helper}</small></div>
}

function CoverageDetail({
  sample,
  result,
  run,
  currentDraft,
  onNarrowAndRerun,
  onRun,
  onContinue,
  isStale,
  previousScope,
  isAlreadyNarrowed,
  recoveryConfirmed,
}: {
  sample: Sample
  result: SampleResult
  run: CoverageRun
  currentDraft: StrategyConfig
  onNarrowAndRerun: () => void
  onRun: () => void
  onContinue: () => void
  isStale: boolean
  previousScope: string[]
  isAlreadyNarrowed: boolean
  recoveryConfirmed: boolean
}) {
  const coveredBefore = new Set(result.coveredBefore)
  const coveredAfter = new Set(result.coveredAfter)
  const regressionPoint = sample.expectedPoints.find((point) => result.missedAfter.includes(point.key))
  const fixableRegression = result.sampleId === REGRESSION_SAMPLE_ID && result.delta === 'regressed' && Boolean(regressionPoint)
  const resolvedRegression = recoveryConfirmed && result.sampleId === REGRESSION_SAMPLE_ID && !result.missedAfter.includes(RESTORED_POINT_KEY) && !isStale
  const scopeBefore = formatScope(previousScope)
  const scopeNow = formatScope(currentDraft.presentation.groupByPersonaAppliesTo)

  return (
    <article className="coverage-detail-panel panel" aria-labelledby="coverage-detail-title">
      <div className="coverage-detail-topline"><div><span className={`coverage-delta-label is-${result.delta}`}>{deltaLabel(result.delta)}</span></div><span className="coverage-config-chip">运行配置 {run.configVersion}</span></div>
      <h3 id="coverage-detail-title">{sample.text}</h3>

      <section className="coverage-detail-block">
        <div className="coverage-detail-step"><span>01</span><h4>问题与期望要点</h4></div>
        <div className="coverage-query-meta"><span className="coverage-category-chip">{sample.category}</span><span>期望要点由 {sample.annotatedBy} 维护</span></div>
        <div className="coverage-expected-list">
          {sample.expectedPoints.map((point) => {
            const before = coveredBefore.has(point.key)
            const after = coveredAfter.has(point.key)
            return <div className="coverage-expected-row" key={point.key}><span className="coverage-expected-label">{point.label}</span><span className={`coverage-side-status ${before ? 'is-covered' : 'is-missing'}`}>前 {before ? '已覆盖' : '缺失'}</span><span className={`coverage-side-status ${after ? 'is-covered' : 'is-missing'}`}>后 {after ? '已覆盖' : '缺失'}</span></div>
          })}
        </div>
        <small className="coverage-annotation-note">{sample.annotationNote}</small>
      </section>

      <section className="coverage-detail-block">
        <div className="coverage-detail-step"><span>02</span><h4>改动前 / 改动后输出</h4></div>
        <div className="coverage-answer-compare">
          <AnswerSide title="改动前 · 固定基线" answer={result.before} missingKeys={result.missedBefore} />
          <AnswerSide title="改动后 · 本次运行配置" answer={result.after} missingKeys={result.missedAfter} />
        </div>
        <div className="coverage-detail-metrics"><span>改前覆盖 {result.coveredBefore.length}/{result.expectedPointKeys.length}</span><span>改后覆盖 {result.coveredAfter.length}/{result.expectedPointKeys.length}</span><span>可追溯 {formatRate(result.traceableRateAfter)}</span><span>陈旧 {result.staleCountAfter}</span><span>未标注商业内容 {result.sponsoredUnlabeledAfter}</span></div>
      </section>

      <section className={`coverage-cause-block ${result.delta === 'regressed' ? 'is-regression' : 'is-explanation'}`}>
        <div className="coverage-detail-step"><span>03</span><h4>{result.delta === 'regressed' ? '回归原因' : '变化解释'}</h4></div>
        <p>{result.reason}</p>
        {result.missedAfter.map((key) => {
          const omitted = result.after.omittedPoints.find((point) => point.pointKey === key)
          const expected = sample.expectedPoints.find((point) => point.key === key)
          return <div className="coverage-omission" key={key}><strong>遗漏：{expected?.label ?? key}</strong><span>{omitted?.reason ?? '此期望要点未出现在改动后输出中。'}</span>{omitted && <small>触发规则：{omitted.ruleId} · 关联 mock 来源 {omitted.evidenceIds.length} 条</small>}</div>
        })}
        {result.missedAfter.length === 0 && <div className="coverage-restored-line"><Check size={15} />改动后所有独立标注要点均有可追溯引用。</div>}
      </section>

      {fixableRegression && (
        <section className="coverage-fix-card">
          <div className="coverage-detail-step"><span>04</span><h4>修复适用范围并重跑</h4></div>
          <p>回归样例是“用法类”，而按肤质分组当前范围同时包含“选购类、用法类”。只收窄范围，不手工改结果。</p>
          <div className="coverage-scope-diff"><div><small>本次运行范围</small><strong>{scopeBefore}</strong></div><ArrowRight size={16} /><div><small>建议范围</small><strong>选购类</strong></div></div>
          <p className="coverage-current-scope">当前草稿范围：{scopeNow}{isAlreadyNarrowed ? '（已收窄，可直接重跑）' : ''}</p>
          <button type="button" className="coverage-button coverage-button-primary" onClick={isAlreadyNarrowed ? onRun : onNarrowAndRerun}><RefreshCw size={15} />{isAlreadyNarrowed ? '按当前窄范围重跑 8 条' : '收窄到选购类并重跑'}</button>
        </section>
      )}

      {resolvedRegression && (
        <section className="coverage-resolved-card"><CircleCheck size={17} /><div><strong>目标回归已在本次重跑中消失</strong><span>“等待成膜”重新进入改动后输出；当前判断来自配置版本 {run.configVersion}。</span></div></section>
      )}

      <div className="coverage-detail-footer">
        <span>{isStale ? '当前草稿已变更；本详情仍保留最近一次运行快照。' : '结果绑定本次配置版本；修改策略后需要重新运行。'}</span>
        {run.summary.regressed === 0 && !isStale
          ? <button type="button" className="coverage-button coverage-button-primary" onClick={onContinue}>继续跨场景复用 <ArrowRight size={15} /></button>
          : <button type="button" className="coverage-button coverage-button-quiet" onClick={() => useDemoStore.getState().navigate('strategy')}>回到策略配置调整 <ArrowRight size={15} /></button>}
      </div>
    </article>
  )
}

function AnswerSide({ title, answer, missingKeys }: { title: string; answer: RenderedAnswer; missingKeys: string[] }) {
  const points = answer.sections.flatMap((section) => section.points.map((point) => ({ ...point, sectionTitle: section.title })))
  const missing = new Set(missingKeys)
  const omissions = answer.omittedPoints.filter((point) => missing.has(point.pointKey))
  return (
    <div className="coverage-answer-side">
      <div className="coverage-answer-side-title"><strong>{title}</strong><small>{points.length} 个输出要点</small></div>
      {points.length > 0 ? <div className="coverage-answer-points">{points.map((point) => <div className={`coverage-answer-point is-${point.change}`} key={`${point.sectionTitle}-${point.id}`}>
        <span className={`coverage-change-tag is-${point.change}`}>{point.change === 'added' ? '新增' : point.change === 'removed' ? '移除' : '保留'}</span>
        <span>{point.text}</span><small>{point.sectionTitle} · 引用 {point.evidenceIds.length} 条</small>
      </div>)}</div> : <div className="coverage-no-points">本次输出没有可展示的答案要点。</div>}
      {omissions.map((point) => <div className="coverage-omitted-point" key={point.pointKey}><strong>未进入输出：{point.text}</strong><span>{point.reason}</span></div>)}
      <div className="coverage-answer-footer"><span>引用可追溯 {answer.sections.flatMap((section) => section.points).reduce((sum, point) => sum + point.evidenceIds.length, 0)} 条</span><span>{answer.footer.noteCount} 笔记 · {answer.footer.commentCount} 评论</span></div>
    </div>
  )
}

export { CoveragePage }
