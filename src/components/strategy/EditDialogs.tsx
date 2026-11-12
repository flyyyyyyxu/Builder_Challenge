import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, FileUp, LayoutTemplate, PencilLine, RotateCcw, Trash2, UserRound, X } from 'lucide-react'
import { FILTER_RULES, STRATEGY_ITEMS_BY_PATH, type FilterRuleDef } from '../../data'
import { ROLE_LABELS, ROLE_TAB_LABELS, type DemoRole } from '../../store'

/* ───────────── Shared shell ───────────── */

function useDialog() {
  const [open, setOpen] = useState(false)
  return { open, show: () => setOpen(true), hide: () => setOpen(false) }
}

function DialogShell({ titleId, onClose, children, wide = false }: { titleId: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  // Portal to <body> so styles of the panel heading the trigger sits in don't leak into the dialog.
  return createPortal(
    <div className="s2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className={`s2-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="s2-modal-close" onClick={onClose} aria-label="关闭"><X size={16} /></button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function RoleAndScene({ role, scene }: { role: DemoRole; scene: string }) {
  return (
    <div className="s2-modal-meta">
      <div className="s2-modal-field">
        <span className="s2-modal-label">提出角色</span>
        <span className="s2-modal-role"><UserRound size={13} />{ROLE_LABELS[role]}<small>根据当前账号自动填入</small></span>
      </div>
      <div className="s2-modal-field">
        <span className="s2-modal-label">适用场景</span>
        <span className="s2-modal-scene">{scene}</span>
      </div>
    </div>
  )
}

function newTicketId(): string {
  // Mock ticket number; nothing is sent anywhere in the demo.
  return `REQ-${String(Math.floor(1000 + Math.random() * 9000))}`
}

/** The confirmation every natural-language request ends on, shared by strategy and template edits. */
function TicketSuccess({ titleId, ticketId, steps, extra, onClose }: { titleId: string; ticketId: string; steps: string[]; extra?: ReactNode; onClose: () => void }) {
  return (
    <div className="s2-modal-success">
      <CircleCheck size={34} />
      <h3 id={titleId}>已提交工单</h3>
      <p>工单号 <code>{ticketId}</code>，稍后会有专职人员与您联系。</p>
      {extra}
      <ol className="s2-modal-next">{steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <button type="button" className="s2-modal-primary" onClick={onClose}>知道了</button>
    </div>
  )
}

/* ───────────── 02 · 编辑策略 ───────────── */

export function ruleLabel(rule: FilterRuleDef): string {
  return rule.path ? STRATEGY_ITEMS_BY_PATH[rule.path].label : rule.label ?? rule.id
}

export function ruleDescription(rule: FilterRuleDef): string {
  return rule.path ? STRATEGY_ITEMS_BY_PATH[rule.path].explanation : rule.description ?? ''
}

const STRATEGY_PLACEHOLDER: Record<DemoRole, string> = {
  industry_ops: '例如：油皮相关的问题，优先展示近 30 天内带前后对比图的测评帖子。',
  ads: '例如：新品首发期内，允许该品牌的合作笔记在相关问题下优先进入候选。',
  community: '例如：同一作者的帖子在一张卡里最多出现 2 次，避免单个账号主导答案。',
}

/**
 * “编辑策略”: the account's own rules can be deleted (or restored) directly; new rules are described in plain
 * language and become a mock ticket, because a new rule needs a new field defined with the platform first.
 */
export function EditStrategyDialog({ role, scene, removed, onApply }: {
  role: DemoRole
  scene: string
  removed: string[]
  /** Called with the full next list of removed rule ids. */
  onApply: (nextRemoved: string[]) => void
}) {
  const dialog = useDialog()
  const titleId = useId()
  const ownRules = FILTER_RULES.filter((rule) => rule.role === role)
  const [pendingRemoved, setPendingRemoved] = useState<string[]>([])
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ ticketId: string | null; deleted: string[]; restored: string[] } | null>(null)

  const openDialog = () => {
    setPendingRemoved(removed.filter((id) => ownRules.some((rule) => rule.id === id)))
    setText('')
    setResult(null)
    dialog.show()
  }
  const close = () => dialog.hide()

  const wasRemoved = (id: string) => removed.includes(id)
  const isRemoved = (id: string) => pendingRemoved.includes(id)
  const toggle = (id: string) => setPendingRemoved((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])
  const deleted = ownRules.filter((rule) => isRemoved(rule.id) && !wasRemoved(rule.id)).map(ruleLabel)
  const restored = ownRules.filter((rule) => !isRemoved(rule.id) && wasRemoved(rule.id)).map(ruleLabel)
  const hasChanges = deleted.length > 0 || restored.length > 0 || text.trim().length > 0
  const remaining = ownRules.length - pendingRemoved.length

  const save = () => {
    if (!hasChanges) return
    const others = removed.filter((id) => !ownRules.some((rule) => rule.id === id))
    if (deleted.length > 0 || restored.length > 0) onApply([...others, ...pendingRemoved])
    setResult({ ticketId: text.trim() ? newTicketId() : null, deleted, restored })
  }

  const appliedSummary = result && (result.deleted.length > 0 || result.restored.length > 0) ? (
    <div className="s2-modal-applied">
      {result.deleted.length > 0 && <span>已删除：{result.deleted.join('、')}</span>}
      {result.restored.length > 0 && <span>已恢复：{result.restored.join('、')}</span>}
      <small>答案卡预览和入卡帖子已同步更新。</small>
    </div>
  ) : null

  return (
    <>
      <button type="button" className="s2-new-strategy-button" onClick={openDialog}>
        <PencilLine size={15} />编辑策略
      </button>

      {dialog.open && (
        <DialogShell titleId={titleId} onClose={close} wide>
          {result?.ticketId ? (
            <TicketSuccess
              titleId={titleId}
              ticketId={result.ticketId}
              extra={appliedSummary}
              onClose={close}
              steps={[
                '平台与点点产品和你一起确认需求，定义新的策略字段',
                `字段上线后出现在「${ROLE_TAB_LABELS[role]}」页签`,
                '之后由你自行调整这条策略的生效范围',
              ]}
            />
          ) : result ? (
            <div className="s2-modal-success">
              <CircleCheck size={34} />
              <h3 id={titleId}>策略已更新</h3>
              {appliedSummary}
              <p className="s2-modal-hint">改动只在当前草稿里生效。想撤回，可以再次打开「编辑策略」恢复，或点「恢复本页默认」。</p>
              <button type="button" className="s2-modal-primary" onClick={close}>知道了</button>
            </div>
          ) : (
            <>
              <h3 id={titleId}>编辑策略</h3>
              <p className="s2-modal-lead">删除你负责的策略会立即作用于草稿；需要新的策略时，用一句话描述给平台。</p>
              <RoleAndScene role={role} scene={scene} />

              <div className="s2-modal-field">
                <span className="s2-modal-label">现有策略<small>{remaining} / {ownRules.length} 条保留</small></span>
                <ul className="s2-edit-rule-list">
                  {ownRules.map((rule) => {
                    const off = isRemoved(rule.id)
                    return (
                      <li key={rule.id} className={off ? 'is-removed' : ''}>
                        <div>
                          <strong>{ruleLabel(rule)}</strong>
                          {rule.badge && <span className="s2-edit-rule-badge">{rule.badge}</span>}
                          <small>{off ? '保存后不再生效' : ruleDescription(rule)}</small>
                        </div>
                        {off ? (
                          <button type="button" className="s2-edit-rule-action" onClick={() => toggle(rule.id)}><RotateCcw size={13} />恢复</button>
                        ) : (
                          <button type="button" className="s2-edit-rule-action is-danger" onClick={() => toggle(rule.id)} aria-label={`删除${ruleLabel(rule)}`}><Trash2 size={13} />删除</button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <label className="s2-modal-field">
                <span className="s2-modal-label">新增策略<small>选填 · 提交后生成工单</small></span>
                <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} placeholder={STRATEGY_PLACEHOLDER[role]} />
              </label>

              <div className="s2-modal-actions">
                <button type="button" className="s2-text-button" onClick={close}>取消</button>
                <button type="button" className="s2-modal-primary" onClick={save} disabled={!hasChanges}>{text.trim() ? '保存并提交' : '保存'}</button>
              </div>
            </>
          )}
        </DialogShell>
      )}
    </>
  )
}

/* ───────────── 01 · 编辑模版 ───────────── */

type TemplateRequestKind = 'module' | 'upload'

const MODULE_PLACEHOLDER: Record<DemoRole, string> = {
  industry_ops: '例如：在肤质分组下面加一块「成分要点」，列出帖子里常提到的关键成分和注意事项。',
  ads: '例如：在品牌说下方挂一张商品卡，用户可以直接跳转到品牌店铺。',
  community: '例如：在来源底栏加一个「反馈」入口，用户可以标记不相关或疑似软广的帖子。',
}

const ACCEPTED_TEMPLATE_FILES = '.json,.fig,.sketch,.pdf,.png,.jpg,.jpeg'

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * “编辑模版”: either describe a new card module in plain language, or upload an existing template file.
 * Both end in the same ticket confirmation as a new strategy; nothing is uploaded or sent in the demo.
 */
export function EditTemplateDialog({ role, scene, templateName }: { role: DemoRole; scene: string; templateName: string }) {
  const dialog = useDialog()
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<TemplateRequestKind>('module')
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  const openDialog = () => {
    setKind('module')
    setText('')
    setNote('')
    setFile(null)
    setTicketId(null)
    dialog.show()
  }
  const close = () => dialog.hide()
  const canSubmit = kind === 'module' ? text.trim().length > 0 : file !== null
  const submit = () => { if (canSubmit) setTicketId(newTicketId()) }

  const steps = kind === 'module'
    ? [
        '平台与点点产品和你一起确认这个模块呈现什么、依据哪些帖子',
        `研发实现后加入组件库，出现在「${ROLE_TAB_LABELS[role]}」页签`,
        '之后由你决定它在卡片中的位置和生效范围',
      ]
    : [
        '平台核对模版里哪些模块已有、哪些需要研发',
        '已有模块直接生成新的模版草稿，缺少的模块进入研发排期',
        '你确认草稿后，再锁定到对应场景',
      ]

  return (
    <>
      <button type="button" className="s2-new-strategy-button" onClick={openDialog}>
        <PencilLine size={15} />编辑模版
      </button>

      {dialog.open && (
        <DialogShell titleId={titleId} onClose={close} wide>
          {ticketId ? (
            <TicketSuccess titleId={titleId} ticketId={ticketId} steps={steps} onClose={close} />
          ) : (
            <>
              <h3 id={titleId}>编辑模版</h3>
              <p className="s2-modal-lead">现有模块不够用时，可以描述想新增的卡片模块，或者直接上传一份做好的模版。</p>
              <RoleAndScene role={role} scene={scene} />
              <div className="s2-modal-field">
                <span className="s2-modal-label">当前模版</span>
                <span className="s2-modal-scene"><LayoutTemplate size={13} />{templateName}</span>
              </div>

              <div className="s2-segment" role="radiogroup" aria-label="编辑方式">
                <button type="button" role="radio" aria-checked={kind === 'module'} className={kind === 'module' ? 'is-active' : ''} onClick={() => setKind('module')}>新增卡片模块</button>
                <button type="button" role="radio" aria-checked={kind === 'upload'} className={kind === 'upload' ? 'is-active' : ''} onClick={() => setKind('upload')}>上传模版</button>
              </div>

              {kind === 'module' ? (
                <label className="s2-modal-field">
                  <span className="s2-modal-label">模块描述</span>
                  <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder={MODULE_PLACEHOLDER[role]} autoFocus />
                </label>
              ) : (
                <>
                  <div className="s2-modal-field">
                    <span className="s2-modal-label">模版文件<small>支持 JSON、Figma、Sketch、PDF 或图片</small></span>
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_TEMPLATE_FILES} hidden onChange={(event) => {
                      const picked = event.target.files?.[0]
                      setFile(picked ? { name: picked.name, size: picked.size } : null)
                    }} />
                    {file ? (
                      <div className="s2-upload-file">
                        <FileUp size={16} />
                        <span><strong>{file.name}</strong><small>{formatSize(file.size)} · 仅在本地演示，不会上传</small></span>
                        <button type="button" className="s2-text-button" onClick={() => fileInputRef.current?.click()}>重新选择</button>
                      </div>
                    ) : (
                      <button type="button" className="s2-upload-drop" onClick={() => fileInputRef.current?.click()}>
                        <FileUp size={20} /><strong>选择模版文件</strong><small>平台会对照已有组件库逐个核对模块</small>
                      </button>
                    )}
                  </div>
                  <label className="s2-modal-field">
                    <span className="s2-modal-label">补充说明<small>选填</small></span>
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="例如：这份模版来自旅行攻略场景，希望复用到护肤用法类问题。" />
                  </label>
                </>
              )}

              <div className="s2-modal-actions">
                <button type="button" className="s2-text-button" onClick={close}>取消</button>
                <button type="button" className="s2-modal-primary" onClick={submit} disabled={!canSubmit}>提交</button>
              </div>
            </>
          )}
        </DialogShell>
      )}
    </>
  )
}
