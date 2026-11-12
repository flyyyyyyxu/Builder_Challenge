import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleCheck, Rocket, Save, X } from 'lucide-react'
import { TEMPLATE_DRAFT_VERSION, TEMPLATE_PINNED_VERSION } from '../../data'
import { getConfigVersion } from '../../engine'
import { useDemoStore } from '../../store'
import { changedLabels } from '../strategy/StrategyWorkspace'
import type { CoverageRun } from '../../types'

const SCENE_LABEL = '护肤 · 选购怎么选'

/** Who signs off and how the release rolls out; all mock, shown so “8 条样例通过” never reads as “直接全量”. */
const APPROVER = '场景负责人（护肤场景 PM，示例）'
const GRAY_PLAN = '5% 流量 · 观察 3 天（示例）'
const WATCH_METRICS = '点踩率、原文点击率、改写重搜率'

/**
 * “保存” keeps the current draft as the next template version; “提交上线” is only allowed when the latest
 * check ran on exactly this draft and found no regression. The change author cannot pass it alone: the
 * scene owner approves, then it rolls out to a gray slice first. All mock: nothing leaves the browser.
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
    ? `${TEMPLATE_DRAFT_VERSION} 灰度中 · 5%`
    : isSaved
      ? `已保存为草稿 ${TEMPLATE_DRAFT_VERSION} · 未上线`
      : blocker ?? '检查通过，可以提交上线'

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
        {isLaunched ? <><Check size={14} />灰度中</> : <><Rocket size={14} />提交上线</>}
      </button>

      {dialog && createPortal(
        <div className="s2-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
          <div className="s2-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button type="button" className="s2-modal-close" onClick={() => setDialog(null)} aria-label="关闭"><X size={16} /></button>
            {dialog === 'confirm' ? (
              <>
                <h3 id={titleId}>提交上线</h3>
                <p className="s2-modal-lead">固定样例只能说明没有已知回归。改动人不能自己判定通过：先由场景负责人审批，再小流量灰度，看线上指标后再全量。</p>
                <dl className="cv-release-summary">
                  <div><dt>版本</dt><dd>「{SCENE_LABEL}」{TEMPLATE_PINNED_VERSION} → {TEMPLATE_DRAFT_VERSION}</dd></div>
                  <div><dt>改动</dt><dd>{changes.join('、')}</dd></div>
                  <div><dt>回归检查</dt><dd>{run.summary.improved} 提升 · {run.summary.same} 持平 · {run.summary.regressed} 回归</dd></div>
                  <div><dt>审批人</dt><dd>{APPROVER}</dd></div>
                  <div><dt>灰度</dt><dd>{GRAY_PLAN}；指标变差可回滚到 {TEMPLATE_PINNED_VERSION}</dd></div>
                  <div><dt>观察指标</dt><dd>{WATCH_METRICS}（灰度后统计，演示中不显示数值）</dd></div>
                </dl>
                <p className="s2-modal-hint">演示环境：不会发送审批或改动线上策略，只记录本地状态。</p>
                <div className="s2-modal-actions">
                  <button type="button" className="s2-text-button" onClick={() => setDialog(null)}>取消</button>
                  <button type="button" className="s2-modal-primary" onClick={() => { launchDraft(current); setDialog('done') }}>提交审批并灰度</button>
                </div>
              </>
            ) : (
              <div className="s2-modal-success">
                <CircleCheck size={34} />
                <h3 id={titleId}>{TEMPLATE_DRAFT_VERSION} 进入灰度</h3>
                <p>演示中视为场景负责人已审批，「{SCENE_LABEL}」{TEMPLATE_DRAFT_VERSION} 在 5% 流量上灰度。</p>
                <ol className="s2-modal-next">
                  <li>灰度期间观察{WATCH_METRICS}，达标后全量，变差就回滚</li>
                  <li>用户反馈会回流到反馈治理，典型问题补进回归样例</li>
                  <li>这次回归说明“用法类”问题需要自己的呈现方式：分组已对它关闭，可以把它拆成独立场景，复用这套模板</li>
                </ol>
                <div className="s2-modal-actions">
                  <button type="button" className="s2-text-button" onClick={() => setDialog(null)}>知道了</button>
                  <button type="button" className="s2-modal-primary" onClick={() => { setDialog(null); onReuse() }}>把用法类拆成新场景</button>
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
