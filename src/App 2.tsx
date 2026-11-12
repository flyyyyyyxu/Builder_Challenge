import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  Check,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileSearch,
  FlaskConical,
  Layers3,
  LockKeyhole,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Utensils,
} from 'lucide-react'
import { type PageId, useDemoStore } from './store'

const navigation: { id: PageId; label: string; icon: typeof Settings2 }[] = [
  { id: 'strategy', label: '策略配置', icon: Settings2 },
  { id: 'coverage', label: '覆盖与回归', icon: ClipboardCheck },
  { id: 'reuse', label: '跨场景复用', icon: Boxes },
]

const steps: { number: string; title: string; page: PageId }[] = [
  { number: '01', title: '配置策略与溯源', page: 'strategy' },
  { number: '02', title: '检查覆盖与回归', page: 'coverage' },
  { number: '03', title: '定位并修复回归', page: 'coverage' },
  { number: '04', title: '复用到新场景', page: 'reuse' },
]

const pageCopy: Record<PageId, { title: string; subtitle: string; currentStep: number }> = {
  strategy: {
    title: '策略配置',
    subtitle: '调整业务可配置的答案策略，并在后续阶段查看答案与来源如何变化。',
    currentStep: 0,
  },
  coverage: {
    title: '覆盖与回归',
    subtitle: '在固定样例上对照独立标注的期望要点，定位策略改动带来的影响。',
    currentStep: 1,
  },
  reuse: {
    title: '跨场景复用',
    subtitle: '从已有护肤策略出发，辨认哪些能力可以复用、哪些仍需研发。',
    currentStep: 3,
  },
}

function App() {
  const activePage = useDemoStore((state) => state.activePage)
  const navigate = useDemoStore((state) => state.navigate)
  const resetDemo = useDemoStore((state) => state.resetDemo)
  const copy = pageCopy[activePage]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Layers3 size={19} strokeWidth={2.2} /></div>
          <div>
            <div className="brand-name">策略共建台</div>
            <div className="brand-caption">概念 Demo</div>
          </div>
        </div>

        <div className="nav-group-label">工作区</div>
        <nav className="primary-nav" aria-label="主导航">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-item ${activePage === id ? 'is-active' : ''}`}
              key={id}
              onClick={() => navigate(id)}
              aria-current={activePage === id ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {activePage === id && <span className="nav-active-mark" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><CircleHelp size={16} /></div>
          <div>
            <strong>演示主线</strong>
            <p>让策略改动看得见，让固定样例里的回归查得到。</p>
          </div>
        </div>
        <div className="prototype-status"><span className="status-dot" />规则模拟原型</div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="breadcrumb-label">当前场景</span>
            <span className="crumb-pill"><Sprout size={15} />护肤</span>
            <span className="crumb-slash">/</span>
            <span className="crumb-text">选购怎么选</span>
          </div>
          <div className="topbar-right">
            <span className="role-pill"><span className="role-avatar">林</span>行业运营 <span className="role-separator">·</span> 护肤</span>
            <span className="topbar-divider" />
            <span className="version-label"><span className="version-dot" />本地演示 · v0.1</span>
            <button className="icon-button reset-button" onClick={resetDemo} title="重置演示状态" aria-label="重置演示状态">
              <RotateCcw size={16} />
              <span>重置演示</span>
            </button>
          </div>
        </header>

        <main className="workspace">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span>AI 搜答案策略共建平台</span><span className="eyebrow-divider">/</span><span>演示工作区</span></div>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
            <div className="heading-badges">
              <span className="badge badge-neutral"><FlaskConical size={14} />概念原型</span>
              <span className="badge badge-outline"><LockKeyhole size={13} />仅本地演示</span>
            </div>
          </div>

          <section className="journey-card" aria-label="演示步骤">
            <div className="journey-topline">
              <div><span className="section-kicker">DEMO FLOW</span><span className="journey-title">四步看清策略改动的影响</span></div>
              <span className="journey-time"><Clock3 size={14} />建议演示 4.5 分钟</span>
            </div>
            <div className="step-track">
              {steps.map((step, index) => {
                const isCurrent = index === copy.currentStep
                const isPast = index < copy.currentStep
                return (
                  <button key={step.number} className={`step-item ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}`} onClick={() => navigate(step.page)}>
                    <span className="step-number">{isPast ? <Check size={14} /> : step.number}</span>
                    <span className="step-name">{step.title}</span>
                    {index < steps.length - 1 && <span className={`step-connector ${isPast ? 'is-past' : ''}`} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </section>

          {activePage === 'strategy' && <StrategyHome onNavigate={navigate} />}
          {activePage === 'coverage' && <StagePreview kind="coverage" onNavigate={navigate} />}
          {activePage === 'reuse' && <StagePreview kind="reuse" onNavigate={navigate} />}

          <footer className="workspace-footer">
            <span>边界说明：这是规则模拟原型，不连接真实模型、后端或线上策略。</span>
            <span>策略共建台 <span className="footer-separator">·</span> 本地演示版本</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

function StrategyHome({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <>
      <section className="context-strip">
        <div className="context-main">
          <span className="context-icon"><FileSearch size={18} /></span>
          <div>
            <div className="context-label">正在配置的问题场景</div>
            <div className="context-query">油皮夏天防晒怎么选</div>
          </div>
        </div>
        <div className="context-meta"><span className="meta-chip">护肤</span><span className="meta-chip">选购类问题</span><span className="meta-dot" /><span>策略由行业运营配置</span></div>
      </section>

      <div className="strategy-layout">
        <section className="panel policy-panel">
          <div className="panel-heading">
            <div>
              <div className="section-kicker">STRATEGY WORKSPACE</div>
              <h2>业务可配置策略</h2>
              <p>只调整答案依据、已有组件呈现与适用范围，不改检索和模型。</p>
            </div>
            <span className="badge badge-warning"><Clock3 size={13} />阶段 2 接入交互</span>
          </div>

          <div className="tab-row" aria-label="策略分类（阶段2接入）">
            <span className="tab-button is-selected"><BookOpenCheck size={15} />内容依据</span>
            <span className="tab-button"><Sparkles size={15} />答案呈现</span>
            <span className="tab-button"><ShieldCheck size={15} />护栏规则</span>
          </div>

          <div className="policy-placeholder">
            <div className="placeholder-mark"><Settings2 size={19} /></div>
            <div className="placeholder-copy">
              <strong>策略控件将在下一阶段接入</strong>
              <p>此处将展示内容来源、时效窗口、亲身经验等可配置策略，以及对应设置者和适用范围。</p>
            </div>
            <span className="badge badge-neutral">策略位骨架</span>
          </div>

          <div className="policy-preview-list">
            <div className="preview-list-heading"><span>本页将呈现的策略位</span><span>只读结构示意</span></div>
            <div className="policy-row">
              <span className="policy-row-icon"><BadgeCheck size={16} /></span>
              <span className="policy-row-copy"><strong>优先展示亲身经验</strong><small>来源筛选 · 设置者信息将随策略展示</small></span>
              <span className="row-state">内容依据</span>
            </div>
            <div className="policy-row">
              <span className="policy-row-icon"><Layers3 size={16} /></span>
              <span className="policy-row-copy"><strong>按肤质分组 / 踩坑提醒</strong><small>已有组件 · 按问题类型限定生效范围</small></span>
              <span className="row-state">答案呈现</span>
            </div>
            <div className="policy-row">
              <span className="policy-row-icon is-locked"><LockKeyhole size={15} /></span>
              <span className="policy-row-copy"><strong>商业内容清晰标注</strong><small>示例护栏 · 社区治理配置 · 只读</small></span>
              <span className="row-state row-state-locked">示例规则</span>
            </div>
          </div>

          <div className="panel-action-row">
            <span><span className="small-status-dot" />本阶段展示工作区结构；尚未修改策略</span>
            <button className="text-action" onClick={() => onNavigate('coverage')}>查看回归检查页 <ArrowRight size={15} /></button>
          </div>
        </section>

        <aside className="preview-column">
          <div className="preview-heading">
            <div><div className="section-kicker">ANSWER PREVIEW</div><h2>AI 搜答案预览</h2></div>
            <span className="badge badge-outline">手机端</span>
          </div>
          <div className="phone-shell">
            <div className="phone-top"><span className="phone-camera" /><span className="phone-app-name">小红书 <span>AI 搜</span></span><span className="phone-search-icon" /></div>
            <div className="phone-content">
              <div className="phone-query-label">AI 搜答案</div>
              <div className="phone-query">油皮夏天防晒怎么选</div>
              <div className="phone-status-line"><span className="status-dot" />预览结构示意 · 尚未接入策略计算</div>
              <div className="phone-answer-skeleton">
                <div className="skeleton-line is-long" /><div className="skeleton-line is-medium" />
                <div className="skeleton-section"><span className="skeleton-dot" /><div className="skeleton-line is-medium" /></div>
                <div className="skeleton-line is-short" />
                <div className="skeleton-section"><span className="skeleton-dot muted-dot" /><div className="skeleton-line is-long" /></div>
                <div className="skeleton-line is-medium" />
              </div>
              <div className="phone-next-stage"><Sparkles size={15} /><span>下一阶段接入答案变化与点击溯源</span></div>
              <div className="phone-footer"><span><FileSearch size={13} />来源底栏</span><span>结构待接入</span></div>
            </div>
          </div>
          <div className="trace-note"><ShieldCheck size={15} /><span>溯源表示可追踪、有依据，不代表平台为原帖真实性背书。</span></div>
        </aside>
      </div>

      <section className="boundary-card">
        <div className="boundary-title"><span className="boundary-icon"><LockKeyhole size={17} /></span><div><h2>平台边界</h2><p>业务配置受约束的策略位；底层能力仍由研发与算法负责。</p></div></div>
        <div className="boundary-columns">
          <div className="boundary-column can-configure"><span className="boundary-column-label">业务可配置</span><span>内容依据与时效</span><span>已有答案组件开关 / 顺序</span><span>策略适用范围与固定样例集</span>
          </div>
          <div className="boundary-arrow"><ArrowDownRight size={17} /></div>
          <div className="boundary-column needs-dev"><span className="boundary-column-label">不在此配置 · 需研发 / 算法</span><span>召回与排序</span><span>模型选择与调优</span><span>新数据源与新答案组件</span>
          </div>
        </div>
        <div className="boundary-footnote"><span className="tiny-info">i</span>能力只有在多个场景反复需要且可参数化后，才考虑沉淀为策略位。此为产品假设，仍待业务验证。</div>
      </section>
    </>
  )
}

function StagePreview({ kind, onNavigate }: { kind: 'coverage' | 'reuse'; onNavigate: (page: PageId) => void }) {
  if (kind === 'coverage') {
    return (
      <section className="stage-page-card">
        <div className="stage-card-icon"><ClipboardCheck size={22} /></div>
        <div className="section-kicker">NEXT: FIXED-SAMPLE CHECK</div>
        <h2>固定样例会检查什么</h2>
        <p>该页面的交互会在阶段 3 接入。届时将以固定问题集对照独立标注的期望要点，展示改动前后输出、来源可追溯、陈旧引用与商业标注情况。</p>
        <div className="stage-checkpoints">
          <div><span className="check-index">01</span><span><strong>查看全量变化</strong><small>8 条护肤样例；结果由本地规则按数据计算</small></span></div>
          <div><span className="check-index">02</span><span><strong>追踪单条回归</strong><small>从期望要点、前后输出到适用范围原因</small></span></div>
          <div><span className="check-index">03</span><span><strong>收窄范围并重跑</strong><small>比较修复前后，不宣称真实语义质量</small></span></div>
        </div>
        <div className="stage-notice"><FlaskConical size={16} />规则模拟原型，不代表语义判断准确率；样例期望要点将独立标注。</div>
        <button className="primary-button" onClick={() => onNavigate('strategy')}>返回策略配置 <ArrowRight size={16} /></button>
      </section>
    )
  }
  return (
    <section className="stage-page-card reuse-stage-card">
      <div className="stage-card-icon reuse-icon"><Boxes size={22} /></div>
      <div className="section-kicker">NEXT: REUSE CAPABILITIES</div>
      <h2>把已有策略带到新场景</h2>
      <p>该页面的复用向导会在阶段 4 接入。目标场景固定为“家常菜 → 做法步骤”，问题是“海参蒸蛋怎么做”。</p>
      <div className="reuse-destination"><span className="destination-icon"><Utensils size={19} /></span><div><strong>家常菜 <span>/</span> 做法步骤</strong><small>海参蒸蛋怎么做</small></div><span className="destination-tag">复用目标</span></div>
      <div className="reuse-preview-columns">
        <div><span className="column-dot dot-green" /><strong>直接复用</strong><small>已有答案组件与溯源能力</small></div>
        <div><span className="column-dot dot-amber" /><strong>改配置</strong><small>适配做法步骤的问题结构</small></div>
        <div className="dashed-column"><span className="column-dot dot-gray" /><strong>待研发</strong><small>参数分布条不计入复用能力</small></div>
      </div>
      <div className="stage-notice"><LockKeyhole size={16} />“参数分布条”是待研发扩展点；新答案组件不伪装成现有能力。</div>
      <button className="primary-button" onClick={() => onNavigate('strategy')}>返回策略配置 <ArrowRight size={16} /></button>
    </section>
  )
}

export default App
