import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
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
  DEMO_AS_OF_DATE,
  MAIN_QUERY,
  POINT_CATALOG,
  SKINCARE_POSTS,
  STRATEGY_ITEMS_BY_PATH,
  TEMPLATE_DRAFT_VERSION,
  TEMPLATE_LIBRARY,
  TEMPLATE_PINNED_VERSION,
  TEMPLATE_VERSION_HISTORY,
} from '../../data'
import { detectConflicts, getConfigVersion, renderAnswer } from '../../engine'
import { DEMO_ROLES, ROLE_LABELS, ROLE_TAB_LABELS, useDemoStore, type PageId, type PreviewVersion } from '../../store'
import type { ConfigPath, ConfigValue, ContentKind, Post, QueryCategory, RenderedAnswer, StrategyConfig } from '../../types'
import { AnswerPreview, markAnswerDiff, type CheckStatus } from './AnswerPreview'
import { EvidenceDrawer } from './EvidenceDrawer'
import { NewStrategyRequest } from './NewStrategyRequest'
import './strategy.css'

/** Step 01 edits the card template (presentation + guardrails); step 02 edits the post filter (evidence). */
export type WorkspaceStage = 'template' | 'filter'

const COMPONENT_ORDER_IDS = ['conclusion', 'persona-groups', 'step-list', 'pitfall-card']
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
    'evidence.preferFirstHand',
    'evidence.freshnessDays',
    'evidence.includeCounterEvidence',
    'evidence.allowSponsored',
    'evidence.labelSponsored',
  ],
}

function getConfigValue(config: StrategyConfig, path: ConfigPath): ConfigValue {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  return (config[section] as unknown as Record<string, ConfigValue>)[key]
}

function isModified(config: StrategyConfig, path: ConfigPath): boolean {
  return JSON.stringify(getConfigValue(config, path)) !== JSON.stringify(getConfigValue(BASELINE_CONFIG, path))
}

export function changedLabels(config: StrategyConfig, stage: WorkspaceStage): string[] {
  return STAGE_PATHS[stage].filter((path) => isModified(config, path)).map((path) => STRATEGY_ITEMS_BY_PATH[path].label)
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

function PolicyItem({ path, config, children, stack = false }: {
  path: ConfigPath
  config: StrategyConfig
  children: ReactNode
  stack?: boolean
}) {
  const item = STRATEGY_ITEMS_BY_PATH[path]
  return (
    <section className={`s2-policy-item ${stack ? 'is-stack' : ''}`}>
      <div className="s2-policy-main">
        <div className="s2-policy-title-row">
          <h3>{item.label}</h3>
          {isModified(config, path) && <span className="s2-draft-mark">已改动</span>}
        </div>
        <p className="s2-policy-description">{item.explanation}</p>
      </div>
      <div className="s2-policy-control">{children}</div>
    </section>
  )
}

/** A rule that exists in the product design but is not interactive in this demo. */
function StaticItem({ title, description, badge, icon = <LockKeyhole size={14} /> }: { title: string; description: string; badge: string; icon?: ReactNode }) {
  return (
    <section className="s2-policy-item is-static">
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
      <PolicyItem path="presentation.groupByPersonaAppliesTo" config={config} stack>
        <CategoryChoices value={config.presentation.groupByPersonaAppliesTo} onChange={(next) => patch('groupByPersonaAppliesTo', next)} />
      </PolicyItem>
      <PolicyItem path="presentation.showPitfall" config={config}>
        <SwitchControl checked={config.presentation.showPitfall} label="踩坑提醒" onChange={() => patch('showPitfall', !config.presentation.showPitfall)} />
      </PolicyItem>
      <PolicyItem path="presentation.componentOrder" config={config} stack>
        <ol className="s2-order-list" aria-label="组件顺序">
          {COMPONENT_ORDER_IDS.map((id) => {
            const position = editableOrder.indexOf(id)
            return (
              <li key={id}>
                <span className="s2-order-number">{position >= 0 ? String(position + 1).padStart(2, '0') : '—'}</span>
                <span>{COMPONENT_LABELS[id]}</span>
                <span className="s2-order-actions">
                  <button type="button" aria-label={`上移${COMPONENT_LABELS[id]}`} disabled={position <= 0} onClick={() => move(id, -1)}><ArrowUp size={13} /></button>
                  <button type="button" aria-label={`下移${COMPONENT_LABELS[id]}`} disabled={position < 0 || position === editableOrder.length - 1} onClick={() => move(id, 1)}><ArrowDown size={13} /></button>
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
  return (
    <>
      <StaticItem title="来源底栏与溯源" description="必备槽位：每张答案卡都要显示引用来源，可点击查看原帖。其他角色不能移除。" badge="锁定槽位" />
      <StaticItem title={rule.label} description={rule.explanation} badge="底线规则" icon={<ShieldCheck size={14} />} />
      <p className="s2-tab-footnote">底线规则的修改需要走社区治理评审，演示中未开放。</p>
    </>
  )
}

/* ───────────── Step 02 · 筛选策略 ───────────── */

function FilterOpsRules({ config, onChange }: { config: StrategyConfig; onChange: (next: StrategyConfig) => void }) {
  const patch = <K extends keyof StrategyConfig['evidence']>(key: K, value: StrategyConfig['evidence'][K]) => {
    onChange({ ...config, evidence: { ...config.evidence, [key]: value } })
  }
  return (
    <>
      <PolicyItem path="evidence.allowedKinds" config={config}>
        <div className="s2-choice-row">
          {(['note', 'comment'] as ContentKind[]).map((kind) => {
            const checked = config.evidence.allowedKinds.includes(kind)
            return (
              <label className={`s2-choice ${checked ? 'is-checked' : ''}`} key={kind}>
                <input type="checkbox" checked={checked} onChange={() => patch('allowedKinds', checked ? config.evidence.allowedKinds.filter((value) => value !== kind) : [...config.evidence.allowedKinds, kind])} />
                <span className="s2-checkmark"><Check size={12} /></span>
                {CONTENT_KIND_LABELS[kind]}
              </label>
            )
          })}
        </div>
      </PolicyItem>
      <PolicyItem path="evidence.freshnessDays" config={config}>
        <select className="s2-select" aria-label="时效窗口" value={config.evidence.freshnessDays} onChange={(event) => {
          const raw = event.target.value
          patch('freshnessDays', raw === '不限' ? '不限' : Number(raw) as 90 | 180 | 365)
        }}>
          <option value="90">近 90 天</option>
          <option value="180">近 180 天</option>
          <option value="365">近 365 天</option>
          <option value="不限">不限</option>
        </select>
      </PolicyItem>
      <PolicyItem path="evidence.preferFirstHand" config={config}>
        <SwitchControl checked={config.evidence.preferFirstHand} label="优先展示亲身经验" onChange={() => patch('preferFirstHand', !config.evidence.preferFirstHand)} />
      </PolicyItem>
      <PolicyItem path="evidence.includeCounterEvidence" config={config}>
        <SwitchControl checked={config.evidence.includeCounterEvidence} label="保留正反面经验" onChange={() => patch('includeCounterEvidence', !config.evidence.includeCounterEvidence)} />
      </PolicyItem>
    </>
  )
}

function FilterAdsRules({ config, onChange }: { config: StrategyConfig; onChange: (next: StrategyConfig) => void }) {
  return (
    <>
      <PolicyItem path="evidence.allowSponsored" config={config}>
        <SwitchControl checked={config.evidence.allowSponsored} label="允许合作内容进入候选" onChange={() => onChange({ ...config, evidence: { ...config.evidence, allowSponsored: !config.evidence.allowSponsored } })} />
      </PolicyItem>
      <StaticItem title="合作内容入卡上限" description="每张答案卡最多 1 条合作内容。由社区治理设定，商业化在此范围内调整。" badge="社区规则" icon={<ShieldCheck size={14} />} />
    </>
  )
}

function FilterCommunityRules({ config, onChange }: { config: StrategyConfig; onChange: (next: StrategyConfig) => void }) {
  return (
    <>
      <PolicyItem path="evidence.labelSponsored" config={config}>
        <SwitchControl checked={config.evidence.labelSponsored} label="商业内容必须标注" onChange={() => onChange({ ...config, evidence: { ...config.evidence, labelSponsored: !config.evidence.labelSponsored } })} />
      </PolicyItem>
      <StaticItem title="接入反馈评测结果" description="用户反馈过的帖子经评测打分后分级处置：高置信自动移出或降权，中置信进入人工复核。" badge="开发中" icon={<History size={14} />} />
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

const STAGE_COPY: Record<WorkspaceStage, { title: string; description: string }> = {
  template: { title: '卡片模板', description: '定义 AI 搜答案卡的呈现结构，各角色负责各自的槽位。' },
  filter: { title: '筛选策略', description: '决定哪些帖子进入答案卡。生效顺序：社区治理底线 → 商业化 → 行业运营。' },
}

export function StrategyWorkspace({ stage, onNavigate }: { stage: WorkspaceStage; onNavigate: (page: PageId) => void }) {
  const role = useDemoStore((state) => state.role)
  const viewedRole = useDemoStore((state) => state.viewedRole)
  const setViewedRole = useDemoStore((state) => state.setViewedRole)
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const setDraftConfig = useDemoStore((state) => state.setDraftConfig)
  const previewVersion = useDemoStore((state) => state.previewVersion)
  const setPreviewVersion = useDemoStore((state) => state.setPreviewVersion)
  const sourcePoint = useDemoStore((state) => state.sourcePoint)
  const openSource = useDemoStore((state) => state.openSource)
  const closeSource = useDemoStore((state) => state.closeSource)
  const coverageRun = useDemoStore((state) => state.coverageRun)
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
  const modified = JSON.stringify(draftConfig) !== JSON.stringify(BASELINE_CONFIG)
  const stageChanges = changedLabels(draftConfig, stage)
  const otherChanges = changedLabels(draftConfig, stage === 'template' ? 'filter' : 'template')
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
    : viewedRole === 'industry_ops' ? <FilterOpsRules config={draftConfig} onChange={setDraftConfig} />
      : viewedRole === 'ads' ? <FilterAdsRules config={draftConfig} onChange={setDraftConfig} />
        : <FilterCommunityRules config={draftConfig} onChange={setDraftConfig} />

  return (
    <>
      <div className="s2-workspace-grid">
        <section className="panel s2-editor-panel" aria-labelledby="stage-editor-title">
          <div className="s2-panel-heading">
            <div><h2 id="stage-editor-title">{copy.title}</h2><p>{copy.description}</p></div>
            {stage === 'filter' && <NewStrategyRequest role={role} scene={`护肤 · 选购怎么选`} />}
          </div>

          {stage === 'template' && <TemplateHeader config={draftConfig} />}

          <div className="s2-tab-row" role="tablist" aria-label="按角色查看">
            {DEMO_ROLES.map((id) => (
              <button key={id} type="button" role="tab" aria-selected={viewedRole === id} className={`s2-tab ${viewedRole === id ? 'is-active' : ''}`} onClick={() => setViewedRole(id)}>
                {ROLE_TAB_LABELS[id]}{id === role && <span className="s2-tab-you">我的</span>}
              </button>
            ))}
          </div>

          {!canEdit && <div className="s2-role-readonly"><LockKeyhole size={14} /><span>由「{ROLE_TAB_LABELS[viewedRole]}」负责。当前账号「{ROLE_LABELS[role]}」只能查看。</span></div>}
          <fieldset className="s2-fieldset" disabled={!canEdit} role="tabpanel" aria-label={`${ROLE_TAB_LABELS[viewedRole]}负责的内容`}>
            <div className="s2-control-list">{tabContent}</div>
          </fieldset>

          <div className="s2-editor-footer">
            <div><span className="s2-unsaved-dot" /><span>{stageChanges.length > 0 ? `本页已改动 ${stageChanges.length} 项，预览已实时更新。` : '本页与基线一致。'}</span></div>
            <button type="button" className="s2-reset-button" onClick={() => setDraftConfig(resetStage(draftConfig, stage))} disabled={stageChanges.length === 0}><RotateCcw size={14} />恢复本页默认</button>
          </div>
        </section>

        <aside className="s2-preview-column" aria-label="答案卡预览">
          <div className="s2-preview-heading"><h2>答案卡预览</h2></div>
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
            checkStatus={checkStatus}
            labelSponsored={previewVersion === 'before' ? BASELINE_CONFIG.evidence.labelSponsored : draftConfig.evidence.labelSponsored}
            posts={SKINCARE_POSTS}
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
