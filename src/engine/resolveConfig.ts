import type { ConfigPath, ConfigValue, DeepPartial, ResolvedConfig, StrategyConfig, StrategyFieldSource, StrategyItem } from '../types'
import { STRATEGY_ITEMS } from '../data/strategy-items'

const CONFIG_PATHS: ConfigPath[] = [
  'evidence.preferFirstHand',
  'evidence.allowedKinds',
  'evidence.freshnessDays',
  'evidence.includeCounterEvidence',
  'evidence.labelSponsored',
  'presentation.groupByPersona',
  'presentation.groupByPersonaAppliesTo',
  'presentation.showPitfall',
  'presentation.showConclusion',
  'presentation.componentOrder',
  'presentation.groupPointLimit',
  'guardrails.sponsoredPosition',
]

function cloneConfig(config: StrategyConfig): StrategyConfig {
  return {
    evidence: { ...config.evidence, allowedKinds: [...config.evidence.allowedKinds] },
    presentation: {
      ...config.presentation,
      groupByPersonaAppliesTo: [...config.presentation.groupByPersonaAppliesTo],
      componentOrder: [...config.presentation.componentOrder],
    },
    guardrails: { ...config.guardrails },
  }
}

function readPath(config: StrategyConfig, path: ConfigPath): ConfigValue {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  return (config[section] as unknown as Record<string, ConfigValue>)[key]
}

function isOverridden(overrides: DeepPartial<StrategyConfig>, path: ConfigPath): boolean {
  const [section, key] = path.split('.') as [keyof StrategyConfig, string]
  const sectionOverride = overrides[section] as unknown as Record<string, unknown> | undefined
  return sectionOverride !== undefined && Object.prototype.hasOwnProperty.call(sectionOverride, key)
}

/** Deterministically resolves a base and a scene draft without mutating either input. */
export function resolveConfig(
  base: StrategyConfig,
  overrides: DeepPartial<StrategyConfig> = {},
  items: StrategyItem[] = STRATEGY_ITEMS,
): ResolvedConfig {
  const config = cloneConfig(base)
  if (overrides.evidence) {
    config.evidence = {
      ...config.evidence,
      ...overrides.evidence,
      allowedKinds: overrides.evidence.allowedKinds ? [...overrides.evidence.allowedKinds] : [...config.evidence.allowedKinds],
    }
  }
  if (overrides.presentation) {
    config.presentation = {
      ...config.presentation,
      ...overrides.presentation,
      groupByPersonaAppliesTo: overrides.presentation.groupByPersonaAppliesTo
        ? [...overrides.presentation.groupByPersonaAppliesTo]
        : [...config.presentation.groupByPersonaAppliesTo],
      componentOrder: overrides.presentation.componentOrder
        ? [...overrides.presentation.componentOrder]
        : [...config.presentation.componentOrder],
    }
  }
  if (overrides.guardrails) config.guardrails = { ...config.guardrails, ...overrides.guardrails }

  const itemsByPath = new Map(items.map((item) => [item.key, item]))
  const fallbackSetBy = {
    role: 'dots_pm' as const,
    team: '平台默认配置（示例）',
    name: '演示平台配置（虚构）',
    isExample: true as const,
  }
  const sources = Object.fromEntries(CONFIG_PATHS.map((path) => {
    const item = itemsByPath.get(path)
    const overridden = isOverridden(overrides, path)
    const appliesTo = path === 'presentation.groupByPersona' || path === 'presentation.groupByPersonaAppliesTo'
      ? [...config.presentation.groupByPersonaAppliesTo]
      : item?.appliesTo ? [...item.appliesTo] : undefined
    const source: StrategyFieldSource = {
      path,
      label: item?.label ?? path,
      value: readPath(config, path),
      source: overridden ? 'business-draft' : item?.source ?? 'platform-default',
      setBy: item?.setBy ?? fallbackSetBy,
      appliesTo,
      editable: item ? item.editableBy.includes('industry_ops') : false,
      isExampleGuardrail: item?.isExampleGuardrail ?? false,
      explanation: overridden ? '当前值来自尚未运行固定样例检查的本地演示草稿。' : item?.explanation ?? '平台示例默认值。',
    }
    return [path, source]
  })) as Record<ConfigPath, StrategyFieldSource>

  return { config, sources }
}
