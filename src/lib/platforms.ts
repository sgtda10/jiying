/**
 * 即影 - 9大电商平台规格配置
 * 数据来源：各平台官方卖家帮助文档
 */

export interface PlatformSpec {
  id: string
  name: string
  region: 'domestic' | 'overseas'
  icon: string
  recommendedSize: number
  minSize: number
  aspectRatio: string
  maxFileSize: number // MB
  format: string[]
  requireWhiteBg: 'mandatory' | 'recommended' | 'optional'
  productRatio: number // 商品占画面最小比例
  allowText: boolean
  allowWatermark: boolean
  maxTextRatio?: number // 文字占画面最大比例
  specialRules: string[]
}

export const PLATFORMS: PlatformSpec[] = [
  // ===== 国内平台 =====
  {
    id: 'pinduoduo',
    name: '拼多多',
    region: 'domestic',
    icon: '🛒',
    recommendedSize: 750,
    minSize: 480,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPG', 'PNG'],
    requireWhiteBg: 'mandatory', // 标品类目强制
    productRatio: 0.67,
    allowText: true,
    allowWatermark: false,
    specialRules: ['禁止极限词（如"全网最低""史上最强"）', '系统自动A/B测试排序主图', '最多10张主图'],
  },
  {
    id: 'taobao',
    name: '淘宝/天猫',
    region: 'domestic',
    icon: '🛍️',
    recommendedSize: 800,
    minSize: 300,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPG', 'PNG'],
    requireWhiteBg: 'mandatory', // 天猫标品类目强制
    productRatio: 0.6,
    allowText: true,
    allowWatermark: false,
    maxTextRatio: 0.3,
    specialRules: ['文字面积不超过30%', '天猫非白底图可能降权', '3-9张主图'],
  },
  {
    id: 'douyin',
    name: '抖音小店',
    region: 'domestic',
    icon: '🎵',
    recommendedSize: 800,
    minSize: 480,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPG', 'PNG'],
    requireWhiteBg: 'recommended', // 部分类目要求
    productRatio: 0.6,
    allowText: true,
    allowWatermark: false,
    specialRules: ['禁止平台外引流信息（二维码/联系方式）', '美妆/食品首图须展示实物', '最多5张主图'],
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    region: 'domestic',
    icon: '📕',
    recommendedSize: 800,
    minSize: 300,
    aspectRatio: '1:1',
    maxFileSize: 10,
    format: ['JPG', 'PNG'],
    requireWhiteBg: 'recommended', // 建议准备白底版审核用
    productRatio: 0.5,
    allowText: true,
    allowWatermark: false,
    specialRules: ['场景图点击率>白底图', '建议准备两套：白底版(审核)+场景版(展示)', '主图需与笔记风格统一'],
  },
  {
    id: 'jd',
    name: '京东',
    region: 'domestic',
    icon: '🏪',
    recommendedSize: 800,
    minSize: 200,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPG', 'PNG', 'GIF'],
    requireWhiteBg: 'mandatory', // 自营强制
    productRatio: 0.6,
    allowText: true,
    allowWatermark: false,
    specialRules: ['唯一支持GIF动图', '自营商品白底是基础门槛', '清晰度影响搜索权重'],
  },
  // ===== 海外平台 =====
  {
    id: 'amazon',
    name: 'Amazon',
    region: 'overseas',
    icon: '📦',
    recommendedSize: 1600,
    minSize: 1000,
    aspectRatio: '1:1',
    maxFileSize: 10,
    format: ['JPEG', 'PNG', 'TIFF'],
    requireWhiteBg: 'mandatory', // 极严格
    productRatio: 0.85,
    allowText: false,
    allowWatermark: false,
    specialRules: [
      '白底RGB必须严格(255,255,255)，RGB250也会被拒',
      '禁止任何文字/Logo/水印',
      '商品占比≥85%',
      'AI扫描系统检测不合规图片',
      '最多9张图片',
    ],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    region: 'overseas',
    icon: '🦐',
    recommendedSize: 1024,
    minSize: 500,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPEG', 'PNG'],
    requireWhiteBg: 'recommended',
    productRatio: 0.7,
    allowText: true,
    allowWatermark: true,
    specialRules: ['允许信息图和水印', '算法优先推荐产品填充比高、明亮干净的图片', '最多8-9张图片'],
  },
  {
    id: 'lazada',
    name: 'Lazada',
    region: 'overseas',
    icon: '🔵',
    recommendedSize: 2000,
    minSize: 500,
    aspectRatio: '1:1',
    maxFileSize: 5,
    format: ['JPG'],
    requireWhiteBg: 'mandatory',
    productRatio: 0.8,
    allowText: false,
    allowWatermark: false,
    specialRules: [
      '禁止水印/Logo/文字',
      '产品须拆开包装正面拍摄',
      '商品占比≥80%',
      '最多8-9张图片',
    ],
  },
  {
    id: 'temu',
    name: 'Temu',
    region: 'overseas',
    icon: '🛍️',
    recommendedSize: 1600,
    minSize: 800,
    aspectRatio: '1:1',
    maxFileSize: 10,
    format: ['JPEG', 'PNG'],
    requireWhiteBg: 'mandatory',
    productRatio: 0.85,
    allowText: false,
    allowWatermark: false,
    specialRules: [
      '白底RGB严格要求(255,255,255)',
      '禁止任何文字/Logo/水印',
      '商品占比≥85%',
      '图片清晰度影响流量分配',
    ],
  },
]

/** 根据平台ID获取规格 */
export function getPlatformSpec(id: string): PlatformSpec | undefined {
  return PLATFORMS.find(p => p.id === id)
}

/** 获取国内平台 */
export function getDomesticPlatforms(): PlatformSpec[] {
  return PLATFORMS.filter(p => p.region === 'domestic')
}

/** 获取海外平台 */
export function getOverseasPlatforms(): PlatformSpec[] {
  return PLATFORMS.filter(p => p.region === 'overseas')
}
