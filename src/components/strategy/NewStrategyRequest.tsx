import { useEffect, useId, useRef, useState } from 'react'
import { CircleCheck, Plus, UserRound, X } from 'lucide-react'
import { ROLE_LABELS, ROLE_TAB_LABELS, type DemoRole } from '../../store'

/**
 * “新增策略” request: the account's role is filled in automatically and the need is described in plain language.
 * Submitting only creates a mock ticket; the platform and 点点 product then define the new field together,
 * after which the requesting role can adjust its scope on its own tab.
 */
export function NewStrategyRequest({ role, scene }: { role: DemoRole; scene: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const titleId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const close = () => {
    setOpen(false)
    setText('')
    setTicketId(null)
  }

  useEffect(() => {
    if (!open) return
    textareaRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const submit = () => {
    if (!text.trim()) return
    // Mock ticket number; nothing is sent anywhere in the demo.
    setTicketId(`REQ-${String(Math.floor(1000 + Math.random() * 9000))}`)
  }

  return (
    <>
      <button type="button" className="s2-new-strategy-button" onClick={() => setOpen(true)}>
        <Plus size={15} />新增策略
      </button>

      {open && (
        <div className="s2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
          <div className="s2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="s2-modal-close" onClick={close} aria-label="关闭"><X size={16} /></button>

            {ticketId ? (
              <div className="s2-modal-success">
                <CircleCheck size={34} />
                <h3 id={titleId}>已提交工单</h3>
                <p>工单号 <code>{ticketId}</code>，稍后会有专职人员与您联系。</p>
                <ol className="s2-modal-next">
                  <li>平台与点点产品和你一起确认需求，定义新的策略字段</li>
                  <li>字段上线后出现在「{ROLE_TAB_LABELS[role]}」页签</li>
                  <li>之后由你自行调整这条策略的生效范围</li>
                </ol>
                <button type="button" className="s2-modal-primary" onClick={close}>知道了</button>
              </div>
            ) : (
              <>
                <h3 id={titleId}>新增策略</h3>
                <p className="s2-modal-lead">现有策略满足不了需求时，在这里描述你想要的筛选规则。</p>
                <div className="s2-modal-field">
                  <span className="s2-modal-label">提出角色</span>
                  <span className="s2-modal-role"><UserRound size={13} />{ROLE_LABELS[role]}<small>根据当前账号自动填入</small></span>
                </div>
                <div className="s2-modal-field">
                  <span className="s2-modal-label">适用场景</span>
                  <span className="s2-modal-scene">{scene}</span>
                </div>
                <label className="s2-modal-field">
                  <span className="s2-modal-label">需求描述</span>
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={5}
                    placeholder="例如：希望油皮相关的问题，优先展示近 30 天内有前后对比图的测评帖子。"
                  />
                </label>
                <div className="s2-modal-actions">
                  <button type="button" className="s2-text-button" onClick={close}>取消</button>
                  <button type="button" className="s2-modal-primary" onClick={submit} disabled={!text.trim()}>提交</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
