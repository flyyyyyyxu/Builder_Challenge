import type { ComponentDef, ReuseReport, ReuseTargetScene, StrategyTemplate } from '../types'

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
): ReuseReport {
  const componentById = new Map(components.map((component) => [component.id, component]))
  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]))
  const reusedAsIs: ReuseReport['reusedAsIs'] = []

  for (const componentId of target.requiredComponentIds) {
    const component = componentById.get(componentId)
    if (component?.status === 'existing' && template.componentIds.includes(componentId)) {
      reusedAsIs.push({ id: componentId, name: component.name, kind: 'component' })
    }
  }
  for (const capabilityId of target.requiredCapabilityIds) {
    const capability = capabilityById.get(capabilityId)
    if (capability?.status === 'existing' && template.capabilityIds.includes(capabilityId)) {
      reusedAsIs.push({ id: capabilityId, name: capability.name, kind: 'capability' })
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
