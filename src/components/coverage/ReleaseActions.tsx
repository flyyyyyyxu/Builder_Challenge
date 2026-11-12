import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleCheck, Rocket, Save, X } from 'lucide-react'
import { TEMPLATE_DRAFT_VERSION, TEMPLATE_PINNED_VERSION } from '../../data'
import { getConfigVersion } from '../../engine'
import { useDemoStore } from '../../store'
import { changedLabels } from '../strategy/StrategyWorkspace'
import type { CoverageRun } from '../../types'

const SCENE_LABEL = '护肤 · 选购怎么选'

/**
 * “保存” keeps the current draft as the next template version; “上线” is only allowed when the latest
 * check ran on exactly this draft and found no regression. Both are mock: nothing leaves the browser.
 */
export function ReleaseActions({ run, onReuse }: { run: CoverageRun; onReuse: () => void }) {
  const draftConfig = useDemoStore((state) => state.draftConfig)
  const removed = useDemoStore((state) => state.removedFilterRules)
  const savedVersion = useDemoStore((state) => state.savedConfigVersion)
  const launchedVersion = useDemoStore((state) => state.launchedConfigVersion)
  const saveDraft = useDemoStore((state) => state.saveDraft)
  const launchDraft = useDemoStore((state) => state.launchDraft)
  const [dialog, setDialog] = useState<'confirm' | 'done' | null>(null)
  const titleId = useId()

  const current = getConfigVersion(draftConfig)
  const changes = [...changedLabels(draftConfig, 'template'), ...changedLabels(draftConfig, 'filter', removed)]
  const isSaved = savedVersion === current
  const isLaunched = launchedVersion === current
  const blocker = changes.length === 0
    ? '草稿与线上版本一致，无需上线'
    : run.configVersion !== current
      ? '草稿在检查后又改过，重跑后才能上线'
      : run.summary.regressed > 0
        ? `还有 ${run.summary.regressed} 条回归，修复后才能上线`
        : null

  useEffect(() => {
    if (!dialog) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setDialog(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dialog])

  const status = isLaunched
    ? `${TEMPLATE_DRAFT_VERSION} 已上线`
    : isSaved
      ? `已保存为草稿 ${TEMPLATE_DRAFT_VERSION} · 未上线`
      : blocker ?? '检查通过，可以上线'

  return (
    <div className="cv-release">
      <span className={`cv-release-status ${blocker && !isLaunched ? 'is-blocked' : ''}`} role="status">{status}</span>
      <button type="button" className="cv-button cv-button-quiet" onClick={() => saveDraft(current)} disabled={isSaved || changes.length === 0}>
        {isSaved ? <><Check size={14} />已保存</> : <><Save size={14} />保存</>}
      </button>
      <button
        type="button"
        className="cv-button cv-button-primary"
        onClick={() => setDialog('confirm')}
        disabled={Boolean(blocker) || isLaunched}
        title={blocker ?? undefined}
      >
        {isLaunched ? <><Check size={14} />已上线</> : <><Rocket size={14} />上线</>}
      </button>

      {dialog && createPortal(
        <div className="s2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
          <div className="s2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="s2-modal-close" onClick={() => setDialog(null)} aria-label="关闭"><X size={16} /></button>
            {dialog === 'confirm' ? (
              <>
                <h3 id={titleId}>确认上线</h3>
                <p className="s2-modal-lead">上线后，「{SCENE_LABEL}」场景从 {TEMPLATE_PINNED_VERSION} 切换到 {TEMPLATE_DRAFT_VERSION}。</p>
                <dl className="cv-release-summary">
                  <div><dt>版本</dt><dd>{TEMPLATE_PINNED_VERSION} → {TEMPLATE_DRAFT_VERSION}</dd></div>
                  <div><dt>改动</dt><dd>{changes.join('、')}</dd></div>
                  <div><dt>回归检查</dt><dd>{run.summary.improved} 提升 · {run.summary.same} 持平 · {run.summary.regressed} 回归</dd></div>
                </dl>
                <p className="s2-modal-hint">演示环境：不会改动线上策略，只记录本地状态。</p>
                <div className="s2-modal-actions">
                  <button type="button" className="s2-text-button" onClick={() => setDialog(null)}>取消</button>
                  <button type="button" className="s2-modal-primary" onClick={() => { launchDraft(current); setDialog('done') }}>确认上线</button>
                </div>
              </>
            ) : (
              <div className="s2-modal-success">
                <CircleCheck size={34} />
                <h3 id={titleId}>{TEMPLATE_DRAFT_VERSION} 已上线</h3>
                <p>「{SCENE_LABEL}」的答案卡已切换到新版本（演示环境）。</p>
                <ol className="s2-modal-next">
                  <li>版本历史已记录本次改动和参与的角色</li>
                  <li>用户反馈会回流到反馈治理，持续检查这个版本</li>
                  <li>可以把这套模板和策略复用到同类新场景</li>
                </ol>
                <div className="s2-modal-actions">
                  <button type="button" className="s2-text-button" onClick={() => setDialog(null)}>知道了</button>
                  <button type="button" className="s2-modal-primary" onClick={() => { setDialog(null); onReuse() }}>复用到同类新场景</button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
