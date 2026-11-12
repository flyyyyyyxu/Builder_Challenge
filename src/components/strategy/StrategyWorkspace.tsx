import { useMemo, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Check,
  ChevronRight,
  FileSearch,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  BASELINE_CONFIG,
  COMPONENTS,
  DEMO_AS_OF_DATE,
  MAIN_QUERY,
  POINT_CATALOG,
  SKINCARE_POSTS,
  STRATEGY_ITEMS,
  STRATEGY_ITEMS_BY_PATH,
} from '../../data'
import { renderAnswer } from '../../engine'
import { useDemoStore, type PageId, type PreviewVersion } from '../../store'
import type { AnswerPoint, ConfigPath, ConfigValue, ContentKind, QueryCategory, RenderedAnswer, StrategyConfig, StrategyItem, StrategyTab } from '../../types'
import { AnswerPreview, markAnswerDiff } from './AnswerPreview'
import { EvidenceDrawer } from './EvidenceDrawer'
import './strategy.css'

const TABS: Array<{ id: StrategyTab; label: string; icon: typeof BookOpenCheck }> = [
  { id: 'evidence', label: '内容依据', icon: BookOpenCheck },
  { id: 'presentation', label: '答案呈现', icon: Sparkles },
  { id: 'guardrail', label: '护栏规则', icon: ShieldCheck },
]
const COMPONENT_ORDER_IDS = ['conclusion', 'persona-groups', 'step-list', 'pitfall-card']
const COMPONENT_LABELS: Record<string, string> = {
  conclusion: '一句话结论',
  'persona-groups': '肤质分组',
  'step-list': '步骤列表',
  'pitfall-card': '踩坑提醒',
}
const CONTENT_KIND_LABELS: Record<ContentKind, string> = { note: '笔记', comment: '评论' }
const CATEGORY_OPTIONS: QueryCategory[] = ['选购类', '用法类']

function getConfigValue(config: StrategyConfig, path: ConfigPath): ConfigValue {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  return (config[section] as unknown as Record<string, ConfigValue>)[key]
}

function isModified(config: StrategyConfig, path: ConfigPath): boolean {
  return JSON.stringify(getConfigValue(config, path)) !== JSON.stringify(getConfigValue(BASELINE_CONFIG, path))
}

function pointsOf(answer: RenderedAnswer): AnswerPoint[] {
  return answer.sections.flatMap((section) => section.points)
}

function sourceLabel(item: StrategyItem, changed: boolean): string {
  if (changed) return '本地演示草稿'
  if (item.isExampleGuardrail) return '示例规则'
  if (item.source === 'platform-default') return '平台默认值（示例）'
  if (item.source === 'scene-template') return '场景模板（示例）'
  return '本地演示草稿'
}

function scopeLabel(item: StrategyItem, config: StrategyConfig): string {
  if (item.key === 'presentation.groupByPersona' || item.key === 'presentation.groupByPersonaAppliesTo') {
    return `当前范围：${config.presentation.groupByPersonaAppliesTo.join('、') || '未选择类别'}`
  }
  if (item.key === 'presentation.componentOrder') return '当前护肤选购问题的已有答案组件'
  if (item.key === 'guardrails.sponsoredPosition') return '当前护肤场景；示例护栏只读'
  return '当前场景：护肤 → 选购怎么选'
}

function SettingMeta({ item, config }: { item: StrategyItem; config: StrategyConfig }) {
  const changed = isModified(config, item.key)
  const team = changed ? '护肤行业运营（示例）' : item.setBy.team
  const name = changed ? '演示操作者（虚构）' : item.setBy.name
  return (
    <div className="s2-setting-meta">
      <span>设置者：{team} · {name}</span>
      <span>来源：{sourceLabel(item, changed)}</span>
      <span>{scopeLabel(item, config)}</span>
      {item.isExampleGuardrail && <span className="s2-example-rule-badge">示例规则 · 只读</span>}
    </div>
  )
}

function PolicyItem({ item, config, children, className = '' }: {
  item: StrategyItem
  config: StrategyConfig
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`s2-policy-item ${className}`}>
      <div className="s2-policy-main">
        <div className="s2-policy-title-row">
          <h3>{item.label}</h3>
          {isModified(config, item.key) && <span className="s2-draft-mark">已改动</span>}
        </div>
        <p className="s2-policy-description">{item.explanation}</p>
        <SettingMeta item={item} config={config} />
      </div>
      <div className="s2-policy-control">{children}</div>
    </section>
  )
}

function SwitchControl({ checked, label, onChange, disabled = false }: {
  checked: boolean
  label: string
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <span className="s2-switch-field">
      <button
        type="button"
        className={`s2-switch ${checked ? 'is-on' : ''}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
      >
        <span className="s2-switch-thumb" />
      </button>
      <span className="s2-switch-value">{checked ? '开启' : '关闭'}</span>
    </span>
  )
}

function StrategyControls({ tab, config, onChange }: {
  tab: StrategyTab
  config: StrategyConfig
  onChange: (next: StrategyConfig) => void
}) {
  const item = (path: ConfigPath) => STRATEGY_ITEMS_BY_PATH[path]
  const patchEvidence = <K extends keyof StrategyConfig['evidence']>(key: K, value: StrategyConfig['evidence'][K]) => {
    onChange({ ...config, evidence: { ...config.evidence, [key]: value } })
  }
  const patchPresentation = <K extends keyof StrategyConfig['presentation']>(key: K, value: StrategyConfig['presentation'][K]) => {
    onChange({ ...config, presentation: { ...config.presentation, [key]: value } })
  }

  if (tab === 'evidence') {
    const kinds = (['note', 'comment'] as ContentKind[])
    return (
      <div className="s2-control-list" role="tabpanel" aria-label="内容依据策略">
        <PolicyItem item={item('evidence.allowedKinds')} config={config} className="is-stack">
          <div className="s2-choice-row">
            {kinds.map((kind) => {
              const checked = config.evidence.allowedKinds.includes(kind)
              return (
                <label className={`s2-choice ${checked ? 'is-checked' : ''}`} key={kind}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => patchEvidence('allowedKinds', checked
                      ? config.evidence.allowedKinds.filter((value) => value !== kind)
                      : [...config.evidence.allowedKinds, kind])}
                  />
                  <span className="s2-checkmark"><Check size={12} /></span>
                  {CONTENT_KIND_LABELS[kind]}
                </label>
              )
            })}
          </div>
        </PolicyItem>
        <PolicyItem item={item('evidence.preferFirstHand')} config={config}>
          <SwitchControl checked={config.evidence.preferFirstHand} label="优先展示亲身经验" onChange={() => patchEvidence('preferFirstHand', !config.evidence.preferFirstHand)} />
        </PolicyItem>
        <PolicyItem item={item('evidence.freshnessDays')} config={config}>
          <select
            className="s2-select"
            aria-label="时效窗口"
            value={config.evidence.freshnessDays}
            onChange={(event) => {
              const raw = event.target.value
              patchEvidence('freshnessDays', raw === '不限' ? '不限' : Number(raw) as 90 | 180 | 365)
            }}
          >
            <option value="90">近 90 天</option>
            <option value="180">近 180 天</option>
            <option value="365">近 365 天</option>
            <option value="不限">不限</option>
          </select>
        </PolicyItem>
        <PolicyItem item={item('evidence.includeCounterEvidence')} config={config}>
          <SwitchControl checked={config.evidence.includeCounterEvidence} label="保留正反面经验" onChange={() => patchEvidence('includeCounterEvidence', !config.evidence.includeCounterEvidence)} />
        </PolicyItem>
        <PolicyItem item={item('evidence.labelSponsored')} config={config}>
          <SwitchControl checked={config.evidence.labelSponsored} label="商业内容标注" onChange={() => patchEvidence('labelSponsored', !config.evidence.labelSponsored)} />
        </PolicyItem>
      </div>
    )
  }

  if (tab === 'presentation') {
    const moveComponent = (componentId: string, offset: -1 | 1) => {
      const order = config.presentation.componentOrder.filter((id) => COMPONENT_ORDER_IDS.includes(id))
      const current = order.indexOf(componentId)
      const target = current + offset
      if (current < 0 || target < 0 || target >= order.length) return
      ;[order[current], order[target]] = [order[target], order[current]]
      const fixedComponents = config.presentation.componentOrder.filter((id) => !COMPONENT_ORDER_IDS.includes(id))
      patchPresentation('componentOrder', [...order, ...fixedComponents])
    }
    return (
      <div className="s2-control-list" role="tabpanel" aria-label="答案呈现策略">
        <PolicyItem item={item('presentation.groupByPersona')} config={config}>
          <SwitchControl checked={config.presentation.groupByPersona} label="按肤质分组" onChange={() => patchPresentation('groupByPersona', !config.presentation.groupByPersona)} />
        </PolicyItem>
        <PolicyItem item={item('presentation.groupByPersonaAppliesTo')} config={config} className="is-stack">
          <div className="s2-choice-row">
            {CATEGORY_OPTIONS.map((category) => {
              const checked = config.presentation.groupByPersonaAppliesTo.includes(category)
              return (
                <label className={`s2-choice ${checked ? 'is-checked' : ''}`} key={category}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => patchPresentation('groupByPersonaAppliesTo', checked
                      ? config.presentation.groupByPersonaAppliesTo.filter((value) => value !== category)
                      : [...config.presentation.groupByPersonaAppliesTo, category])}
                  />
                  <span className="s2-checkmark"><Check size={12} /></span>
                  {category}
                </label>
              )
            })}
          </div>
        </PolicyItem>
        <PolicyItem item={item('presentation.showPitfall')} config={config}>
          <SwitchControl checked={config.presentation.showPitfall} label="踩坑提醒" onChange={() => patchPresentation('showPitfall', !config.presentation.showPitfall)} />
        </PolicyItem>
        <PolicyItem item={item('presentation.showConclusion')} config={config}>
          <SwitchControl checked={config.presentation.showConclusion} label="一句话结论" onChange={() => patchPresentation('showConclusion', !config.presentation.showConclusion)} />
        </PolicyItem>
        <PolicyItem item={item('presentation.componentOrder')} config={config} className="is-stack">
          <ol className="s2-order-list" aria-label="已有答案组件顺序">
            {COMPONENT_ORDER_IDS.map((id) => {
              const editableOrder = config.presentation.componentOrder.filter((value) => COMPONENT_ORDER_IDS.includes(value))
              const position = editableOrder.indexOf(id)
              return (
                <li key={id}>
                  <span className="s2-order-number">{position >= 0 ? String(position + 1).padStart(2, '0') : '—'}</span>
                  <span>{COMPONENT_LABELS[id]}</span>
                  <span className="s2-order-actions">
                    <button type="button" aria-label={`上移${COMPONENT_LABELS[id]}`} disabled={position <= 0} onClick={() => moveComponent(id, -1)}><ArrowUp size={13} /></button>
                    <button type="button" aria-label={`下移${COMPONENT_LABELS[id]}`} disabled={position < 0 || position === editableOrder.length - 1} onClick={() => moveComponent(id, 1)}><ArrowDown size={13} /></button>
                  </span>
                </li>
              )
            })}
          </ol>
        </PolicyItem>
      </div>
    )
  }

  const guardrail = item('guardrails.sponsoredPosition')
  return (
    <div className="s2-control-list" role="tabpanel" aria-label="护栏规则">
      <PolicyItem item={guardrail} config={config} className="is-readonly">
        <div className="s2-readonly-value">
          <LockKeyhole size={15} />
          <span>{config.guardrails.sponsoredPosition === 'afterConclusion' ? '结论之后展示' : '结论之前展示'}</span>
        </div>
      </PolicyItem>
      <div className="s2-guardrail-note">
        <ShieldCheck size={17} />
        <div><strong>护栏冲突需要讨论，不自动采纳</strong><p>此为社区治理团队（示例）的只读规则。冲突检测只返回待讨论事项，不会替负责人改写规则。</p></div>
      </div>
      <div className="s2-guardrail-boundary"><LockKeyhole size={15} /><span>业务可调整商业内容是否保留标注；呈现位置由示例护栏约束。</span></div>
    </div>
  )
}

export function StrategyWorkspace({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const activeTab = useDemoStore((state) => state.activeStrategyTab)
  const setTab = useDemoStore((state) => state.setStrategyTab)
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const setDraftConfig = useDemoStore((state) => state.setDraftConfig)
  const previewVersion = useDemoStore((state) => state.previewVersion)
  const setPreviewVersion = useDemoStore((state) => state.setPreviewVersion)
  const sourcePoint = useDemoStore((state) => state.sourcePoint)
  const openSource = useDemoStore((state) => state.openSource)
  const closeSource = useDemoStore((state) => state.closeSource)
  const resetStrategy = useDemoStore((state) => state.resetStrategy)

  const beforeRaw = useMemo(
    () => renderAnswer(BASELINE_CONFIG, MAIN_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE),
    [],
  )
  const afterRaw = useMemo(
    () => renderAnswer(draftConfig, MAIN_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE),
    [draftConfig],
  )
  const { before, after } = useMemo(() => markAnswerDiff(beforeRaw, afterRaw), [beforeRaw, afterRaw])
  const modified = JSON.stringify(draftConfig) !== JSON.stringify(BASELINE_CONFIG)
  const changedSettings = STRATEGY_ITEMS.filter((setting) => isModified(draftConfig, setting.key)).map((setting) => setting.label)
  const beforeKeys = new Set(pointsOf(beforeRaw).map((point) => point.id))
  const afterKeys = new Set(pointsOf(afterRaw).map((point) => point.id))
  const addedCount = [...afterKeys].filter((key) => !beforeKeys.has(key)).length
  const removedCount = [...beforeKeys].filter((key) => !afterKeys.has(key)).length
  const diffSummary = changedSettings.length === 0
    ? '当前草稿与基线一致；答案内容未发生变化。'
    : `改动策略：${changedSettings.join('、')}。本题预览新增 ${addedCount} 个要点、移除 ${removedCount} 个要点；这是单题规则预览，不是固定样例检查结果。`
  const selectedAnswer = previewVersion === 'before' ? before : after

  return (
    <>
      <section className="context-strip s2-context-strip">
        <div className="context-main">
          <span className="context-icon"><FileSearch size={18} /></span>
          <div><div className="context-label">正在配置的问题场景</div><div className="context-query">{MAIN_QUERY.text}</div></div>
        </div>
        <div className="context-meta"><span className="meta-chip">护肤</span><span className="meta-chip">选购类</span><span className="meta-dot" /><span>行业运营（示例）</span></div>
      </section>

      <div className="s2-workspace-grid">
        <section className="panel s2-editor-panel" aria-labelledby="strategy-editor-title">
          <div className="s2-panel-heading">
            <div><div className="section-kicker">STRATEGY WORKSPACE</div><h2 id="strategy-editor-title">业务可配置策略</h2><p>调整已有策略位，右侧单题预览即时重算；不会发布或改变线上策略。</p></div>
            <span className="s2-draft-status"><span className="s2-live-dot" />本地演示草稿</span>
          </div>

          <div className="s2-tab-row" role="tablist" aria-label="策略分类">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={`s2-tab ${activeTab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          <StrategyControls tab={activeTab} config={draftConfig} onChange={setDraftConfig} />

          <div className="s2-editor-footer">
            <div><span className="s2-unsaved-dot" /><span>{modified ? '策略草稿已改动；预览已即时更新，尚未运行固定样例检查。' : '当前为初始基线；修改只保存在本地演示状态。'}</span></div>
            <button type="button" className="s2-reset-button" onClick={resetStrategy} disabled={!modified}><RotateCcw size={14} />恢复默认配置</button>
          </div>
        </section>

        <aside className="s2-preview-column" aria-label="答案变化预览">
          <div className="s2-preview-heading">
            <div><div className="section-kicker">ANSWER PREVIEW</div><h2>AI 搜答案预览</h2></div>
            <span className="badge badge-outline">手机端</span>
          </div>
          <AnswerPreview
            before={before}
            after={after}
            queryText={MAIN_QUERY.text}
            mode={previewVersion}
            onModeChange={(mode: PreviewVersion) => setPreviewVersion(mode)}
            onOpenSource={openSource}
            onNavigateCoverage={() => onNavigate('coverage')}
            diffSummary={diffSummary}
            isDraftModified={modified}
            labelSponsored={previewVersion === 'before' ? BASELINE_CONFIG.evidence.labelSponsored : draftConfig.evidence.labelSponsored}
            posts={SKINCARE_POSTS}
          />
          <div className="trace-note s2-trace-note"><ShieldCheck size={15} /><span>溯源表示可追踪、有依据，不代表平台为原帖真实性背书。</span></div>
        </aside>
      </div>

      <details className="s2-boundary-details">
        <summary><span><LockKeyhole size={15} />需研发 / 算法（不在此配置）</span><ChevronRight size={15} className="s2-details-chevron" /></summary>
        <div className="s2-boundary-grid">
          <div><strong>召回与排序</strong><span>候选内容获取与排序逻辑不由本页修改。</span></div>
          <div><strong>模型选择与调优</strong><span>底层模型和参数由研发 / 算法负责。</span></div>
          <div><strong>新答案组件</strong><span>仅能调整现有组件；新增能力需研发实现。</span></div>
          <div><strong>新数据源</strong><span>本地样例只在既有 mock 来源中筛选。</span></div>
        </div>
      </details>

      {sourcePoint && <EvidenceDrawer point={sourcePoint} answer={selectedAnswer} posts={SKINCARE_POSTS} onClose={closeSource} />}
    </>
  )
}
