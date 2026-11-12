import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleAlert,
  ClipboardCheck,
  FileSearch,
  Layers3,
  Lightbulb,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  MessageSquareWarning,
  UsersRound,
} from 'lucide-react'
import { FEEDBACK_PIPELINE } from '../feedback/FeedbackGovernance'
import './product-home.css'

type ProductHomeProps = {
  onEnterDemo: () => void
  onOpenReuse: () => void
}

const userPainPoints = [
  {
    icon: FileSearch,
    title: '结论从哪里来？',
    description: '来源和上下文看不清，用户很难核对答案依据。',
    key: '来源与依据',
  },
  {
    icon: CircleAlert,
    title: '经验有分歧，哪条适合我？',
    description: '不同人群、立场和使用条件，需要被整理而不是抹平。',
    key: '适配与分歧',
  },
  {
    icon: Search,
    title: '内容还新吗？商业信息清楚吗？',
    description: '时效和合作标记影响用户理解一条经验的方式。',
    key: '时效与标识',
  },
]

const productValues = [
  {
    icon: SlidersHorizontal,
    title: '让三方共建、权责清楚',
    description: '商业化、行业运营、社区治理各自负责卡片模板里的模块和帖子筛选的规则；账号之间可互相查看，只能修改自己负责的部分。',
  },
  {
    icon: FileSearch,
    title: '让每条结论有依据',
    description: '从答案要点回到引用内容与生效规则，能够解释“为什么出现这条答案”。',
  },
  {
    icon: ClipboardCheck,
    title: '让改动影响可验证',
    description: '对照独立标注的固定问题，发现覆盖变化和回归，再按修复后的配置重新运行。',
  },
]

const demoSteps = [
  {
    number: '01',
    title: '搭建卡片模板',
    description: '以“油皮夏天防晒怎么选”为例，行业运营开启按肤质分组和踩坑提醒，查看答案卡的变化并打开引用溯源。',
    icon: SlidersHorizontal,
  },
  {
    number: '02',
    title: '配置筛选策略',
    description: '按角色查看决定帖子能否入卡的规则；切换到商业化账号，演示与社区治理底线规则的冲突如何转为待讨论。',
    icon: Search,
  },
  {
    number: '03',
    title: '运行回归检查',
    description: '检查 8 条固定样例，追踪“等待成膜”要点为何遗漏；把分组范围收窄到选购类后重跑，回归消失。',
    icon: Check,
  },
]

export function ProductHome({ onEnterDemo, onOpenReuse }: ProductHomeProps) {
  return (
    <div className="product-home" id="top">
      <header className="intro-header">
        <a className="intro-brand" href="#top" aria-label="策略共建台首页">
          <span className="intro-brand-mark" aria-hidden="true"><Layers3 size={19} strokeWidth={2.2} /></span>
          <span><strong>策略共建台</strong><small>AI 搜答案平台方案</small></span>
        </a>
        <nav className="intro-nav" aria-label="产品介绍目录">
          <a href="#problem">问题与依据</a>
          <a href="#solution">产品方案</a>
          <a href="#flow">演示路径</a>
        </nav>
        <button type="button" className="intro-header-cta" onClick={onEnterDemo}>
          进入策略工作台 <ArrowUpRight size={16} />
        </button>
      </header>

      <main>
        <section className="intro-hero" aria-labelledby="intro-hero-title">
          <div className="intro-hero-copy">
            <div className="intro-overline"><span className="intro-overline-dot" />小红书搜索产品再定义</div>
            <p className="intro-question">面试题目 · 如何平衡 AI 与真人内容</p>
            <h1 id="intro-hero-title">把真人经验组织好，<br /><em>让每次策略改动都看得见。</em></h1>
            <p className="intro-hero-lede">我设计了一套面向场景 PM 与行业运营的 AI 搜答案策略共建平台：业务可以调整答案依据与结构，逐条查看来源，并在固定样例上发现和修复回归。</p>
            <div className="intro-hero-actions">
              <button type="button" className="intro-primary-cta" onClick={onEnterDemo}>进入策略工作台 <ArrowRight size={17} /></button>
              <a className="intro-secondary-cta" href="#solution">先看产品方案 <ArrowRight size={16} /></a>
            </div>
            <div className="intro-audience-line"><UsersRound size={16} /><span>首批用户</span><strong>搜索场景 PM</strong><i /> <strong>行业运营</strong></div>
          </div>

          <div className="intro-hero-visual" aria-label="展示一次答案策略回归定位和修复的示意图">
            <div className="hero-visual-topline"><span><span className="hero-live-dot" />一条策略变更的影响链</span><span className="hero-visual-tag">固定样例示意</span></div>
            <div className="hero-query-card">
              <span>问题</span>
              <strong>防晒和粉底的先后顺序</strong>
              <small>护肤 · 用法类</small>
            </div>
            <div className="hero-rule-card">
              <div className="hero-rule-icon"><SlidersHorizontal size={17} /></div>
              <div><span>策略改动</span><strong>开启按肤质分组</strong></div>
              <span className="hero-rule-scope">范围过宽</span>
            </div>
            <div className="hero-point-row">
              <span className="hero-point-mark"><CircleAlert size={15} /></span>
              <span><small>期望要点</small><strong>等待成膜</strong></span>
              <span className="hero-point-state is-missed">未覆盖</span>
            </div>
            <div className="hero-repair-row">
              <span className="hero-repair-line" aria-hidden="true" />
              <span className="hero-repair-icon"><Check size={14} /></span>
              <span>适用范围收窄至 <strong>选购类</strong>，按新配置重跑</span>
            </div>
            <div className="hero-result-card">
              <div><span>固定样例中的回归</span><small>规则模拟计算 · 非线上指标</small></div>
              <div className="hero-result-change"><strong>1</strong><span>条</span><ArrowRight size={15} /><strong className="is-restored">0</strong><span>条</span></div>
            </div>
            <div className="hero-visual-caption"><Check size={13} />从“策略变更”到“原因定位”，再到“修复验证”</div>
          </div>
        </section>

        <div className="intro-principle-strip" aria-label="产品原则">
          <span><Check size={15} />不改召回与模型</span>
          <span><Check size={15} />答案结论能追溯</span>
          <span><Check size={15} />策略影响可检查</span>
        </div>

        <section className="intro-section intro-problem" id="problem" aria-labelledby="problem-title">
          <div className="intro-section-heading">
            <span className="intro-section-index">01 / 为什么做</span>
            <div><h2 id="problem-title">用户找的是经验，<br />也需要知道这份经验是否适合自己。</h2>
              <p>答案不只要“生成出来”，还要让人看得到依据、理解分歧，并能判断内容是否新鲜、是否带有商业关系。</p></div>
          </div>
          <div className="intro-pain-grid">
            {userPainPoints.map(({ icon: Icon, title, description, key }) => (
              <article className="intro-pain-card" key={key}>
                <span className="intro-card-icon"><Icon size={19} /></span>
                <span className="intro-card-kicker">用户关心</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className="intro-evidence-grid">
            <article className="intro-evidence-card is-evidence">
              <span className="intro-evidence-label"><span className="evidence-mark" />已有用户侧依据</span>
              <h3>这些问题来自具体反馈，不是从功能倒推出来的。</h3>
              <p>项目访谈材料记录：8 位访谈用户和 10 条反馈，多次提到来源、时效、分歧、软广、“是否适合我”和答案太长。</p>
              <small>依据来源：项目内访谈与反馈整理；数字仅描述该批材料，不代表总体用户占比。</small>
            </article>
            <article className="intro-evidence-card is-hypothesis">
              <span className="intro-evidence-label"><Lightbulb size={15} />平台侧判断 · 待验证</span>
              <h3>业务经验能否沉淀成多场景可复用的策略能力？</h3>
              <p>我的判断是：场景 PM 与行业运营有答案组织经验，但策略共性、变更对研发的依赖和跨团队协作方式，仍需要访谈与流程盘点验证。</p>
              <small>如果需求只是单一场景的偶发问题，就不先建平台，优先在业务内组件化。</small>
            </article>
          </div>
          <p className="intro-impact-note"><ShieldCheck size={16} /><span>产品影响判断：当来源、适配或时效难以辨认时，用户可能更难判断答案是否可用；这是一条待验证的影响路径，不是已证明的线上结论。</span></p>
        </section>

        <section className="intro-section intro-solution" id="solution" aria-labelledby="solution-title">
          <div className="intro-section-heading">
            <span className="intro-section-index">02 / 我做了什么</span>
            <div><h2 id="solution-title">不是再做一个答案生成器，<br /><em>而是给业务一套可控、可追溯、可验证的策略工具。</em></h2>
              <p>把“业务怎么组织答案”变成明确的策略位，再把答案变化和固定样例检查连起来。</p></div>
          </div>
          <div className="intro-solution-layout">
            <div className="intro-solution-statement">
              <span className="intro-solution-mark"><Layers3 size={22} /></span>
              <h3>让业务经验进入答案，但不越过平台边界。</h3>
              <p>三个角色共同维护 AI 搜答案卡的呈现模板和帖子筛选规则；召回、排序、模型调优、新数据源和新组件仍由研发与算法负责。</p>
              <button type="button" className="intro-text-link" onClick={onEnterDemo}>查看策略配置与答案预览 <ArrowRight size={15} /></button>
            </div>
            <div className="intro-value-stack">
              {productValues.map(({ icon: Icon, title, description }, index) => (
                <article className="intro-value-row" key={title}>
                  <span className="intro-value-number">0{index + 1}</span>
                  <span className="intro-value-icon"><Icon size={18} /></span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  <Check className="intro-value-check" size={17} />
                </article>
              ))}
            </div>
          </div>
          <div className="intro-balance-banner">
            <span className="intro-balance-icon"><ShieldCheck size={20} /></span>
            <div><strong>平衡点不在“AI 或真人”二选一。</strong><p>让模型与策略组织答案，让真人经验保留来源、分歧和适用条件；每一次业务改动都能回到证据上检查。</p></div>
          </div>
        </section>

        <section className="intro-section intro-flow" id="flow" aria-labelledby="flow-title">
          <div className="intro-section-heading intro-flow-heading">
            <span className="intro-section-index">03 / 怎么演示</span>
            <div><h2 id="flow-title">一个场景的配置主线，<br />再看两项延伸能力。</h2>
              <p>先走完“模板 → 筛选 → 回归”的主线，再看跨场景复用和反馈治理。</p></div>
          </div>
          <div className="intro-demo-flow">
            {demoSteps.map(({ number, title, description, icon: Icon }, index) => (
              <article className="intro-demo-step" key={number}>
                <div className="intro-demo-step-top"><span>{number}</span><Icon size={18} /></div>
                <h3>{title}</h3>
                <p>{description}</p>
                {index < demoSteps.length - 1 && <span className="intro-demo-connector" aria-hidden="true" />}
              </article>
            ))}
          </div>
          <div className="intro-reuse-branch">
            <div className="intro-reuse-branch-icon"><Layers3 size={20} /></div>
            <div className="intro-reuse-branch-copy"><span>延伸能力 · 右上角“新建场景 → 复用已有场景”</span><h3>场景复用：从“护肤 · 选购怎么选”到“护肤 · 怎么使用”</h3><p>同一垂类下的新意图，共用帖子池和已有组件；分清哪些能力直接复用、哪些需要改配置、哪些仍待研发，不把规划中的能力算作现成成果。</p></div>
            <button type="button" className="intro-reuse-link" onClick={onOpenReuse}>查看复用示例 <ArrowRight size={15} /></button>
          </div>
          <div className="intro-reuse-branch intro-feedback-branch" id="feedback">
            <div className="intro-reuse-branch-icon"><MessageSquareWarning size={20} /></div>
            <div className="intro-reuse-branch-copy">
              <span>延伸能力 · 开发中</span>
              <h3>反馈治理：被反馈帖子的评测打分与分级处置</h3>
              <p>大部分反馈由系统自动分流，人工只处理需要判断的部分，提升反馈的处理效率和成效。</p>
              <ol className="intro-feedback-steps">
                {FEEDBACK_PIPELINE.map((step, index) => <li key={step.title}><strong>{String(index + 1).padStart(2, '0')} {step.title}</strong><span>{step.body}</span></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="intro-closing" aria-labelledby="closing-title">
          <div className="intro-closing-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="intro-closing-copy"><span>一句话总结</span><h2 id="closing-title">改了什么看得见，<br />影响与依据查得到，<br /><em>能力带到新场景说得清。</em></h2></div>
          <div className="intro-closing-action"><p>进入工作台，亲手调整一项策略并检查它的影响。</p><button type="button" className="intro-primary-cta" onClick={onEnterDemo}>开始策略演示 <ArrowRight size={17} /></button></div>
        </section>
      </main>

      <footer className="intro-footer">
        <a className="intro-footer-brand" href="#top"><span className="intro-brand-mark"><Layers3 size={16} /></span><strong>策略共建台</strong></a>
        <span>本页的回归结果来自固定演示样例，不代表语义评测或线上效果。</span>
        <a href="#top">回到顶部 <ArrowUpRight size={13} /></a>
      </footer>
    </div>
  )
}
