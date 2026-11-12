import { create } from 'zustand'
import { BASELINE_CONFIG } from './data/strategy-config'
import type { AnswerPoint, CoverageRun, ReuseReport, StrategyConfig, StrategyTab } from './types'

export type PageId = 'home' | 'strategy' | 'coverage' | 'reuse'
export type PreviewVersion = 'before' | 'after'
export type WorkflowStep = 0 | 1 | 2 | 3
export type ReuseWizardStep = 1 | 2 | 3
export const DEFAULT_TEMPLATE_ID = 'skincare-answer-template'

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
  activePage: PageId
  activeStrategyTab: StrategyTab
  draftConfig: StrategyConfig
  previewVersion: PreviewVersion
  sourcePoint: AnswerPoint | null
  flowStep: WorkflowStep
  coverageRun: CoverageRun | null
  selectedSampleId: string | null
  reuseWizardStep: ReuseWizardStep
  selectedTemplateId: string
  reuseReport: ReuseReport | null
  navigate: (page: PageId) => void
  setFlowStep: (step: WorkflowStep) => void
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
  activePage: 'home',
  activeStrategyTab: 'evidence',
  draftConfig: cloneBaseline(),
  previewVersion: 'after',
  sourcePoint: null,
  flowStep: 0,
  coverageRun: null,
  selectedSampleId: null,
  reuseWizardStep: 1,
  selectedTemplateId: DEFAULT_TEMPLATE_ID,
  reuseReport: null,
  navigate: (activePage) => set({
    activePage,
    flowStep: activePage === 'coverage' ? 1 : activePage === 'reuse' ? 3 : 0,
  }),
  setFlowStep: (flowStep) => set({ flowStep }),
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
    activePage: 'home',
    activeStrategyTab: 'evidence',
    draftConfig: cloneBaseline(),
    previewVersion: 'after',
    sourcePoint: null,
    flowStep: 0,
    coverageRun: null,
    selectedSampleId: null,
    reuseWizardStep: 1,
    selectedTemplateId: DEFAULT_TEMPLATE_ID,
    reuseReport: null,
  }),
}))
