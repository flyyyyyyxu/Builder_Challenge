import type { ComponentDef, ReusableRule, ReuseReport, ReuseTargetScene, StrategyTemplate } from '../types'

export interface ReusableCapability {
  id: string
  name: string
  status: 'existing' | 'planned'
}

export function reuseReport(
  template: StrategyTemplate,
  target: ReuseTargetScene,
  components: ComponentDef[],
  capabilities: ReusableCapability[],
  rules: ReusableRule[] = [],
): ReuseReport {
  const componentById = new Map(components.map((component) => [component.id, component]))
  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]))
  const reusedAsIs: ReuseReport['reusedAsIs'] = []

  for (const componentId of target.requiredComponentIds) {
    const component = componentById.get(componentId)
    if (component?.status === 'existing' && template.componentIds.includes(componentId)) {
      reusedAsIs.push({ id: componentId, name: component.name, kind: 'component', group: '卡片模板' })
    }
  }
  const ruleById = new Map(rules.map((rule) => [rule.id, rule]))
  const templateRules = target.requiredRuleIds.flatMap((id) => ruleById.get(id) ?? [])
  for (const rule of templateRules.filter((item) => item.group === '卡片模板')) {
    reusedAsIs.push({ id: rule.id, name: rule.name, kind: 'rule', group: rule.group })
  }
  for (const rule of templateRules.filter((item) => item.group === '筛选策略')) {
    reusedAsIs.push({ id: rule.id, name: rule.name, kind: 'rule', group: rule.group })
  }
  for (const capabilityId of target.requiredCapabilityIds) {
    const capability = capabilityById.get(capabilityId)
    if (capability?.status === 'existing' && template.capabilityIds.includes(capabilityId)) {
      reusedAsIs.push({ id: capabilityId, name: capability.name, kind: 'capability', group: '回归检查' })
    }
  }

  const plannedExtensions = target.plannedComponentIds.flatMap((id) => {
    const component = componentById.get(id)
    if (!component || component.status !== 'planned') return []
    return [{ id, name: component.name, reason: component.description }]
  })
  const reconfigured = target.configChanges.map((change) => ({ ...change }))
  const denominator = reusedAsIs.length + reconfigured.length
  const reuseShare = denominator === 0 ? 0 : reusedAsIs.length / denominator

  return { reusedAsIs, reconfigured, plannedExtensions, reuseShare, denominator }
}
