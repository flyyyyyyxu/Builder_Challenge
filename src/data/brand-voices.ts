/**
 * 品牌说：合作品牌在答案卡里的官方表述，由商业化负责。
 * 只有对应的合作帖子通过 02 的筛选（允许合作内容、人群匹配、社区上限）时才出现，并始终带合作标识。
 * 品牌与文案均为虚构；不写功效承诺，防护范围以包装标注为准。
 */
export interface BrandVoice {
  /** The sponsored post this statement belongs to; the card shows it only when that post is eligible. */
  postId: string
  brand: string
  statement: string
}

export const BRAND_VOICES: BrandVoice[] = [
  {
    postId: 'skin-post-05',
    brand: '澄研清透防晒（虚构品牌）',
    statement: '为油皮夏季通勤设计的轻薄乳液质地，具体防护范围以包装标注为准。',
  },
]
