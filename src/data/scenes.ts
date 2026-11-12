import type { Query, Scene } from '../types'

export const DEMO_AS_OF_DATE = '2026-11-12'

export const SCENES: Scene[] = [
  {
    id: 'skincare-shopping',
    vertical: '护肤',
    intent: '选购怎么选',
    sampleQuery: '油皮夏天防晒怎么选',
    queryId: 'skin-q1',
    category: '选购类',
    templateId: 'skincare-answer-template',
  },
  {
    id: 'home-cooking-steps',
    vertical: '家常菜',
    intent: '做法步骤',
    sampleQuery: '海参蒸蛋怎么做',
    queryId: 'cook-q1',
    category: '做法类',
    templateId: 'skincare-answer-template',
  },
]

export const MAIN_QUERY: Query = {
  id: 'skin-q1',
  sceneId: 'skincare-shopping',
  text: '油皮夏天防晒怎么选',
  category: '选购类',
  persona: '油皮',
}

export const COOKING_QUERY: Query = {
  id: 'cook-q1',
  sceneId: 'home-cooking-steps',
  text: '海参蒸蛋怎么做',
  category: '做法类',
}
