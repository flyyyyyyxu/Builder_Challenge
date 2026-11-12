import { Check, Clock3, Home, Layers3, RotateCcw, Sprout, Utensils, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { CoveragePage } from './components/coverage/CoveragePage'
import { ProductHome } from './components/home/ProductHome'
import { ReuseWizard } from './components/reuse/ReuseWizard'
import { StrategyWorkspace } from './components/strategy/StrategyWorkspace'
import { BASELINE_CONFIG, SCENES } from './data'
import { getConfigVersion } from './engine'
import { type DemoRole, type PageId, ROLE_LABELS, useDemoStore } from './store'

type DemoStep = { number: string; title: string; page: Exclude<PageId, 'home'> }

/** Demo main line: one task per workspace module, in the order of demo-plan §4 (①②③). */
const steps: DemoStep[] = [
  { number: '01', title: '配置策略、查看依据', page: 'strategy' },
  { number: '02', title: '发现并修复回归', page: 'coverage' },
  { number: '03', title: '复用到新场景', page: 'reuse' },
]

/** Derives each step's progress from real demo state rather than from which button was clicked last. */
function useStepProgress(): Record<DemoStep['page'], { done: boolean; status: string }> {
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const coverageRun = useDemoStore((state) => state.coverageRun)
  const reuseReport = useDemoStore((state) => state.reuseReport)
  const modified = JSON.stringify(draftConfig) !== JSON.stringify(BASELINE_CONFIG)
  const runIsCurrent = coverageRun !== null && coverageRun.configVersion === getConfigVersion(draftConfig)
  const coverage = !coverageRun
    ? { done: false, status: '样例未运行' }
    : !runIsCurrent
      ? { done: false, status: '草稿已变更，需重跑' }
      : coverageRun.summary.regressed > 0
        ? { done: false, status: `发现 ${coverageRun.summary.regressed} 条回归` }
        : { done: true, status: '当前草稿无回归' }
  return {
    strategy: { done: modified, status: modified ? '草稿已改动' : '基线配置' },
    coverage,
    reuse: { done: reuseReport !== null, status: reuseReport ? '已生成复用清单' : '未生成清单' },
  }
}

const pageTitles: Record<Exclude<PageId, 'home'>, string> = {
  strategy: '策略配置',
  coverage: '策略覆盖与回归检查（概念原型）',
  reuse: '跨场景复用向导',
}

function App() {
  const activePage = useDemoStore((state) => state.activePage)
  const navigate = useDemoStore((state) => state.navigate)
  const resetDemo = useDemoStore((state) => state.resetDemo)
  const stepProgress = useStepProgress()
  const role = useDemoStore((state) => state.role)
  const setRole = useDemoStore((state) => state.setRole)
  const openWorkspacePage = (page: Exclude<PageId, 'home'>) => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
    }
    navigate(page)
  }
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [activePage])
  if (activePage === 'home') return <ProductHome onEnterDemo={() => openWorkspacePage('strategy')} onOpenReuse={() => openWorkspacePage('reuse')} />
    const targetScene = SCENES.find((scene) => scene.id === 'home-cooking-steps')!
  const currentScene = activePage === 'reuse' ? targetScene : SCENES.find((scene) => scene.id === 'skincare-shopping')!
  const SceneIcon = activePage === 'reuse' ? Utensils : Sprout

  return (
    <div className="app-shell">
      <div className="shell-sticky">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="brand-lockup" onClick={() => navigate('home')} title="回到产品介绍">
              <span className="brand-mark" aria-hidden="true"><Layers3 size={17} strokeWidth={2.2} /></span>
              <span className="brand-name">策略共建台</span>
            </button>
            <button type="button" className="topbar-link" onClick={() => navigate('home')}><Home size={14} strokeWidth={1.9} />产品介绍</button>
            <span className="topbar-divider" aria-hidden="true" />
            <div className="breadcrumb"><span className="crumb-pill"><SceneIcon size={15} />{currentScene.vertical}</span><span className="crumb-slash">/</span><span className="crumb-text">{currentScene.intent}</span></div>
          </div>
          <div className="topbar-right">
            <label className="role-pill"><span className="sr-only">当前身份</span><span className="role-avatar" aria-hidden="true"><UserRound size={13} /></span><select className="role-select" value={role} onChange={(event) => setRole(event.target.value as DemoRole)} title="切换演示身份（商业化身份用于演示护栏冲突）">{(Object.keys(ROLE_LABELS) as DemoRole[]).map((id) => <option key={id} value={id}>{ROLE_LABELS[id]}</option>)}</select></label>
            <button type="button" className="icon-button reset-button" onClick={resetDemo} title="重置演示状态" aria-label="重置演示状态"><RotateCcw size={16} /><span>重置演示</span></button>
          </div>
        </header>

        <nav className="stepbar" aria-label="演示步骤">
          <div className="stepbar-inner">
            <ol className="step-track">
              {steps.map((step, index) => {
                const isCurrent = activePage === step.page
                const { done, status } = stepProgress[step.page]
                return <li key={step.number} className="step-slot"><button type="button" className={`step-item ${isCurrent ? 'is-current' : ''} ${done ? 'is-past' : ''}`} onClick={() => navigate(step.page)} aria-current={isCurrent ? 'step' : undefined}><span className="step-number">{done && !isCurrent ? <Check size={14} /> : step.number}</span><span className="step-text"><span className="step-name">{step.title}</span><span className="step-status">{status}</span></span></button>{index < steps.length - 1 && <span className={`step-connector ${done ? 'is-past' : ''}`} aria-hidden="true" />}</li>
              })}
            </ol>
            <span className="journey-time"><Clock3 size={13} />建议演示 4.5 分钟</span>
          </div>
        </nav>
      </div>

      <div className="main-shell">
        <main className="workspace">
          <h1 id="workspace-page-title" className="sr-only">{pageTitles[activePage]}</h1>

          {activePage === 'strategy' && <StrategyWorkspace onNavigate={navigate} />}
          {activePage === 'coverage' && <CoveragePage />}
          {activePage === 'reuse' && <ReuseWizard />}

          <footer className="workspace-footer"><span>作者、帖子、组织与规则均为虚构 mock 数据；结果由本地规则模拟计算，不连接真实模型、后端或线上策略。</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
