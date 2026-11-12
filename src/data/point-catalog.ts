import type { PointDefinition } from '../types'

export const POINT_CATALOG: PointDefinition[] = [
  { key: 'general-spectrum', text: '先确认标注的防护范围与使用场景是否匹配', componentId: 'conclusion', kind: 'shared', order: 1 },
  { key: 'oil-light-texture', text: '油皮可先试轻薄、成膜感较清爽的质地', componentId: 'persona-groups', kind: 'persona', persona: '油皮', order: 2, lead: '质地' },
  { key: 'oil-water-resistant', text: '户外或出汗场景可留意产品标注的防水属性', componentId: 'persona-groups', kind: 'persona', persona: '油皮', order: 3, lead: '场景' },
  { key: 'dry-moisturizing', text: '干皮可先试更滋润的乳液或霜状质地', componentId: 'persona-groups', kind: 'persona', persona: '干皮', order: 2, lead: '质地' },
  { key: 'sensitive-fragrance-free', text: '敏感肌可留意无香型，并以个人试用感受为准', componentId: 'persona-groups', kind: 'persona', persona: '敏感肌', order: 2, lead: '成分' },
  { key: 'makeup-compatible', text: '带妆使用可先小范围试用，观察与底妆的相容性', componentId: 'persona-groups', kind: 'persona', persona: '带妆', order: 2, lead: '带妆' },
  { key: 'outdoor-water-resistant', text: '户外长时间活动可结合产品说明考虑防水属性', componentId: 'persona-groups', kind: 'persona', persona: '户外', order: 2, lead: '防水' },
  { key: 'pilling-layer-check', text: '叠加底妆前先分层试用，观察是否搓泥', componentId: 'persona-groups', kind: 'persona', persona: '混合肌', order: 2, lead: '叠妆' },
  { key: 'pilling-pitfall', text: '有示例用户反馈与粉底叠加时出现搓泥；建议分层试用', componentId: 'pitfall-card', kind: 'pitfall', order: 4 },
  { key: 'apply-first', text: '先完成防晒涂抹，再进入底妆步骤', componentId: 'step-list', kind: 'step', persona: '油皮', order: 1, lead: '先防晒' },
  { key: 'apply-evenly', text: '将防晒均匀涂开，并按产品说明使用', componentId: 'step-list', kind: 'step', persona: '油皮', order: 2, lead: '涂均匀' },
  { key: 'wait-film', text: '等待防晒成膜后再叠加底妆', componentId: 'step-list', kind: 'step', persona: '油皮', order: 3, lead: '等成膜' },
  { key: 'reapply-by-instructions', text: '补涂频率结合产品说明、活动时长与出汗情况', componentId: 'step-list', kind: 'step', persona: '户外', order: 1, lead: '补涂' },
  { key: 'cooking-summary', text: '先处理海参，再调蛋液并分步蒸制', componentId: 'conclusion', kind: 'cooking', order: 1 },
  { key: 'rinse-sea-cucumber', text: '按食材状态清洗并处理海参', componentId: 'step-list', kind: 'cooking', order: 1 },
  { key: 'cut-sea-cucumber', text: '将海参切成适合入口的小段', componentId: 'step-list', kind: 'cooking', order: 2 },
  { key: 'egg-water-ratio', text: '蛋液与温水比例按口感调整，先从接近 1:1.5 试做', componentId: 'step-list', kind: 'cooking', order: 3 },
  { key: 'strain-egg', text: '蛋液过筛可减少较大的蛋筋与气泡', componentId: 'step-list', kind: 'cooking', order: 4 },
  { key: 'remove-bubbles', text: '静置或撇去表面泡沫，让表面更平整', componentId: 'step-list', kind: 'cooking', order: 5 },
  { key: 'steam-low-heat', text: '水开后转中小火，避免蒸汽过猛', componentId: 'step-list', kind: 'cooking', order: 6 },
  { key: 'cover-steamer', text: '容器可加盖或覆盖耐热保鲜膜并留排气口', componentId: 'step-list', kind: 'cooking', order: 7 },
  { key: 'check-set', text: '观察蛋液中心凝固状态，再决定是否延长时间', componentId: 'step-list', kind: 'cooking', order: 8 },
  { key: 'season-after-steaming', text: '蒸好后再按口味加入调味料', componentId: 'step-list', kind: 'cooking', order: 9 },
  { key: 'avoid-oversteaming', text: '蒸制过久可能让蛋羹口感变老，建议分段观察', componentId: 'pitfall-card', kind: 'pitfall', order: 10 },
  { key: 'choose-steamer', text: '不同器具受热不同，可先按自家蒸锅试做', componentId: 'step-list', kind: 'cooking', order: 11 },
  { key: 'avoid-cold-water', text: '避免直接加入过凉的水，先将蛋液搅匀', componentId: 'step-list', kind: 'cooking', order: 12 },
  { key: 'steam-in-batches', text: '容器较深时可分次检查中心凝固程度', componentId: 'step-list', kind: 'cooking', order: 13 },
  { key: 'serve-warm', text: '趁温热食用，调味可按个人口味调整', componentId: 'step-list', kind: 'cooking', order: 14 },
]

export const POINTS_BY_KEY = Object.fromEntries(POINT_CATALOG.map((point) => [point.key, point])) as Record<string, PointDefinition>
