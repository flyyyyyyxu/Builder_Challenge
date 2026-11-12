import { create } from 'zustand'
import { BASELINE_CONFIG } from './data/strategy-config'
import type { AnswerPoint, CoverageRun, ReuseReport, Role, StrategyConfig, StrategyTab } from './types'

export type PageId = 'home' | 'strategy' | 'coverage' | 'reuse'
export type PreviewVersion = 'before' | 'after'
export type ReuseWizardStep = 1 | 2 | 3
export const DEFAULT_TEMPLATE_ID = 'skincare-answer-template'

/** Identities the demo can switch between; the commercial one only exists for the P1 conflict follow-up. */
export type DemoRole = Extract<Role, 'industry_ops' | 'ads'>
export const ROLE_LABELS: Record<DemoRole, string> = {
  industry_ops: '行业运营 · 护肤',
  ads: '商业化（示例）',
}

function cloneBaseline(): StrategyConfig {
  return {
    evidence: { ...BASELINE_CONFIG.evidence, allowedKinds: [...BASELINE_CONFIG.evidence.allowedKinds] },
    presentation: {
      ...BASELINE_CONFIG.presentation,
      groupByPersonaAppliesTo: [...BASELINE_CONFIG.presentation.groupByPersonaAppliesTo],
      componentOrder: [...BASELINE_CONFIG.presentation.componentOrder],
    },
    guardrails: { ...BASELINE_CONFIG.guardrails },
  }
}

type DemoStore = {
  role: DemoRole
  /** A guardrail change the commercial role proposed; never applied to the draft. */
  sponsoredProposal: 'beforeConclusion' | null
  conflictNotified: boolean
  activePage: PageId
  activeStrategyTab: StrategyTab
  draftConfig: StrategyConfig
  previewVersion: PreviewVersion
  sourcePoint: AnswerPoint | null
  coverageRun: CoverageRun | null
  selectedSampleId: string | null
  reuseWizardStep: ReuseWizardStep
  selectedTemplateId: string
  reuseReport: ReuseReport | null
  setRole: (role: DemoRole) => void
  proposeSponsoredBeforeConclusion: () => void
  withdrawSponsoredProposal: () => void
  notifyConflictOwner: () => void
  navigate: (page: PageId) => void
  setStrategyTab: (tab: StrategyTab) => void
  setDraftConfig: (config: StrategyConfig) => void
  setPreviewVersion: (version: PreviewVersion) => void
  openSource: (point: AnswerPoint) => void
  closeSource: () => void
  setCoverageRun: (run: CoverageRun) => void
  setSelectedSampleId: (sampleId: string | null) => void
  setReuseWizardStep: (step: ReuseWizardStep) => void
  setSelectedTemplateId: (templateId: string) => void
  setReuseReport: (report: ReuseReport | null) => void
  resetStrategy: () => void
  resetDemo: () => void
}

export const useDemoStore = create<DemoStore>((set) => ({
  role: 'industry_ops',
  sponsoredProposal: null,
  conflictNotified: false,
  activePage: 'home',
  activeStrategyTab: 'evidence',
  draftConfig: cloneBaseline(),
  previewVersion: 'after',
  sourcePoint: null,
  coverageRun: null,
  selectedSampleId: null,
  reuseWizardStep: 1,
  selectedTemplateId: DEFAULT_TEMPLATE_ID,
  reuseReport: null,
  setRole: (role) => set(role === 'ads'
    ? { role, activePage: 'strategy', activeStrategyTab: 'guardrail', sourcePoint: null }
    : { role }),
  proposeSponsoredBeforeConclusion: () => set({ sponsoredProposal: 'beforeConclusion', conflictNotified: false }),
  withdrawSponsoredProposal: () => set({ sponsoredProposal: null, conflictNotified: false }),
  notifyConflictOwner: () => set({ conflictNotified: true }),
  navigate: (activePage) => set({ activePage }),
  setStrategyTab: (activeStrategyTab) => set({ activeStrategyTab }),
  setDraftConfig: (draftConfig) => set({ draftConfig }),
  setPreviewVersion: (previewVersion) => set({ previewVersion }),
  openSource: (sourcePoint) => set({ sourcePoint }),
  closeSource: () => set({ sourcePoint: null }),
  setCoverageRun: (coverageRun) => set({ coverageRun }),
  setSelectedSampleId: (selectedSampleId) => set({ selectedSampleId }),
  setReuseWizardStep: (reuseWizardStep) => set({ reuseWizardStep }),
  setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId, reuseWizardStep: 1, reuseReport: null }),
  setReuseReport: (reuseReport) => set({ reuseReport }),
  resetStrategy: () => set({ draftConfig: cloneBaseline(), previewVersion: 'after', sourcePoint: null }),
  resetDemo: () => set({
    role: 'industry_ops',
    sponsoredProposal: null,
    conflictNotified: false,
    activePage: 'home',
    activeStrategyTab: 'evidence',
    draftConfig: cloneBaseline(),
    previewVersion: 'after',
    sourcePoint: null,
      coverageRun: null,
    selectedSampleId: null,
    reuseWizardStep: 1,
    selectedTemplateId: DEFAULT_TEMPLATE_ID,
    reuseReport: null,
  }),
}))
