export type Role = 'dots_pm' | 'industry_ops' | 'ads' | 'community'
export type StrategyTab = 'evidence' | 'presentation' | 'guardrail'
export type SceneId = 'skincare-shopping' | 'skincare-usage' | 'home-cooking-steps'
export type QueryCategory = '选购类' | '用法类' | '做法类' | '踩坑类'
export type ContentKind = 'note' | 'comment'
export type Stance = '推荐' | '不推荐' | '踩坑' | '中立'
export type ComponentStatus = 'existing' | 'planned'
export type FreshnessDays = 90 | 180 | 365 | '不限'
export type MinNoteLikes = 0 | 20 | 40
export type SponsoredCap = 1 | 2 | '不限'
export type ChangeKind = 'added' | 'removed' | 'unchanged'
export type ConflictStatus = 'needs_discussion'

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

export interface Scene {
  id: SceneId
  vertical: string
  intent: string
  sampleQuery: string
  queryId: string
  category: QueryCategory
  templateId?: string
}

export interface SetBy {
  role: Role
  team: string
  name: string
  isExample: true
}

export type ConfigPath =
  | 'evidence.preferFirstHand'
  | 'evidence.allowedKinds'
  | 'evidence.freshnessDays'
  | 'evidence.includeCounterEvidence'
  | 'evidence.labelSponsored'
  | 'evidence.allowSponsored'
  | 'evidence.minNoteLikes'
  | 'evidence.preferMatchingPersona'
  | 'evidence.sponsoredPersonaMatch'
  | 'evidence.sponsoredCap'
  | 'presentation.groupByPersona'
  | 'presentation.groupByPersonaAppliesTo'
  | 'presentation.showPitfall'
  | 'presentation.showConclusion'
  | 'presentation.componentOrder'
  | 'presentation.groupPointLimit'
  | 'guardrails.sponsoredPosition'

export interface StrategyConfig {
  evidence: {
    preferFirstHand: boolean
    allowedKinds: ContentKind[]
    freshnessDays: FreshnessDays
    includeCounterEvidence: boolean
    labelSponsored: boolean
    /** Commercial-owned: whether partner (sponsored) posts may enter the candidate pool at all. */
    allowSponsored: boolean
    /** Industry-ops: notes below this like count are filtered out; comments are exempt. 0 = no threshold. */
    minNoteLikes: MinNoteLikes
    /** Industry-ops: rank posts whose persona matches the asker's (e.g. 油皮) ahead of others. Ranking only. */
    preferMatchingPersona: boolean
    /** Commercial: a sponsored post only enters when its target persona matches the question's persona. */
    sponsoredPersonaMatch: boolean
    /** Community floor: max sponsored posts per answer card. */
    sponsoredCap: SponsoredCap
  }
  presentation: {
    groupByPersona: boolean
    groupByPersonaAppliesTo: QueryCategory[]
    showPitfall: boolean
    showConclusion: boolean
    componentOrder: string[]
    groupPointLimit: number
  }
  guardrails: {
    sponsoredPosition: 'afterConclusion' | 'beforeConclusion'
  }
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K]
}

export type ConfigValue = boolean | number | string | ContentKind[] | QueryCategory[] | string[]

export interface StrategyItem {
  id: string
  sceneId: SceneId
  tab: StrategyTab
  key: ConfigPath
  label: string
  value: ConfigValue
  appliesTo?: QueryCategory[]
  setBy: SetBy
  source: 'platform-default' | 'scene-template' | 'business-draft' | 'example-guardrail'
  isExampleGuardrail: boolean
  editableBy: Role[]
  explanation: string
}

export interface StrategyFieldSource {
  path: ConfigPath
  label: string
  value: ConfigValue
  source: StrategyItem['source']
  setBy: SetBy
  appliesTo?: QueryCategory[]
  editable: boolean
  isExampleGuardrail: boolean
  explanation: string
}

export interface ResolvedConfig {
  config: StrategyConfig
  sources: Record<ConfigPath, StrategyFieldSource>
}

export interface Query {
  id: string
  sceneId: SceneId
  text: string
  category: QueryCategory
  persona?: string
}

export interface Post {
  id: string
  sceneId: SceneId
  queryIds: string[]
  kind: ContentKind
  parentId?: string
  author: string
  authorType: '素人' | '博主' | '合作'
  date: string
  persona?: string
  stance: Stance
  firstHand: boolean
  sponsored: boolean
  text: string
  likes: number
  points: string[]
  mock: true
}

export interface PointDefinition {
  key: string
  text: string
  componentId: string
  kind: 'shared' | 'persona' | 'step' | 'pitfall' | 'cooking'
  persona?: string
  order: number
}

export interface ComponentDef {
  id: string
  name: string
  status: ComponentStatus
  usedBy: SceneId[]
  supports: string[]
  description: string
}

export interface RuleTrace {
  ruleId: string
  label: string
  source: string
  owner: string
  matched: boolean
  explanation: string
}

export interface AnswerPoint {
  id: string
  text: string
  componentId: string
  evidenceIds: string[]
  persona?: string
  change: ChangeKind
  trace: RuleTrace[]
}

export interface FilteredEvidence {
  evidenceId: string
  reason: string
  ruleId: string
}

export interface OmittedPoint {
  pointKey: string
  text: string
  evidenceIds: string[]
  reason: string
  ruleId: string
}

export interface RenderedAnswer {
  queryId: string
  sections: Array<{
    id: string
    componentId: string
    title: string
    status: ComponentStatus
    points: AnswerPoint[]
  }>
  eligibleEvidenceIds: string[]
  filteredEvidence: FilteredEvidence[]
  omittedPoints: OmittedPoint[]
  footer: {
    noteCount: number
    commentCount: number
    sponsoredLabeledCount: number
    latestDate?: string
  }
}

export interface ExpectedPoint {
  key: string
  label: string
}

export interface Sample extends Query {
  expectedPoints: ExpectedPoint[]
  annotatedBy: string
  annotationNote: string
}

export interface SampleResult {
  sampleId: string
  query: string
  expectedPointKeys: string[]
  before: RenderedAnswer
  after: RenderedAnswer
  coveredBefore: string[]
  coveredAfter: string[]
  missedBefore: string[]
  missedAfter: string[]
  traceableRateBefore: number | null
  traceableRateAfter: number | null
  staleCountBefore: number
  staleCountAfter: number
  sponsoredUnlabeledBefore: number
  sponsoredUnlabeledAfter: number
  delta: 'improved' | 'same' | 'regressed'
  reason?: string
}

export interface CoverageRun {
  configVersion: string
  configSnapshot: StrategyConfig
  asOf: string
  results: SampleResult[]
  summary: {
    improved: number
    same: number
    regressed: number
  }
}

export interface Conflict {
  id: string
  itemKey: ConfigPath
  guardrail: {
    label: string
    ownerTeam: string
    ownerName: string
    isExample: true
  }
  message: string
  options: Array<{ id: string; label: string; note: string }>
  action: 'notify_owner'
  status: ConflictStatus
}

export interface StrategyTemplate {
  id: string
  name: string
  sceneId: SceneId
  componentIds: string[]
  capabilityIds: string[]
  config: StrategyConfig
  isExample: true
}

export interface ReuseTargetScene {
  id: SceneId
  vertical: string
  intent: string
  requiredComponentIds: string[]
  plannedComponentIds: string[]
  requiredCapabilityIds: string[]
  /** Strategy items (template rules on step 01, filter rules on step 02) carried over unchanged. */
  requiredRuleIds: string[]
  configChanges: Array<{ key: string; label: string; stage: ReuseGroup; from: string; to: string }>
}

/** Which workspace step a reuse item belongs to; matches the names on the step bar. */
export type ReuseGroup = '卡片模板' | '筛选策略' | '回归检查'

/** A strategy item shown on step 01 or 02, named exactly as it appears there. */
export interface ReusableRule {
  id: string
  name: string
  group: ReuseGroup
}

export interface ReuseReport {
  reusedAsIs: Array<{ id: string; name: string; kind: 'capability' | 'component' | 'rule'; group: ReuseGroup }>
  reconfigured: Array<{ key: string; label: string; stage: ReuseGroup; from: string; to: string }>
  plannedExtensions: Array<{ id: string; name: string; reason: string }>
  reuseShare: number
  denominator: number
}
