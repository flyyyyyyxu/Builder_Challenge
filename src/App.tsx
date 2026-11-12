import {
  Boxes,
  Check,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  Home,
  Layers3,
  LockKeyhole,
  RotateCcw,
  Settings2,
  Sprout,
  Utensils,
  UserRound,
} from 'lucide-react'
import { useEffect } from 'react'
import { CoveragePage } from './components/coverage/CoveragePage'
import { ProductHome } from './components/home/ProductHome'
import { ReuseWizard } from './components/reuse/ReuseWizard'
import { StrategyWorkspace } from './components/strategy/StrategyWorkspace'
import { SCENES } from './data'
import { type PageId, type WorkflowStep, useDemoStore } from './store'

const navigation: { id: PageId; label: string; icon: typeof Settings2 }[] = [
  { id: 'strategy', label: '策略配置', icon: Settings2 },
  { id: 'coverage', label: '覆盖与回归', icon: ClipboardCheck },
  { id: 'reuse', label: '跨场景复用', icon: Boxes },
]

const steps: { number: string; title: string; page: PageId; flowStep: WorkflowStep }[] = [
  { number: '01', title: '配置策略与溯源', page: 'strategy', flowStep: 0 },
  { number: '02', title: '检查覆盖与回归', page: 'coverage', flowStep: 1 },
  { number: '03', title: '定位并修复回归', page: 'coverage', flowStep: 2 },
  { number: '04', title: '复用到新场景', page: 'reuse', flowStep: 3 },
]

const pageCopy: Record<Exclude<PageId, 'home'>, { title: string; subtitle: string }> = {
  strategy: {
    title: '策略配置',
    subtitle: '调整业务可配置的答案策略，实时查看单题预览和引用来源。',
  },
  coverage: {
    title: '策略覆盖与回归检查（概念原型）',
    subtitle: '运行固定护肤样例，追踪范围误用造成的回归，并按当前草稿重跑验证修复。',
  },
  reuse: {
    title: '跨场景复用向导',
    subtitle: '从明确版本的护肤示例模板出发，确认家常菜目标并检查可带走的能力。',
  },
}

function App() {
  const activePage = useDemoStore((state) => state.activePage)
  const navigate = useDemoStore((state) => state.navigate)
  const resetDemo = useDemoStore((state) => state.resetDemo)
  const flowStep = useDemoStore((state) => state.flowStep)
  const setFlowStep = useDemoStore((state) => state.setFlowStep)
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
  const copy = pageCopy[activePage]
  const targetScene = SCENES.find((scene) => scene.id === 'home-cooking-steps')!
  const currentScene = activePage === 'reuse' ? targetScene : SCENES.find((scene) => scene.id === 'skincare-shopping')!
  const SceneIcon = activePage === 'reuse' ? Utensils : Sprout

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Layers3 size={19} strokeWidth={2.2} /></div>
          <div><div className="brand-name">策略共建台</div><div className="brand-caption">概念 Demo</div></div>
        </div>
        <nav className="primary-nav" aria-label="主导航">
          <button type="button" className="nav-item" onClick={() => navigate('home')} aria-label="产品介绍">
            <Home size={18} strokeWidth={1.9} /><span>产品介绍</span>
          </button>
          <div className="nav-group-label">工作区</div>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button type="button" className={`nav-item ${activePage === id ? 'is-active' : ''}`} key={id} onClick={() => navigate(id)} aria-current={activePage === id ? 'page' : undefined} aria-label={label}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{activePage === id && <span className="nav-active-mark" aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><div className="sidebar-note-icon"><CircleHelp size={16} /></div><div><strong>演示主线</strong><p>让策略改动看得见，让固定样例里的回归查得到。</p></div></div>
        <div className="prototype-status"><span className="status-dot" />规则模拟原型</div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb"><span className="breadcrumb-label">当前目标</span><span className="crumb-pill"><SceneIcon size={15} />{currentScene.vertical}</span><span className="crumb-slash">/</span><span className="crumb-text">{currentScene.intent}</span></div>
          <div className="topbar-right">
            <span className="role-pill"><span className="sr-only">当前身份：</span><span className="role-avatar" aria-hidden="true"><UserRound size={13} /></span>行业运营 <span className="role-separator">·</span> {activePage === 'reuse' ? '跨场景复用' : '护肤'}</span>
            <span className="topbar-divider" />
            <span className="version-label"><span className="version-dot" />本地演示 · 草稿</span>
            <button type="button" className="icon-button reset-button" onClick={resetDemo} title="重置演示状态" aria-label="重置演示状态"><RotateCcw size={16} /><span>重置演示</span></button>
          </div>
        </header>

        <main className="workspace">
          <div className="page-heading">
            <div><div className="eyebrow"><span>AI 搜答案策略共建平台</span><span className="eyebrow-divider">/</span><span>演示工作区</span></div><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
            <div className="heading-badges"><span className="badge badge-neutral"><FlaskConical size={14} />概念原型</span><span className="badge badge-outline"><LockKeyhole size={13} />仅本地演示</span></div>
          </div>

          <section className="journey-card" aria-label="演示步骤">
            <div className="journey-topline"><div><span className="section-kicker">DEMO FLOW</span><span className="journey-title">四步看清策略改动的影响</span></div><span className="journey-time"><Clock3 size={14} />建议演示 4.5 分钟</span></div>
            <div className="step-track">
              {steps.map((step, index) => {
                const isCurrent = flowStep === step.flowStep
                const isPast = flowStep > step.flowStep
                return <button type="button" key={step.number} className={`step-item ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}`} onClick={() => { navigate(step.page); setFlowStep(step.flowStep) }} aria-current={isCurrent ? 'step' : undefined}><span className="step-number">{isPast ? <Check size={14} /> : step.number}</span><span className="step-name">{step.title}</span>{index < steps.length - 1 && <span className={`step-connector ${isPast ? 'is-past' : ''}`} aria-hidden="true" />}</button>
              })}
            </div>
          </section>

          {activePage === 'strategy' && <StrategyWorkspace onNavigate={navigate} />}
          {activePage === 'coverage' && <CoveragePage />}
          {activePage === 'reuse' && <ReuseWizard />}

          <footer className="workspace-footer"><span>边界说明：本地规则模拟，不连接真实模型、后端或线上策略。</span><span>策略共建台 <span className="footer-separator">·</span> 演示草稿</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
