import type { AnswerPoint, ComponentDef, FilteredEvidence, OmittedPoint, PointDefinition, Post, Query, RenderedAnswer, RuleTrace, StrategyConfig } from '../types'

const MOCK_RULE_OWNER = '规则模拟器（本地示例）'

function ageInDays(date: string, asOf: string): number {
  return Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000)
}

function trace(ruleId: string, label: string, matched: boolean, explanation: string): RuleTrace {
  return { ruleId, label, source: '本地规则模拟（示例）', owner: MOCK_RULE_OWNER, matched, explanation }
}

function byOrder(a: PointDefinition, b: PointDefinition): number {
  return a.order - b.order || a.key.localeCompare(b.key)
}

export function renderAnswer(
  config: StrategyConfig,
  query: Query,
  posts: Post[],
  components: ComponentDef[],
  pointCatalog: PointDefinition[],
  asOf: string,
): RenderedAnswer {
  const componentById = new Map(components.map((component) => [component.id, component]))
  const pointByKey = new Map(pointCatalog.map((point) => [point.key, point]))
  const filteredEvidence: FilteredEvidence[] = []
  const queryCandidates = posts.filter((post) => post.sceneId === query.sceneId && post.queryIds.includes(query.id))
  const eligible = queryCandidates.filter((post) => {
    if (!config.evidence.allowedKinds.includes(post.kind)) {
      filteredEvidence.push({ evidenceId: post.id, reason: `来源类型“${post.kind === 'note' ? '笔记' : '评论'}”不在当前允许类型中。`, ruleId: 'allowed-content-kinds' })
      return false
    }
    if (!config.evidence.allowSponsored && post.sponsored) {
      filteredEvidence.push({ evidenceId: post.id, reason: '商业化策略未允许合作内容进入候选。', ruleId: 'allow-sponsored' })
      return false
    }
    if (config.evidence.freshnessDays !== '不限' && ageInDays(post.date, asOf) > config.evidence.freshnessDays) {
      filteredEvidence.push({ evidenceId: post.id, reason: `发布时间超出 ${config.evidence.freshnessDays} 天时效窗口。`, ruleId: 'freshness-window' })
      return false
    }
    if (!config.evidence.includeCounterEvidence && (post.stance === '不推荐' || post.stance === '踩坑')) {
      filteredEvidence.push({ evidenceId: post.id, reason: '当前策略未纳入不推荐或踩坑立场内容。', ruleId: 'counter-evidence' })
      return false
    }
    return true
  })

  eligible.sort((a, b) => {
    const firstHandOrder = config.evidence.preferFirstHand ? Number(b.firstHand) - Number(a.firstHand) : 0
    return firstHandOrder || b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
  })

  const evidenceByPoint = new Map<string, Post[]>()
  for (const post of eligible) {
    for (const pointKey of post.points) {
      const existing = evidenceByPoint.get(pointKey) ?? []
      existing.push(post)
      evidenceByPoint.set(pointKey, existing)
    }
  }

  const groupScopeMatches = config.presentation.groupByPersonaAppliesTo.includes(query.category)
  const groupActive = config.presentation.groupByPersona && groupScopeMatches
  const groupedStepRegression = groupActive && query.category === '用法类'
  const omittedPoints: OmittedPoint[] = []
  const renderablePoints: Array<{ definition: PointDefinition; evidence: Post[] }> = []

  for (const [pointKey, evidence] of evidenceByPoint) {
    const definition = pointByKey.get(pointKey)
    if (!definition || evidence.length === 0) continue
    const component = componentById.get(definition.componentId)
    if (!component || component.status !== 'existing' || !component.supports.includes(pointKey)) {
      omittedPoints.push({ pointKey, text: definition.text, evidenceIds: evidence.map((post) => post.id), reason: '当前已有组件库中没有可承载该要点的组件。', ruleId: 'existing-component-support' })
      continue
    }
    if (definition.kind === 'persona' && !groupActive) {
      omittedPoints.push({ pointKey, text: definition.text, evidenceIds: evidence.map((post) => post.id), reason: '按肤质分组组件未对当前问题生效，肤质要点未进入答案结构。', ruleId: 'persona-group-scope' })
      continue
    }
    if (definition.kind === 'pitfall' && !config.presentation.showPitfall) {
      omittedPoints.push({ pointKey, text: definition.text, evidenceIds: evidence.map((post) => post.id), reason: '踩坑提醒组件当前关闭。', ruleId: 'pitfall-component-toggle' })
      continue
    }
    if (definition.componentId === 'conclusion' && !config.presentation.showConclusion) {
      omittedPoints.push({ pointKey, text: definition.text, evidenceIds: evidence.map((post) => post.id), reason: '一句话结论组件当前关闭。', ruleId: 'conclusion-component-toggle' })
      continue
    }
    renderablePoints.push({ definition, evidence })
  }

  // Within the same order, the persona that matches the question (e.g. 油皮) is shown first.
  const matchesQuery = (definition: PointDefinition) => Number(Boolean(query.persona) && definition.persona === query.persona)
  renderablePoints.sort((a, b) => a.definition.order - b.definition.order
    || matchesQuery(b.definition) - matchesQuery(a.definition)
    || byOrder(a.definition, b.definition))
  let visiblePoints = renderablePoints
  if (groupedStepRegression) {
    const seenPerPersona = new Map<string, number>()
    visiblePoints = renderablePoints.filter(({ definition, evidence }) => {
      if (definition.kind !== 'step' || definition.componentId !== 'step-list') return true
      const persona = definition.persona ?? evidence[0]?.persona ?? '未分组'
      const seen = seenPerPersona.get(persona) ?? 0
      if (seen < config.presentation.groupPointLimit) {
        seenPerPersona.set(persona, seen + 1)
        return true
      }
      omittedPoints.push({
        pointKey: definition.key,
        text: definition.text,
        evidenceIds: evidence.map((post) => post.id),
        reason: `按肤质分组也作用到了用法类问题，步骤被拆进各组，每组最多保留 ${config.presentation.groupPointLimit} 条，这一步被截掉了。`,
        ruleId: 'persona-group-step-limit',
      })
      return false
    })
  }

  const sectionsByComponent = new Map<string, AnswerPoint[]>()
  for (const { definition, evidence } of visiblePoints) {
    const component = componentById.get(definition.componentId)
    if (!component || component.status !== 'existing') continue
    const pointTrace: RuleTrace[] = [
      trace('candidate-source-filter', '来源条件筛选', true, `此要点由 ${evidence.length} 条通过来源类型、时效与立场条件的 mock 内容支持。`),
      trace('existing-component-support', '已有组件承载', true, `“${component.name}”是标为 existing 的示例组件。`),
      trace('persona-group-scope', '分组适用范围', groupActive, groupActive
        ? `问题类别“${query.category}”属于当前分组适用范围。`
        : `按肤质分组未对当前问题生效；问题类别为“${query.category}”。`),
    ]
    const answerPoint: AnswerPoint = {
      id: definition.key,
      text: definition.text,
      componentId: definition.componentId,
      evidenceIds: evidence.map((post) => post.id),
      persona: definition.persona,
      change: 'unchanged',
      trace: pointTrace,
    }
    const existing = sectionsByComponent.get(definition.componentId) ?? []
    existing.push(answerPoint)
    sectionsByComponent.set(definition.componentId, existing)
  }

  const orderedIds = [...config.presentation.componentOrder]
  for (const componentId of sectionsByComponent.keys()) if (!orderedIds.includes(componentId)) orderedIds.push(componentId)
  const sections = orderedIds.flatMap((componentId) => {
    const points = sectionsByComponent.get(componentId)
    const component = componentById.get(componentId)
    if (!points?.length || !component || component.status !== 'existing') return []
    return [{ id: componentId, componentId, title: component.name, status: component.status, points }]
  })

  const citedIds = [...new Set(sections.flatMap((section) => section.points.flatMap((point) => point.evidenceIds)))]
  const citedPosts = citedIds.flatMap((id) => {
    const post = posts.find((candidate) => candidate.id === id)
    return post ? [post] : []
  })
  const latestDate = citedPosts.map((post) => post.date).sort((a, b) => b.localeCompare(a))[0]

  return {
    queryId: query.id,
    sections,
    eligibleEvidenceIds: eligible.map((post) => post.id),
    filteredEvidence,
    omittedPoints,
    footer: {
      noteCount: citedPosts.filter((post) => post.kind === 'note').length,
      commentCount: citedPosts.filter((post) => post.kind === 'comment').length,
      sponsoredLabeledCount: config.evidence.labelSponsored ? citedPosts.filter((post) => post.sponsored).length : 0,
      latestDate,
    },
  }
}
