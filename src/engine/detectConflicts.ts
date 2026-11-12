import type { Conflict, StrategyConfig } from '../types'

export function detectConflicts(config: StrategyConfig): Conflict[] {
  if (config.guardrails.sponsoredPosition !== 'beforeConclusion') return []

  return [{
    id: 'example-sponsored-before-conclusion',
    itemKey: 'guardrails.sponsoredPosition',
    guardrail: {
      label: '商业内容不前置于答案结论（示例规则）',
      ownerTeam: '社区治理（示例）',
      ownerName: '示例规则负责人（虚构）',
      isExample: true,
    },
    message: '该调整提议会把商业内容放在结论之前，与示例护栏存在冲突。此结果只用于演示规则提示，不代表真实组织已配置该规则。',
    options: [
      { id: 'after-conclusion', label: '结论之后的明牌专区', note: '明确标注合作属性；需要规则负责人讨论确认。' },
      { id: 'related-entry', label: '改为相关商品入口', note: '将商品信息移至相关入口；需要业务与规则负责人讨论确认。' },
    ],
    action: 'notify_owner',
    status: 'needs_discussion',
  }]
}
