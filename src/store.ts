import { create } from 'zustand'
import { BASELINE_CONFIG } from './data/strategy-config'
import type { AnswerPoint, CoverageRun, ReuseReport, Role, StrategyConfig } from './types'

export type PageId = 'home' | 'template' | 'strategy' | 'coverage' | 'reuse' | 'feedback'
export type PreviewVersion = 'before' | 'after'
export type ReuseWizardStep = 1 | 2 | 3
export const DEFAULT_TEMPLATE_ID = 'skincare-answer-template'

/** Account identities (permission isolation): every account can view all roles' settings but only edit its own. */
export type DemoRole = Extract<Role, 'industry_ops' | 'ads' | 'community'>
export const ROLE_LABELS: Record<DemoRole, string> = {
  industry_ops: '行业运营 · 护肤',
  ads: '商业化',
  community: '社区治理',
}
/** Short names used on the role tabs inside the template and strategy pages. */
export const ROLE_TAB_LABELS: Record<DemoRole, string> = {
  industry_ops: '行业运营',
  ads: '商业化',
  community: '社区治理',
}
export const DEMO_ROLES: DemoRole[] = ['industry_ops', 'ads', 'community']

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
  /** Workspace pages the presenter has opened; a step counts as done once it has been reviewed. */
  visitedPages: PageId[]
  /** Which role's slots/rules are being viewed on the template and strategy pages. */
  viewedRole: DemoRole
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
  setViewedRole: (role: DemoRole) => void
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
  visitedPages: [],
  viewedRole: 'industry_ops',
  draftConfig: cloneBaseline(),
  previewVersion: 'after',
  sourcePoint: null,
  coverageRun: null,
  selectedSampleId: null,
  reuseWizardStep: 1,
  selectedTemplateId: DEFAULT_TEMPLATE_ID,
  reuseReport: null,
  setRole: (role) => set({ role, viewedRole: role }),
  proposeSponsoredBeforeConclusion: () => set({ sponsoredProposal: 'beforeConclusion', conflictNotified: false }),
  withdrawSponsoredProposal: () => set({ sponsoredProposal: null, conflictNotified: false }),
  notifyConflictOwner: () => set({ conflictNotified: true }),
  navigate: (activePage) => set((state) => ({ activePage, visitedPages: state.visitedPages.includes(activePage) ? state.visitedPages : [...state.visitedPages, activePage] })),
  setViewedRole: (viewedRole) => set({ viewedRole }),
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
    visitedPages: [],
    viewedRole: 'industry_ops',
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
