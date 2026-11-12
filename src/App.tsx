import { Check, ChevronDown, CopyPlus, FilePlus2, Home, Layers3, MessageSquareWarning, Plus, RotateCcw, Sprout, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CoveragePage } from './components/coverage/CoveragePage'
import { FeedbackGovernance } from './components/feedback/FeedbackGovernance'
import { ProductHome } from './components/home/ProductHome'
import { ReuseWizard } from './components/reuse/ReuseWizard'
import { changedLabels, StrategyWorkspace } from './components/strategy/StrategyWorkspace'
import { SCENES, TEMPLATE_DRAFT_VERSION, TEMPLATE_PINNED_VERSION } from './data'
import { getConfigVersion } from './engine'
import { type DemoRole, type PageId, ROLE_LABELS, useDemoStore } from './store'

type StepPage = 'template' | 'strategy' | 'coverage'
type DemoStep = { number: string; title: string; description: string; page: StepPage }

/** Main line for one scene: card template → post filter → regression check. */
const steps: DemoStep[] = [
  { number: '01', title: '搭建卡片模板', description: '定义 AI 搜答案卡的呈现结构', page: 'template' },
  { number: '02', title: '配置筛选策略', description: '决定哪些帖子进入答案卡', page: 'strategy' },
  { number: '03', title: '运行回归检查', description: '在固定样例上验证改动影响', page: 'coverage' },
]

/** Derives each step's progress from real demo state rather than from which button was clicked last. */
function useStepProgress(): Record<StepPage, { done: boolean; status: string }> {
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const coverageRun = useDemoStore((state) => state.coverageRun)
  const visited = useDemoStore((state) => state.visitedPages)
  const templateChanges = changedLabels(draftConfig, 'template').length
  const filterChanges = changedLabels(draftConfig, 'filter').length
  const runIsCurrent = coverageRun !== null && coverageRun.configVersion === getConfigVersion(draftConfig)
  const coverage = !coverageRun
    ? { done: false, status: '样例未运行' }
    : !runIsCurrent
      ? { done: false, status: '草稿已变更，需重跑' }
      : coverageRun.summary.regressed > 0
        ? { done: false, status: `发现 ${coverageRun.summary.regressed} 条回归` }
        : { done: true, status: '当前草稿无回归' }
  return {
    template: templateChanges > 0
      ? { done: true, status: `草稿 ${TEMPLATE_DRAFT_VERSION} · 改动 ${templateChanges} 项` }
      : { done: visited.includes('template'), status: `沿用 ${TEMPLATE_PINNED_VERSION}，未改动` },
    strategy: filterChanges > 0
      ? { done: true, status: `已调整 ${filterChanges} 项` }
      : { done: visited.includes('strategy'), status: visited.includes('strategy') ? '沿用基线策略，未改动' : '未查看 · 基线策略' },
    coverage,
  }
}

const pageTitles: Record<Exclude<PageId, 'home'>, string> = {
  template: '搭建卡片模板',
  strategy: '配置筛选策略',
  coverage: '运行回归检查（概念原型）',
  reuse: '复用已有场景',
  feedback: '反馈治理（开发中）',
}

function NewSceneMenu({ onCreate, onReuse }: { onCreate: () => void; onReuse: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [open])
  return (
    <div className="new-scene" ref={ref}>
      <button type="button" className="new-scene-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Plus size={15} /><span>新建场景</span><ChevronDown size={13} />
      </button>
      {open && (
        <div className="new-scene-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onCreate() }}>
            <FilePlus2 size={16} /><span><strong>新建空白场景</strong><small>选模板、配筛选、跑回归 · 演示中以“护肤 · 选购怎么选”为例</small></span>
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onReuse() }}>
            <CopyPlus size={16} /><span><strong>复用已有场景</strong><small>在同一垂类下复用已有场景，例如从“护肤 · 选购”到“护肤 · 怎么使用”</small></span>
          </button>
        </div>
      )}
    </div>
  )
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
  if (activePage === 'home') return <ProductHome onEnterDemo={() => openWorkspacePage('template')} onOpenReuse={() => openWorkspacePage('reuse')} />
  const targetScene = SCENES.find((scene) => scene.id === 'skincare-usage')!
  const currentScene = activePage === 'reuse' ? targetScene : SCENES.find((scene) => scene.id === 'skincare-shopping')!
  const showSteps = activePage === 'template' || activePage === 'strategy' || activePage === 'coverage'

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
            <button type="button" className={`topbar-link ${activePage === 'feedback' ? 'is-active' : ''}`} onClick={() => navigate('feedback')}><MessageSquareWarning size={14} strokeWidth={1.9} />反馈治理<span className="topbar-tag">开发中</span></button>
            <span className="topbar-divider" aria-hidden="true" />
            <button type="button" className="breadcrumb" onClick={() => navigate('template')} title="回到当前场景">
              {activePage === 'reuse' && <span className="breadcrumb-label">新建场景</span>}
              <span className="crumb-pill"><Sprout size={15} />{currentScene.vertical}</span><span className="crumb-slash">/</span><span className="crumb-text">{currentScene.intent}</span>
            </button>
          </div>
          <div className="topbar-right">
            <label className="role-pill" title="账号身份：可查看所有角色的配置，只能修改自己负责的部分"><span className="sr-only">当前账号身份</span><span className="role-avatar" aria-hidden="true"><UserRound size={13} /></span><select className="role-select" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}>{(Object.keys(ROLE_LABELS) as DemoRole[]).map((id) => <option key={id} value={id}>{ROLE_LABELS[id]}</option>)}</select></label>
            <NewSceneMenu onCreate={() => navigate('template')} onReuse={() => navigate('reuse')} />
            <button type="button" className="icon-button reset-button" onClick={resetDemo} title="重置演示状态" aria-label="重置演示状态"><RotateCcw size={16} /><span>重置演示</span></button>
          </div>
        </header>

        {showSteps && (
          <nav className="stepbar" aria-label="场景配置流程">
            <div className="stepbar-inner">
              <ol className="step-track">
                {steps.map((step, index) => {
                  const isCurrent = activePage === step.page
                  const { done, status } = stepProgress[step.page]
                  return <li key={step.number} className="step-slot"><button type="button" className={`step-item ${isCurrent ? 'is-current' : ''} ${done ? 'is-past' : ''}`} onClick={() => navigate(step.page)} aria-current={isCurrent ? 'step' : undefined} title={step.description}><span className="step-number">{done && !isCurrent ? <Check size={14} /> : step.number}</span><span className="step-text"><span className="step-name">{step.title}</span><span className="step-status">{status}</span></span></button>{index < steps.length - 1 && <span className={`step-connector ${done ? 'is-past' : ''}`} aria-hidden="true" />}</li>
                })}
              </ol>
            </div>
          </nav>
        )}
      </div>

      <div className="main-shell">
        <main className="workspace">
          <h1 id="workspace-page-title" className="sr-only">{pageTitles[activePage]}</h1>

          {activePage === 'template' && <StrategyWorkspace key="template" stage="template" onNavigate={navigate} />}
          {activePage === 'strategy' && <StrategyWorkspace key="filter" stage="filter" onNavigate={navigate} />}
          {activePage === 'coverage' && <CoveragePage />}
          {activePage === 'reuse' && <ReuseWizard />}
          {activePage === 'feedback' && <FeedbackGovernance />}

          <footer className="workspace-footer"><span>作者、帖子、组织与规则均为虚构 mock 数据；结果由本地规则模拟计算，不连接真实模型、后端或线上策略。溯源表示可追踪、有依据，不代表平台为原帖真实性背书。</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
