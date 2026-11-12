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
  onOpenFeedback: () => void
}

const userPainPoints = [
  {
    icon: FileSearch,
    title: '出处在哪？还新吗？',
    description: '看不到结论引用了哪几篇笔记、是什么时候写的，用户就没法核对，也不敢照着做。',
    key: '来源与时效',
  },
  {
    icon: CircleAlert,
    title: '适合我吗？说法不一样怎么办？',
    description: '油皮和干皮、新手和老手的经验常常相反；被平均成一句话，反而谁都用不上。',
    key: '人群与分歧',
  },
  {
    icon: Search,
    title: '这是广告吗？能短点吗？',
    description: '软广混进经验会伤害社区信任；答案又长又散，用户读不完，也抓不住重点。',
    key: '商业与体验',
  },
]

const productValues = [
  {
    icon: SlidersHorizontal,
    title: '能共建：各团队在权限内配规则',
    description: '卡片模板管“怎么呈现”，笔记筛选管“引用哪些笔记”，总结校验管“说得对不对”（规划中）。每个团队只改自己负责的部分，规则冲突转为待讨论，不会被单方覆盖。',
  },
  {
    icon: ClipboardCheck,
    title: '能验证：改动上线前先跑回归',
    description: '在独立标注的固定样例上检查每次改动的影响，定位哪条要点漏了、为什么漏，修复后重跑再上线；每条结论都能回溯到引用笔记和生效规则。',
  },
  {
    icon: Layers3,
    title: '能复用、持续迭代：跟着社区一起变',
    description: '验证有效的规则可以复用到垂类新场景；被用户反馈的笔记由系统智能打标，作为后续治理参考，让规则随内容趋势持续更新。',
  },
]

const demoSteps = [
  {
    number: '01',
    title: '搭建卡片模板',
    description: '以“油皮夏天防晒怎么选”为例，行业运营开启按肤质分组和踩坑提醒，答案卡预览即时变化，点开要点能看到引用了哪几篇笔记；切换到商业化账号提议调整品牌说位置，与社区治理底线冲突时转为待讨论，而不是直接覆盖。',
    icon: SlidersHorizontal,
  },
  {
    number: '02',
    title: '配置筛选策略',
    description: '按角色查看决定笔记能否入卡的规则，生效顺序为社区治理底线、商业化、行业运营；调整时效或互动门槛，能看到哪些笔记新入卡、哪些被筛掉以及原因。',
    icon: Search,
  },
  {
    number: '03',
    title: '运行回归检查',
    description: '在 8 条固定样例上检查改动影响，揪出“等待成膜”要点为何漏掉；把分组范围收窄到选购类后重跑，回归消失，再上线。',
    icon: Check,
  },
]

export function ProductHome({ onEnterDemo, onOpenReuse, onOpenFeedback }: ProductHomeProps) {
  return (
    <div className="product-home" id="top">
      <header className="intro-header">
        <a className="intro-brand" href="#top" aria-label="AI 搜答策略共建平台首页">
          <span className="intro-brand-mark" aria-hidden="true"><Layers3 size={19} strokeWidth={2.2} /></span>
          <span><strong>AI 搜答策略共建平台</strong><small>小红书搜索 · 概念 Demo</small></span>
        </a>
        <nav className="intro-nav" aria-label="主导航">
          <button type="button" className="is-active" aria-current="page" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>产品介绍</button>
          <button type="button" onClick={onEnterDemo}>策略配置</button>
          <button type="button" onClick={onOpenFeedback}>反馈治理<span className="intro-nav-tag">开发中</span></button>
        </nav>
        <button type="button" className="intro-header-cta" onClick={onEnterDemo}>
          进入策略工作台 <ArrowUpRight size={16} />
        </button>
      </header>

      <main>
        <section className="intro-hero" aria-labelledby="intro-hero-title">
          <div className="intro-hero-copy">
            <div className="intro-overline"><span className="intro-overline-dot" />小红书搜索产品再定义</div>
            <h1 id="intro-hero-title">AI 搜答<br /><em>策略共建平台</em></h1>
            <p className="intro-hero-tagline">不做更弱的通用 AI，<strong>做更强的小红书</strong></p>
            <p className="intro-hero-lede">AI 搜一搜的内容规则共建平台：各团队在自己的权限内，决定答案卡怎么呈现、引用哪些笔记；改动上线前先做回归验证，有效规则复用到新场景，跟着社区持续迭代。</p>
            <div className="intro-hero-actions">
              <button type="button" className="intro-primary-cta" onClick={onEnterDemo}>进入策略工作台 <ArrowRight size={17} /></button>
              <a className="intro-secondary-cta" href="#solution">先看产品方案 <ArrowRight size={16} /></a>
            </div>
            <div className="intro-audience-line"><UsersRound size={16} /><span>首批用户</span><strong>行业运营 · 场景 PM</strong><i /><span>首期共建</span><strong>商业化 · 社区治理</strong></div>
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
          <span><Check size={15} />规则能共建</span>
          <span><Check size={15} />改动可验证、可复用</span>
          <span><Check size={15} />跟着社区持续迭代</span>
        </div>

        <section className="intro-section intro-problem" id="problem" aria-labelledby="problem-title">
          <div className="intro-section-heading">
            <span className="intro-section-index">01 / 为什么做</span>
            <div><h2 id="problem-title">问题不只在答案准不准，<br />还在卡片怎么呈现、该引用哪些笔记。</h2>
              <p>用户来小红书搜的是真人经验。AI 总结如果只追求“答对”，就只是更弱的通用 AI；它还要让人看到出处、分清分歧、判断内容新不新、是不是广告。</p></div>
          </div>
          <div className="intro-pain-grid">
            {userPainPoints.map(({ icon: Icon, title, description, key }) => (
              <article className="intro-pain-card" key={key}>
                <span className="intro-card-icon"><Icon size={19} /></span>
                <span className="intro-card-kicker">用户在问</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <div className="intro-evidence-grid">
            <article className="intro-evidence-card is-evidence">
              <span className="intro-evidence-label"><span className="evidence-mark" />用户侧依据</span>
              <h3>这些问题来自访谈，不是从功能倒推出来的。</h3>
              <p>8 位访谈用户、10 条反馈里反复出现：软广、是否适合我、出处、时效、说法不一和答案太长。</p>
              <small>来源：项目访谈与反馈整理，不代表总体用户占比。</small>
            </article>
            <article className="intro-evidence-card is-hypothesis">
              <span className="intro-evidence-label"><Lightbulb size={15} />业务在卡 · 待验证</span>
              <h3>最懂内容的团队，改不动 AI 的答案。</h3>
              <p>运营经验进不了答案；改一条策略要排研发；规则改坏了也没人看得见。规则如果只由单一团队或行业专家拍板，也很难同时兼顾社区真实感、商业化和用户体验。</p>
            </article>
          </div>
        </section>

        <section className="intro-section intro-solution" id="solution" aria-labelledby="solution-title">
          <div className="intro-section-heading">
            <span className="intro-section-index">02 / 做了什么</span>
            <div><h2 id="solution-title">让 AI 搜一搜的内容规则，<br /><em>能共建、可复用、跟着社区持续迭代。</em></h2>
              <p>把“卡片怎么呈现、引用哪些笔记、总结怎么校验”拆成明确的规则位，交给最懂这一块的团队维护，再用回归验证兜住每一次改动。</p></div>
          </div>
          <div className="intro-solution-layout">
            <div className="intro-solution-statement">
              <span className="intro-solution-mark"><Layers3 size={22} /></span>
              <h3>规则融合社区、业务和用户习惯，不由一个团队拍板。</h3>
              <p>首批用户是改策略、跑回归的行业运营和场景 PM；商业化、社区治理首期一起接入，守各自负责的规则；电商等团队后续接入。大家在各自权限内配置卡片模板、笔记筛选策略和总结校验规则（规划中）；召回、排序和模型调优仍由研发与算法负责。</p>
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
            <div><strong>平衡点不在“AI 或真人”二选一，而在商业化、社区真实感和用户体验三者兼顾。</strong><p>不只答得准，还要呈现对、引用对：AI 负责把经验组织好，真人笔记保留出处、分歧和适用条件。</p></div>
          </div>
        </section>

        <section className="intro-section intro-flow" id="flow" aria-labelledby="flow-title">
          <div className="intro-section-heading intro-flow-heading">
            <span className="intro-section-index">03 / 产品流程</span>
            <div><h2 id="flow-title">一个场景走完配置主线，<br />再看两项延伸能力。</h2>
              <p>“搭模板 → 配筛选 → 跑回归”是一次规则改动的完整流程；场景复用和反馈治理，让规则带到新场景、跟着社区迭代。</p></div>
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
            <div className="intro-reuse-branch-copy"><span>延伸能力 · 右上角“新建场景 → 复用已有场景”</span><h3>场景复用：把有效规则从“护肤 · 选购怎么选”带到“护肤 · 怎么使用”</h3><p>同一垂类下的新意图，共用笔记池和已有组件；分清哪些能力直接复用、哪些需要改配置、哪些仍待研发。</p></div>
            <button type="button" className="intro-reuse-link" onClick={onOpenReuse}>查看复用示例 <ArrowRight size={15} /></button>
          </div>
          <div className="intro-reuse-branch intro-feedback-branch" id="feedback">
            <div className="intro-reuse-branch-icon"><MessageSquareWarning size={20} /></div>
            <div className="intro-reuse-branch-copy">
              <span>延伸能力 · 开发中</span>
              <h3>反馈治理：智能打标被用户反馈的笔记</h3>
              <p>被反馈的笔记由系统自动打分打标、分级处置，人工只复核需要判断的部分；打标结果作为后续治理和规则迭代的参考。</p>
              <ol className="intro-feedback-steps">
                {FEEDBACK_PIPELINE.map((step, index) => <li key={step.title}><strong>{String(index + 1).padStart(2, '0')} {step.title}</strong><span>{step.body}</span></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section className="intro-closing" aria-labelledby="closing-title">
          <div className="intro-closing-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="intro-closing-copy"><span>一句话总结</span><h2 id="closing-title">让 AI 搜一搜的内容规则<br />能共建、可复用，<br /><em>跟着社区持续迭代。</em></h2></div>
          <div className="intro-closing-action"><p>进入工作台，选一个角色调整一条规则，看它怎么影响答案卡。</p><button type="button" className="intro-primary-cta" onClick={onEnterDemo}>开始策略演示 <ArrowRight size={17} /></button></div>
        </section>
      </main>

      <footer className="intro-footer">
        <a className="intro-footer-brand" href="#top"><span className="intro-brand-mark"><Layers3 size={16} /></span><strong>AI 搜答策略共建平台</strong></a>
        <span>概念 Demo：品牌与数据均为虚构，回归结果来自固定演示样例，不代表线上指标。</span>
        <a href="#top">回到顶部 <ArrowUpRight size={13} /></a>
      </footer>
    </div>
  )
}
