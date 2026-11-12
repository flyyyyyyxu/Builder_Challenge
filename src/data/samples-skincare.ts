import type { Sample } from '../types'

const annotation = '场景负责人独立标注（演示数据，虚构）'

export const SKINCARE_SAMPLES: Sample[] = [
  { id: 'skin-q1', sceneId: 'skincare-shopping', text: '油皮夏天防晒怎么选', category: '选购类', persona: '油皮', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'oil-light-texture', label: '油皮可优先试轻薄质地' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q2', sceneId: 'skincare-shopping', text: '干皮防晒怎么选', category: '选购类', persona: '干皮', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'dry-moisturizing', label: '干皮可优先试滋润质地' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q3', sceneId: 'skincare-shopping', text: '敏感肌通勤防晒怎么选', category: '选购类', persona: '敏感肌', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'sensitive-fragrance-free', label: '留意无香型并按试用感受选择' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q4', sceneId: 'skincare-shopping', text: '带妆时防晒怎么选', category: '选购类', persona: '带妆', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'makeup-compatible', label: '关注与底妆相容性' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q5', sceneId: 'skincare-shopping', text: '户外活动防晒怎么选', category: '选购类', persona: '户外', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'outdoor-water-resistant', label: '结合活动场景留意防水属性' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q6', sceneId: 'skincare-shopping', text: '防晒怎么选才能少搓泥', category: '选购类', persona: '混合肌', expectedPoints: [{ key: 'general-spectrum', label: '确认防护范围匹配场景' }, { key: 'pilling-layer-check', label: '分层试用观察相容性' }, { key: 'pilling-pitfall', label: '提示用户反馈的搓泥踩坑经验' }], annotatedBy: annotation, annotationNote: '期望要点独立于答案输出维护；此为概念样例。' },
  { id: 'skin-q7', sceneId: 'skincare-shopping', text: '防晒和粉底的先后顺序', category: '用法类', persona: '油皮', expectedPoints: [{ key: 'apply-first', label: '先完成防晒涂抹' }, { key: 'apply-evenly', label: '均匀涂开并遵循产品说明' }, { key: 'wait-film', label: '等待成膜后再叠加底妆' }], annotatedBy: annotation, annotationNote: '这是刻意构造的回归样例；“等待成膜”独立标注。' },
  { id: 'skin-q8', sceneId: 'skincare-shopping', text: '户外防晒怎么补涂', category: '用法类', persona: '户外', expectedPoints: [{ key: 'reapply-by-instructions', label: '结合产品说明与活动情况补涂' }], annotatedBy: annotation, annotationNote: '边界样例；期望要点独立标注。' },
]
