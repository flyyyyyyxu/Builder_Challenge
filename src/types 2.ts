export type Role = 'industry_ops' | 'dots_pm'
export type StrategyTab = 'evidence' | 'presentation' | 'guardrail'
export type SceneId = 'skincare-shopping' | 'home-cooking-steps'

export interface DemoContext {
  role: Role
  sceneId: SceneId
  query: string
  demoVersion: string
}

export interface PhaseNotice {
  phase: number
  label: string
  implemented: boolean
}
