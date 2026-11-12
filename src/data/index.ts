export { COMPONENTS, EXISTING_COMPONENTS } from './components-lib'
export { POINT_CATALOG, POINTS_BY_KEY } from './point-catalog'
export { SKINCARE_POSTS } from './posts-skincare'
export { COOKING_POSTS } from './posts-cooking'
export { SKINCARE_SAMPLES } from './samples-skincare'
export { DEMO_AS_OF_DATE, STALE_REFERENCE_DAYS, SCENES, MAIN_QUERY, COOKING_QUERY } from './scenes'
export { BASELINE_CONFIG, REGRESSION_DEMO_CONFIG, FIXED_SCOPE_CONFIG } from './strategy-config'
export { STRATEGY_ITEMS, STRATEGY_ITEMS_BY_PATH } from './strategy-items'
export { SKINCARE_TEMPLATE, USAGE_REUSE_TARGET, CAPABILITIES, TEMPLATE_LIBRARY, TEMPLATE_PINNED_VERSION, TEMPLATE_DRAFT_VERSION, TEMPLATE_VERSION_HISTORY } from './templates'

export const DATA_PROVENANCE = {
  kind: 'local mock data' as const,
  statement: '帖子、作者、时间、互动数与组织信息均为演示用虚构数据，不代表真实帖子、真实用户或线上事实。',
  expectedPoints: '固定样例期望要点由场景负责人角色独立标注（演示标注），不从规则引擎输出生成。',
  evaluationBoundary: '规则模拟原型，仅检查固定 mock 数据上的策略影响，不代表语义判断准确率、真实内容真实性或线上收益。',
  traceabilityBoundary: '来源可追踪、有依据，不代表平台为原帖真实性背书。',
}
