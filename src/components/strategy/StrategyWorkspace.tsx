import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BellRing,
  Check,
  ChevronRight,
  CircleAlert,
  History,
  LayoutTemplate,
  LockKeyhole,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import {
  BASELINE_CONFIG,
  COMPONENTS,
  FILTER_RULES,
  DEMO_AS_OF_DATE,
  MAIN_QUERY,
  POINT_CATALOG,
  ROLE_DUTIES,
  SKINCARE_POSTS,
  STRATEGY_ITEMS_BY_PATH,
  TEMPLATE_DRAFT_VERSION,
  TEMPLATE_LIBRARY,
  TEMPLATE_PINNED_VERSION,
  TEMPLATE_VERSION_HISTORY,
} from '../../data'
import { detectConflicts, getConfigVersion, renderAnswer } from '../../engine'
import { DEMO_ROLES, ROLE_LABELS, ROLE_TAB_LABELS, useDemoStore, type DemoRole, type PageId, type PreviewVersion } from '../../store'
import type { ConfigPath, ConfigValue, ContentKind, MinNoteLikes, Post, QueryCategory, RenderedAnswer, SponsoredCap, StrategyConfig } from '../../types'
import { AnswerPreview, markAnswerDiff, type CheckStatus } from './AnswerPreview'
import { slotForPath, type CardSlot, type SlotId } from '../answer-card/slots'
import { EvidenceDrawer } from './EvidenceDrawer'
import { EditStrategyDialog, EditTemplateDialog, ruleLabel } from './EditDialogs'
import './strategy.css'

/** Step 01 edits the card template (presentation + guardrails); step 02 edits the post filter (evidence). */
export type WorkspaceStage = 'template' | 'filter'

const COMPONENT_ORDER_IDS = ['conclusion', 'persona-groups', 'step-list', 'pitfall-card']
/** Which switch turns each orderable component on; components without one are always shown. */
const COMPONENT_TOGGLES: Partial<Record<string, keyof StrategyConfig['presentation']>> = {
  conclusion: 'showConclusion',
  'persona-groups': 'groupByPersona',
  'pitfall-card': 'showPitfall',
}
const COMPONENT_LABELS: Record<string, string> = {
  conclusion: '一句话结论',
  'persona-groups': '肤质分组',
  'step-list': '步骤列表',
  'pitfall-card': '踩坑提醒',
}
const CONTENT_KIND_LABELS: Record<ContentKind, string> = { note: '笔记', comment: '评论' }
const CATEGORY_OPTIONS: QueryCategory[] = ['选购类', '用法类']

/** Which config paths belong to each stage; used for per-stage dirty state and reset. */
const STAGE_PATHS: Record<WorkspaceStage, ConfigPath[]> = {
  template: [
    'presentation.groupByPersona',
    'presentation.groupByPersonaAppliesTo',
    'presentation.showPitfall',
    'presentation.showConclusion',
    'presentation.componentOrder',
  ],
  filter: [
    'evidence.allowedKinds',
    'evidence.freshnessDays',
    'evidence.minNoteLikes',
    'evidence.preferFirstHand',
    'evidence.preferMatchingPersona',
    'evidence.allowSponsored',
    'evidence.sponsoredPersonaMatch',
    'evidence.includeCounterEvidence',
    'evidence.sponsoredCap',
  ],
}

function getConfigValue(config: StrategyConfig, path: ConfigPath): ConfigValue {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  return (config[section] as unknown as Record<string, ConfigValue>)[key]
}

function isModified(config: StrategyConfig, path: ConfigPath): boolean {
  return JSON.stringify(getConfigValue(config, path)) !== JSON.stringify(getConfigValue(BASELINE_CONFIG, path))
}

function setConfigValue(config: StrategyConfig, path: ConfigPath, value: ConfigValue): StrategyConfig {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  const copy = Array.isArray(value) ? [...value] : value
  return { ...config, [section]: { ...config[section], [key]: copy } }
}

/** Changes on a page; on step 02 a deleted rule is listed as “删除「…」” instead of its field change. */
export function changedLabels(config: StrategyConfig, stage: WorkspaceStage, removed: string[] = []): string[] {
  if (stage === 'template') return STAGE_PATHS.template.filter((path) => isModified(config, path)).map((path) => STRATEGY_ITEMS_BY_PATH[path].label)
  const removedPaths = new Set(FILTER_RULES.filter((rule) => removed.includes(rule.id) && rule.path).map((rule) => rule.path))
  const edited = STAGE_PATHS.filter.filter((path) => !removedPaths.has(path) && isModified(config, path)).map((path) => STRATEGY_ITEMS_BY_PATH[path].label)
  const deleted = FILTER_RULES.filter((rule) => removed.includes(rule.id)).map((rule) => `删除「${ruleLabel(rule)}」`)
  return [...edited, ...deleted]
}

/** Applies a new set of deleted rules: newly deleted fields go neutral, restored fields go back to baseline. */
function applyRemovedRules(config: StrategyConfig, previous: string[], next: string[]): StrategyConfig {
  let result = config
  for (const rule of FILTER_RULES) {
    if (!rule.path) continue
    const was = previous.includes(rule.id)
    const now = next.includes(rule.id)
    if (!was && now && rule.neutral !== undefined) result = setConfigValue(result, rule.path, rule.neutral)
    if (was && !now) result = setConfigValue(result, rule.path, getConfigValue(BASELINE_CONFIG, rule.path))
  }
  return result
}

function resetStage(config: StrategyConfig, stage: WorkspaceStage): StrategyConfig {
  if (stage === 'template') {
    return {
      ...config,
      presentation: {
        ...BASELINE_CONFIG.presentation,
        groupByPersonaAppliesTo: [...BASELINE_CONFIG.presentation.groupByPersonaAppliesTo],
        componentOrder: [...BASELINE_CONFIG.presentation.componentOrder],
      },
    }
  }
  return { ...config, evidence: { ...BASELINE_CONFIG.evidence, allowedKinds: [...BASELINE_CONFIG.evidence.allowedKinds] } }
}

function PolicyItem({ path, config, children, stack = false, inactiveHint }: {
  path: ConfigPath
  config: StrategyConfig
  children: ReactNode
  stack?: boolean
  /** When set, the item depends on a switch above that is off: it is greyed out and the hint explains why. */
  inactiveHint?: string
}) {
  const item = STRATEGY_ITEMS_BY_PATH[path]
  const focus = useSlotFocus(slotForPath(path))
  return (
    <section className={`s2-policy-item ${stack ? 'is-stack' : ''} ${inactiveHint ? 'is-inactive' : ''}`} {...focus}>
      <div className="s2-policy-main">
        <div className="s2-policy-title-row">
          <h3>{item.label}</h3>
          {isModified(config, path) && <span className="s2-draft-mark">已改动</span>}
          {inactiveHint && <span className="s2-inactive-mark">未生效</span>}
        </div>
        <p className="s2-policy-description">{inactiveHint ?? item.explanation}</p>
      </div>
      <fieldset className="s2-policy-control" disabled={Boolean(inactiveHint)}>{children}</fieldset>
    </section>
  )
}

/** Hovering or focusing a strategy item lights up the card slot it controls in the preview. */
function useSlotFocus(slot: SlotId | null) {
  const setFocusedSlot = useDemoStore((state) => state.setFocusedSlot)
  if (!slot) return {}
  const on = () => setFocusedSlot(slot)
  const off = () => setFocusedSlot(null)
  return { onMouseEnter: on, onMouseLeave: off, onFocus: on, onBlur: off }
}

/** A rule that exists in the product design but is not interactive in this demo. */
function StaticItem({ title, description, badge, icon = <LockKeyhole size={14} />, slot = null }: { title: string; description: string; badge: string; icon?: ReactNode; slot?: SlotId | null }) {
  const focus = useSlotFocus(slot)
  return (
    <section className="s2-policy-item is-static" {...focus}>
      <div className="s2-policy-main">
        <div className="s2-policy-title-row"><h3>{title}</h3></div>
        <p className="s2-policy-description">{description}</p>
      </div>
      <div className="s2-policy-control"><span className="s2-static-badge">{icon}{badge}</span></div>
    </section>
  )
}

function SwitchControl({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <span className="s2-switch-field">
      <button type="button" className={`s2-switch ${checked ? 'is-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={onChange}>
        <span className="s2-switch-thumb" />
      </button>
      <span className="s2-switch-value">{checked ? '开启' : '关闭'}</span>
    </span>
  )
}

function CategoryChoices({ value, onChange }: { value: QueryCategory[]; onChange: (next: QueryCategory[]) => void }) {
  return (
    <div className="s2-choice-row">
      {CATEGORY_OPTIONS.map((category) => {
        const checked = value.includes(category)
        return (
          <label className={`s2-choice ${checked ? 'is-checked' : ''}`} key={category}>
            <input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((entry) => entry !== category) : [...value, category])} />
            <span className="s2-checkmark"><Check size={12} /></span>
            {category}
          </label>
        )
      })}
    </div>
  )
}

/* ───────────── Step 01 · 卡片模板 ───────────── */

function TemplateHeader({ config }: { config: StrategyConfig }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const role = useDemoStore((state) => state.role)
  const changed = changedLabels(config, 'template')
  return (
    <div className="s2-template-header">
      <div className="s2-template-library" role="list" aria-label="卡片模板库">
        {TEMPLATE_LIBRARY.map((template) => (
          <span key={template.id} role="listitem" className={`s2-template-chip ${template.interactive ? 'is-active' : ''}`} title={template.interactive ? '当前场景使用的模板' : '示例模板，仅展示'}>
            <LayoutTemplate size={13} />{template.name}<small>{template.sceneCount} 个场景</small>
          </span>
        ))}
      </div>
      <div className="s2-version-bar">
        <span>场景锁定 <strong>{TEMPLATE_PINNED_VERSION}</strong></span>
        {changed.length > 0 && <span className="s2-version-draft">草稿 <strong>{TEMPLATE_DRAFT_VERSION}</strong> · {ROLE_TAB_LABELS[role]}改动 {changed.length} 项</span>}
        <button type="button" className="s2-text-button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}><History size={13} />版本历史</button>
      </div>
      {historyOpen && (
        <ol className="s2-version-history">
          {changed.length > 0 && <li className="is-draft"><span>{TEMPLATE_DRAFT_VERSION} 草稿</span><span>{ROLE_TAB_LABELS[role]}</span><span>{changed.join('、')}</span><span>未提交</span></li>}
          {TEMPLATE_VERSION_HISTORY.map((entry) => (
            <li key={`${entry.version}-${entry.role}`}><span>{entry.version}</span><span>{ROLE_TAB_LABELS[entry.role]}</span><span>{entry.note}</span><span>{entry.date}</span></li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TemplateOpsSlots({ config, onChange }: { config: StrategyConfig; onChange: (next: StrategyConfig) => void }) {
  const setFocusedSlot = useDemoStore((state) => state.setFocusedSlot)
  const patch = <K extends keyof StrategyConfig['presentation']>(key: K, value: StrategyConfig['presentation'][K]) => {
    onChange({ ...config, presentation: { ...config.presentation, [key]: value } })
  }
  const editableOrder = config.presentation.componentOrder.filter((id) => COMPONENT_ORDER_IDS.includes(id))
  const move = (componentId: string, offset: -1 | 1) => {
    const order = [...editableOrder]
    const current = order.indexOf(componentId)
    const target = current + offset
    if (current < 0 || target < 0 || target >= order.length) return
    ;[order[current], order[target]] = [order[target], order[current]]
    const fixed = config.presentation.componentOrder.filter((id) => !COMPONENT_ORDER_IDS.includes(id))
    patch('componentOrder', [...order, ...fixed])
  }
  return (
    <>
      <PolicyItem path="presentation.showConclusion" config={config}>
        <SwitchControl checked={config.presentation.showConclusion} label="一句话结论" onChange={() => patch('showConclusion', !config.presentation.showConclusion)} />
      </PolicyItem>
      <PolicyItem path="presentation.groupByPersona" config={config}>
        <SwitchControl checked={config.presentation.groupByPersona} label="按肤质分组" onChange={() => patch('groupByPersona', !config.presentation.groupByPersona)} />
      </PolicyItem>
      <PolicyItem path="presentation.groupByPersonaAppliesTo" config={config} stack inactiveHint={config.presentation.groupByPersona ? undefined : '开启「按肤质分组」后，才需要设置它对哪类问题生效。'}>
        <CategoryChoices value={config.presentation.groupByPersonaAppliesTo} onChange={(next) => patch('groupByPersonaAppliesTo', next)} />
      </PolicyItem>
      <PolicyItem path="presentation.showPitfall" config={config}>
        <SwitchControl checked={config.presentation.showPitfall} label="踩坑提醒" onChange={() => patch('showPitfall', !config.presentation.showPitfall)} />
      </PolicyItem>
      <PolicyItem path="presentation.componentOrder" config={config} stack>
        <ol className="s2-order-list" aria-label="组件顺序">
          <li className="is-locked" onMouseEnter={() => setFocusedSlot('source-footer')} onMouseLeave={() => setFocusedSlot(null)}>
            <span className="s2-order-number"><LockKeyhole size={11} /></span>
            <span>来源底栏</span>
            <span className="s2-order-off">固定在卡片顶部 · 社区治理锁定</span>
          </li>
          {editableOrder.map((id, position) => {
            const toggle = COMPONENT_TOGGLES[id]
            const off = toggle !== undefined && !config.presentation[toggle]
            const shownIndex = off ? -1 : editableOrder.filter((entry) => {
              const entryToggle = COMPONENT_TOGGLES[entry]
              return entryToggle === undefined || Boolean(config.presentation[entryToggle])
            }).indexOf(id)
            return (
              <li key={id} className={off ? 'is-off' : ''} onMouseEnter={() => setFocusedSlot(id as SlotId)} onMouseLeave={() => setFocusedSlot(null)}>
                <span className="s2-order-number">{off ? '—' : String(shownIndex + 1).padStart(2, '0')}</span>
                <span>{COMPONENT_LABELS[id]}</span>
                {off && <span className="s2-order-off">已关闭，不在卡片中显示</span>}
                {!toggle && <span className="s2-order-fixed">常驻</span>}
                <span className="s2-order-actions">
                  <button type="button" aria-label={`上移${COMPONENT_LABELS[id]}`} disabled={off || position <= 0} onClick={() => move(id, -1)}><ArrowUp size={13} /></button>
                  <button type="button" aria-label={`下移${COMPONENT_LABELS[id]}`} disabled={off || position === editableOrder.length - 1} onClick={() => move(id, 1)}><ArrowDown size={13} /></button>
                </span>
              </li>
            )
          })}
        </ol>
      </PolicyItem>
    </>
  )
}

/** Commercial slot: the brand block's position. Proposals are checked against the community rule and never applied. */
function TemplateAdsSlot({ config, canEdit }: { config: StrategyConfig; canEdit: boolean }) {
  const proposal = useDemoStore((state) => state.sponsoredProposal)
  const notified = useDemoStore((state) => state.conflictNotified)
  const propose = useDemoStore((state) => state.proposeSponsoredBeforeConclusion)
  const withdraw = useDemoStore((state) => state.withdrawSponsoredProposal)
  const notify = useDemoStore((state) => state.notifyConflictOwner)
  const conflicts = useMemo(
    () => proposal ? detectConflicts({ ...config, guardrails: { ...config.guardrails, sponsoredPosition: proposal } }) : [],
    [config, proposal],
  )
  return (
    <>
      <section className="s2-policy-item">
        <div className="s2-policy-main">
          <div className="s2-policy-title-row"><h3>品牌说 · 呈现位置</h3></div>
          <p className="s2-policy-description">合作内容在答案卡中的展示位置，需要在社区治理的底线规则之内调整。</p>
        </div>
        <div className="s2-policy-control"><span className="s2-readonly-value">{config.guardrails.sponsoredPosition === 'afterConclusion' ? '结论之后' : '结论之前'}</span></div>
      </section>
      <StaticItem title="品牌说 · 挂载商品卡" description="合作品牌在品牌说下方挂一张商品卡，用户可直接进店。组件库里还没有这个模块，可通过「编辑模版」提交需求。" badge="待研发" icon={<LayoutTemplate size={14} />} />

      {canEdit && !proposal && (
        <div className="s2-proposal-card">
          <div><strong>提出位置调整</strong><p>把品牌说放到结论之前。平台会先做规则检查，不会直接改动模板。</p></div>
          <button type="button" className="s2-proposal-button" onClick={propose}>提议：品牌说放在结论之前</button>
        </div>
      )}

      {conflicts.map((conflict) => (
        <section className="s2-conflict-card" key={conflict.id} aria-labelledby={`${conflict.id}-title`}>
          <header><CircleAlert size={16} /><h3 id={`${conflict.id}-title`}>与社区治理规则冲突 · 待讨论</h3></header>
          <p>{conflict.message}</p>
          <dl className="s2-conflict-source">
            <div><dt>规则</dt><dd>{conflict.guardrail.label}</dd></div>
            <div><dt>负责团队</dt><dd>{conflict.guardrail.ownerTeam}</dd></div>
            <div><dt>负责人</dt><dd>{conflict.guardrail.ownerName}</dd></div>
          </dl>
          <div className="s2-conflict-options">
            <span className="s2-conflict-options-label">可讨论的选项（由规则负责人决定，此处不采纳）</span>
            {conflict.options.map((option, index) => (
              <div className="s2-conflict-option" key={option.id}><span>{String.fromCharCode(65 + index)}</span><div><strong>{option.label}</strong><small>{option.note}</small></div></div>
            ))}
          </div>
          {notified ? (
            <div className="s2-conflict-notified"><BellRing size={14} /><span>已生成讨论事项，等待{conflict.guardrail.ownerTeam}回应。演示环境不会发送消息。</span></div>
          ) : (
            <div className="s2-conflict-actions">
              <button type="button" className="s2-proposal-button" onClick={notify}><BellRing size={14} />通知规则负责人并发起讨论</button>
              <button type="button" className="s2-text-button" onClick={withdraw}>撤回提议</button>
            </div>
          )}
        </section>
      ))}
    </>
  )
}

function TemplateCommunitySlots() {
  const rule = STRATEGY_ITEMS_BY_PATH['guardrails.sponsoredPosition']
  const label = STRATEGY_ITEMS_BY_PATH['evidence.labelSponsored']
  return (
    <>
      <StaticItem title="来源底栏与溯源" description="每张答案卡都要显示引用来源，在点点卡片顶部显示为「参考 N 篇笔记」，点开可以看原帖。用户靠它判断答案可不可信，其他角色不能移除。" badge="锁定模块" slot="source-footer" />
      <StaticItem title={label.label} description={label.explanation} badge="法规要求 · 锁定" icon={<BadgeCheck size={14} />} slot="source-footer" />
      <StaticItem title={rule.label} description={rule.explanation} badge="底线规则" icon={<ShieldCheck size={14} />} />
      <p className="s2-tab-footnote">底线规则的修改需要走社区治理评审，演示中未开放。</p>
    </>
  )
}

/* ───────────── Step 02 · 筛选策略 ───────────── */

const FRESHNESS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '90', label: '近 90 天' },
  { value: '180', label: '近 180 天' },
  { value: '365', label: '近 365 天' },
  { value: '不限', label: '不限' },
]
const MIN_LIKES_OPTIONS: Array<{ value: MinNoteLikes; label: string }> = [
  { value: 0, label: '不设门槛' },
  { value: 20, label: '≥ 20 赞' },
  { value: 40, label: '≥ 40 赞' },
]
const SPONSORED_CAP_OPTIONS: Array<{ value: SponsoredCap; label: string }> = [
  { value: 1, label: '最多 1 条' },
  { value: 2, label: '最多 2 条' },
  { value: '不限', label: '不限' },
]

/** Step 02 rules owned by one role, minus the ones deleted through “编辑策略”. */
function FilterRules({ role, config, removed, onChange }: { role: DemoRole; config: StrategyConfig; removed: string[]; onChange: (next: StrategyConfig) => void }) {
  const evidence = config.evidence
  const patch = <K extends keyof StrategyConfig['evidence']>(key: K, value: StrategyConfig['evidence'][K]) => {
    onChange({ ...config, evidence: { ...evidence, [key]: value } })
  }
  const rules = FILTER_RULES.filter((rule) => rule.role === role && !removed.includes(rule.id))
  const sponsoredOff = !evidence.allowSponsored && !removed.includes('allow-sponsored')

  const control = (id: string): ReactNode => {
    switch (id) {
      case 'allowed-kinds':
        return (
          <PolicyItem path="evidence.allowedKinds" config={config} key={id}>
            <div className="s2-choice-row">
              {(['note', 'comment'] as ContentKind[]).map((kind) => {
                const checked = evidence.allowedKinds.includes(kind)
                return (
                  <label className={`s2-choice ${checked ? 'is-checked' : ''}`} key={kind}>
                    <input type="checkbox" checked={checked} onChange={() => patch('allowedKinds', checked ? evidence.allowedKinds.filter((value) => value !== kind) : [...evidence.allowedKinds, kind])} />
                    <span className="s2-checkmark"><Check size={12} /></span>
                    {CONTENT_KIND_LABELS[kind]}
                  </label>
                )
              })}
            </div>
          </PolicyItem>
        )
      case 'freshness-window':
        return (
          <PolicyItem path="evidence.freshnessDays" config={config} key={id}>
            <select className="s2-select" aria-label="时效窗口" value={evidence.freshnessDays} onChange={(event) => {
              const raw = event.target.value
              patch('freshnessDays', raw === '不限' ? '不限' : Number(raw) as 90 | 180 | 365)
            }}>
              {FRESHNESS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </PolicyItem>
        )
      case 'min-note-likes':
        return (
          <PolicyItem path="evidence.minNoteLikes" config={config} key={id}>
            <select className="s2-select" aria-label="笔记互动门槛" value={evidence.minNoteLikes} onChange={(event) => patch('minNoteLikes', Number(event.target.value) as MinNoteLikes)}>
              {MIN_LIKES_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </PolicyItem>
        )
      case 'prefer-first-hand':
        return (
          <PolicyItem path="evidence.preferFirstHand" config={config} key={id}>
            <SwitchControl checked={evidence.preferFirstHand} label="优先展示亲身经验" onChange={() => patch('preferFirstHand', !evidence.preferFirstHand)} />
          </PolicyItem>
        )
      case 'prefer-matching-persona':
        return (
          <PolicyItem path="evidence.preferMatchingPersona" config={config} key={id}>
            <SwitchControl checked={evidence.preferMatchingPersona} label="同肤质经验优先" onChange={() => patch('preferMatchingPersona', !evidence.preferMatchingPersona)} />
          </PolicyItem>
        )
      case 'allow-sponsored':
        return (
          <PolicyItem path="evidence.allowSponsored" config={config} key={id}>
            <SwitchControl checked={evidence.allowSponsored} label="允许合作内容进入候选" onChange={() => patch('allowSponsored', !evidence.allowSponsored)} />
          </PolicyItem>
        )
      case 'sponsored-persona-match':
        return (
          <PolicyItem path="evidence.sponsoredPersonaMatch" config={config} key={id} inactiveHint={sponsoredOff ? '合作内容已不进入候选，人群匹配暂不生效。' : undefined}>
            <SwitchControl checked={evidence.sponsoredPersonaMatch} label="合作内容须匹配提问人群" onChange={() => patch('sponsoredPersonaMatch', !evidence.sponsoredPersonaMatch)} />
          </PolicyItem>
        )
      case 'counter-evidence':
        return (
          <PolicyItem path="evidence.includeCounterEvidence" config={config} key={id}>
            <SwitchControl checked={evidence.includeCounterEvidence} label="保留正反面经验" onChange={() => patch('includeCounterEvidence', !evidence.includeCounterEvidence)} />
          </PolicyItem>
        )
      case 'sponsored-cap':
        return (
          <PolicyItem path="evidence.sponsoredCap" config={config} key={id}>
            <select className="s2-select" aria-label="合作内容入卡上限" value={String(evidence.sponsoredCap)} onChange={(event) => {
              const raw = event.target.value
              patch('sponsoredCap', raw === '不限' ? '不限' : Number(raw) as 1 | 2)
            }}>
              {SPONSORED_CAP_OPTIONS.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
            </select>
          </PolicyItem>
        )
      default:
        return null
    }
  }

  return (
    <>
      {rules.map((rule) => rule.path
        ? control(rule.id)
        : <StaticItem key={rule.id} title={rule.label ?? rule.id} description={rule.description ?? ''} badge={rule.badge ?? ''} icon={rule.badge === '开发中' ? <History size={14} /> : <ShieldCheck size={14} />} />)}
      {rules.length === 0 && <p className="s2-tab-footnote">这个角色的策略已全部删除。可通过「编辑策略」恢复，或点「恢复本页默认」。</p>}
    </>
  )
}

/** Posts cited by the card before vs after the draft, with the engine's exclusion reason for removed posts. */
function PostChanges({ before, after, posts }: { before: RenderedAnswer; after: RenderedAnswer; posts: Post[] }) {
  const cited = (answer: RenderedAnswer) => new Set(answer.sections.flatMap((section) => section.points.flatMap((point) => point.evidenceIds)))
  const beforeIds = cited(before)
  const afterIds = cited(after)
  const byId = new Map(posts.map((post) => [post.id, post]))
  const added = [...afterIds].filter((id) => !beforeIds.has(id))
  const removed = [...beforeIds].filter((id) => !afterIds.has(id))
  const reasonFor = (id: string) => after.filteredEvidence.find((entry) => entry.evidenceId === id)?.reason ?? '通过筛选，但当前答案结构没有引用它。'
  return (
    <section className="s2-post-changes" aria-label="入卡帖子变化">
      <header><strong>入卡帖子</strong><span>{afterIds.size} 条 · 筛选规则改动前 {beforeIds.size} 条</span></header>
      {added.length === 0 && removed.length === 0 ? (
        <p className="s2-post-changes-empty">这道题的入卡帖子没有变化。</p>
      ) : (
        <ul>
          {added.map((id) => <li key={id} className="is-added"><Plus size={12} /><span><strong>{byId.get(id)?.author}</strong>{byId.get(id)?.text}</span></li>)}
          {removed.map((id) => <li key={id} className="is-removed"><Minus size={12} /><span><strong>{byId.get(id)?.author}</strong>{reasonFor(id)}</span></li>)}
        </ul>
      )}
    </section>
  )
}

/* ───────────── Page ───────────── */

const SCENE_LABEL = '护肤 · 选购怎么选'

const STAGE_COPY: Record<WorkspaceStage, { title: string; description: string }> = {
  template: { title: '卡片模板', description: '定义 AI 搜答案卡的呈现结构，各角色负责卡片里不同的模块。' },
  filter: { title: '筛选策略', description: '决定哪些帖子进入答案卡。生效顺序：社区治理底线 → 商业化 → 行业运营。' },
}

export function StrategyWorkspace({ stage, onNavigate }: { stage: WorkspaceStage; onNavigate: (page: PageId) => void }) {
  const role = useDemoStore((state) => state.role)
  const viewedRole = useDemoStore((state) => state.viewedRole)
  const setViewedRole = useDemoStore((state) => state.setViewedRole)
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const setDraftConfig = useDemoStore((state) => state.setDraftConfig)
  const removedFilterRules = useDemoStore((state) => state.removedFilterRules)
  const setRemovedFilterRules = useDemoStore((state) => state.setRemovedFilterRules)
  const previewVersion = useDemoStore((state) => state.previewVersion)
  const setPreviewVersion = useDemoStore((state) => state.setPreviewVersion)
  const sourcePoint = useDemoStore((state) => state.sourcePoint)
  const openSource = useDemoStore((state) => state.openSource)
  const closeSource = useDemoStore((state) => state.closeSource)
  const coverageRun = useDemoStore((state) => state.coverageRun)
  const focusedSlot = useDemoStore((state) => state.focusedSlot)
  const setFocusedSlot = useDemoStore((state) => state.setFocusedSlot)
  const draftVersion = useMemo(() => getConfigVersion(draftConfig), [draftConfig])
  const checkStatus: CheckStatus = !coverageRun
    ? { kind: 'not-run' }
    : coverageRun.configVersion === draftVersion
      ? { kind: 'current', summary: coverageRun.summary }
      : { kind: 'stale' }

  const beforeRaw = useMemo(() => renderAnswer(BASELINE_CONFIG, MAIN_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE), [])
  const afterRaw = useMemo(() => renderAnswer(draftConfig, MAIN_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE), [draftConfig])
  const { before, after } = useMemo(() => markAnswerDiff(beforeRaw, afterRaw), [beforeRaw, afterRaw])
  // Post changes on the filter page isolate the filter's effect: same template draft, filter rules at baseline.
  const filterBaseRaw = useMemo(
    () => renderAnswer(resetStage(draftConfig, 'filter'), MAIN_QUERY, SKINCARE_POSTS, COMPONENTS, POINT_CATALOG, DEMO_AS_OF_DATE),
    [draftConfig],
  )
  const stageChanges = changedLabels(draftConfig, stage, removedFilterRules)
  const otherChanges = changedLabels(draftConfig, stage === 'template' ? 'filter' : 'template', removedFilterRules)
  const modified = JSON.stringify(draftConfig) !== JSON.stringify(BASELINE_CONFIG) || removedFilterRules.length > 0
  const diffSummary = !modified
    ? '与基线一致，答案未发生变化。'
    : `已改动：${[...stageChanges, ...otherChanges].join('、')}。`
  const selectedAnswer = previewVersion === 'before' ? before : after
  const canEdit = viewedRole === role
  const copy = STAGE_COPY[stage]

  const tabContent = stage === 'template'
    ? viewedRole === 'industry_ops' ? <TemplateOpsSlots config={draftConfig} onChange={setDraftConfig} />
      : viewedRole === 'ads' ? <TemplateAdsSlot config={draftConfig} canEdit={canEdit} />
        : <TemplateCommunitySlots />
    : <FilterRules role={viewedRole} config={draftConfig} removed={removedFilterRules} onChange={setDraftConfig} />
  const applyRemoved = (next: string[]) => {
    setDraftConfig(applyRemovedRules(draftConfig, removedFilterRules, next))
    setRemovedFilterRules(next)
  }
  const resetPage = () => {
    setDraftConfig(resetStage(draftConfig, stage))
    if (stage === 'filter') setRemovedFilterRules([])
  }
  const activeTemplate = TEMPLATE_LIBRARY.find((template) => template.interactive)
  const templateChanged = changedLabels(draftConfig, 'template').length > 0
  const templateLabel = previewVersion === 'after' && templateChanged
    ? `${activeTemplate?.name ?? '护肤测评 · 选购'} · 草稿 ${TEMPLATE_DRAFT_VERSION}`
    : `${activeTemplate?.name ?? '护肤测评 · 选购'} · ${TEMPLATE_PINNED_VERSION}`
  /** Slot tag → the role tab (and step) that owns it; the reference row also answers to the step-02 filters. */
  const openSlot = (slot: CardSlot) => {
    setViewedRole(slot.owner)
    setFocusedSlot(slot.id)
    if (slot.id !== 'source-footer' && stage !== 'template') onNavigate('template')
  }

  return (
    <>
      <div className="s2-workspace-grid">
        <section className="panel s2-editor-panel" aria-labelledby="stage-editor-title">
          <div className="s2-panel-heading">
            <div><h2 id="stage-editor-title">{copy.title}</h2><p>{copy.description}</p></div>
            {stage === 'filter'
              ? <EditStrategyDialog role={role} scene={SCENE_LABEL} removed={removedFilterRules} onApply={applyRemoved} />
              : <EditTemplateDialog role={role} scene={SCENE_LABEL} templateName={`${activeTemplate?.name ?? '护肤测评 · 选购'} · 草稿 ${TEMPLATE_DRAFT_VERSION}`} />}
          </div>

          {stage === 'template' && <TemplateHeader config={draftConfig} />}

          <div className="s2-tab-row" role="tablist" aria-label="按角色查看">
            {DEMO_ROLES.map((id) => (
              <button key={id} type="button" role="tab" aria-selected={viewedRole === id} className={`s2-tab ${viewedRole === id ? 'is-active' : ''}`} onClick={() => setViewedRole(id)}>
                {ROLE_TAB_LABELS[id]}{id === role && <span className="s2-tab-you">我的</span>}
              </button>
            ))}
          </div>

          <p className="s2-role-duty"><strong>{ROLE_TAB_LABELS[viewedRole]}</strong>{ROLE_DUTIES[stage][viewedRole]}</p>
          {!canEdit && <div className="s2-role-readonly"><LockKeyhole size={14} /><span>由「{ROLE_TAB_LABELS[viewedRole]}」负责。当前账号「{ROLE_LABELS[role]}」只能查看。</span></div>}
          <fieldset className="s2-fieldset" disabled={!canEdit} role="tabpanel" aria-label={`${ROLE_TAB_LABELS[viewedRole]}负责的内容`}>
            <div className="s2-control-list">{tabContent}</div>
          </fieldset>

          <div className="s2-editor-footer">
            <div><span className="s2-unsaved-dot" /><span>{stageChanges.length > 0 ? `本页已改动 ${stageChanges.length} 项，预览已实时更新。` : '本页与基线一致。'}</span></div>
            <button type="button" className="s2-reset-button" onClick={resetPage} disabled={stageChanges.length === 0}><RotateCcw size={14} />恢复本页默认</button>
          </div>
        </section>

        <aside className="s2-preview-column" aria-label="答案卡预览">
          <div className="s2-preview-heading"><h2>答案卡预览</h2></div>
          <AnswerPreview
            before={before}
            after={after}
            beforeConfig={BASELINE_CONFIG}
            afterConfig={draftConfig}
            query={MAIN_QUERY}
            mode={previewVersion}
            onModeChange={(mode: PreviewVersion) => setPreviewVersion(mode)}
            onOpenSource={openSource}
            onNavigateCoverage={() => onNavigate('coverage')}
            diffSummary={diffSummary}
            isDraftModified={modified}
            checkStatus={checkStatus}
            labelSponsored={previewVersion === 'before' ? BASELINE_CONFIG.evidence.labelSponsored : draftConfig.evidence.labelSponsored}
            posts={SKINCARE_POSTS}
            templateLabel={templateLabel}
            focusedSlot={focusedSlot}
            onSlotClick={openSlot}
            defaultShowSlots={stage === 'template'}
          />
          {stage === 'filter' && <PostChanges before={filterBaseRaw} after={afterRaw} posts={SKINCARE_POSTS} />}
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
