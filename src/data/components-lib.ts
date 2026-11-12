import type { ComponentDef } from '../types'

export const COMPONENTS: ComponentDef[] = [
  { id: 'conclusion', name: '结论条', status: 'existing', usedBy: ['skincare-shopping', 'home-cooking-steps'], supports: ['general-spectrum', 'cooking-summary'], description: '已有组件；结论内容仍需与引用来源关联。' },
  { id: 'persona-groups', name: '按肤质分组', status: 'existing', usedBy: ['skincare-shopping'], supports: ['oil-light-texture', 'oil-water-resistant', 'dry-moisturizing', 'sensitive-fragrance-free', 'makeup-compatible', 'outdoor-water-resistant', 'pilling-layer-check'], description: '护肤示例中的已有分组组件。' },
  { id: 'step-list', name: '步骤列表', status: 'existing', usedBy: ['skincare-shopping', 'home-cooking-steps'], supports: ['apply-first', 'apply-evenly', 'wait-film', 'reapply-by-instructions', 'rinse-sea-cucumber', 'cut-sea-cucumber', 'egg-water-ratio', 'strain-egg', 'remove-bubbles', 'steam-low-heat', 'cover-steamer', 'check-set', 'season-after-steaming', 'choose-steamer', 'avoid-cold-water', 'steam-in-batches', 'serve-warm'], description: '已有通用步骤组件，可按目标场景调整参数。' },
  { id: 'pitfall-card', name: '踩坑提醒', status: 'existing', usedBy: ['skincare-shopping', 'home-cooking-steps'], supports: ['pilling-pitfall', 'avoid-oversteaming'], description: '已有提醒组件，只呈现有来源支持的经验。' },
  { id: 'source-footer', name: '来源底栏与溯源', status: 'existing', usedBy: ['skincare-shopping', 'home-cooking-steps'], supports: [], description: '已有来源元信息展示与引用追踪能力示意，不背书原帖真实性。' },
  { id: 'parameter-distribution', name: '用量与等待时长参数条', status: 'planned', usedBy: ['skincare-usage'], supports: [], description: '待研发扩展点：把“用多少、等多久成膜”这类参数做成分布展示；不是平台已有组件，不计入复用收益。' },
]

export const EXISTING_COMPONENTS = COMPONENTS.filter((component) => component.status === 'existing')
