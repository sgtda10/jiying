/**
 * 即影 - 硅基流动 SiliconFlow API 客户端
 * 场景图生成使用 Qwen/Qwen-Image-Edit-2509（图片编辑模型）
 */

const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''
const SILICONFLOW_BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'

export interface GenerateSceneInput {
  /** 商品透明底图的 base64（带 data:image/xxx;base64, 前缀） */
  imageBase64: string
  /** 场景描述 prompt */
  prompt: string
  /** 图片尺寸，默认 1024x1024 */
  size?: string
  /** 推理步数，默认 4（Qwen-Image-Edit 只需4步） */
  steps?: number
}

export interface GenerateSceneResult {
  success: boolean
  /** 生成的场景图临时URL（7天有效期） */
  imageUrl?: string
  /** 推理耗时（秒） */
  inferenceTime?: number
  error?: string
}

/**
 * 场景图模板定义
 */
export interface SceneTemplate {
  id: string
  name: string
  icon: string
  category: '服装' | '饰品' | '家居' | '鞋包' | '美妆' | '通用'
  prompt: string
}

/** 预设场景模板 */
export const SCENE_TEMPLATES: SceneTemplate[] = [
  // ===== 服装类 =====
  {
    id: 'studio-minimal',
    name: '极简白棚',
    icon: '📷',
    category: '服装',
    prompt: 'Place the clothing item on a pure white studio background with soft studio lighting, clean minimal e-commerce product photography, no shadows, professional fashion presentation',
  },
  {
    id: 'coffee-shop',
    name: '咖啡厅',
    icon: '☕',
    category: '服装',
    prompt: 'Place the clothing item in a cozy modern coffee shop interior, warm ambient lighting, lifestyle fashion photography, natural pose on a chair, bokeh background',
  },
  {
    id: 'urban-street',
    name: '城市街头',
    icon: '🏙️',
    category: '服装',
    prompt: 'Place the clothing item on a fashionable urban street, modern city architecture background, bright daylight, street style fashion photography, editorial quality',
  },
  {
    id: 'beach',
    name: '海滩度假',
    icon: '🏖️',
    category: '服装',
    prompt: 'Place the clothing item in a tropical beach setting, golden hour sunlight, ocean waves background, resort wear fashion photography, natural and relaxed vibe',
  },
  {
    id: 'bedroom',
    name: '温馨卧室',
    icon: '🛏️',
    category: '服装',
    prompt: 'Place the clothing item in a bright cozy bedroom with natural window light, soft beige and white decor, lifestyle flat lay or hanger display, warm and inviting',
  },
  {
    id: 'garden',
    name: '花园',
    icon: '🌿',
    category: '服装',
    prompt: 'Place the clothing item in a lush green garden, soft natural sunlight through leaves, floral background, romantic fashion photography, spring/summer vibe',
  },
  // ===== 饰品/配件 =====
  {
    id: 'marble-surface',
    name: '大理石台面',
    icon: '🪨',
    category: '饰品',
    prompt: 'Place the accessory on an elegant white marble surface, soft directional lighting, luxury product photography, shallow depth of field, premium jewelry display',
  },
  {
    id: 'velvet-box',
    name: '丝绒展示',
    icon: '💎',
    category: '饰品',
    prompt: 'Place the accessory on a luxurious dark velvet surface, dramatic studio lighting, jewelry product photography, sparkling highlights, premium brand look',
  },
  {
    id: 'wooden-table',
    name: '木质桌面',
    icon: '🪵',
    category: '饰品',
    prompt: 'Place the accessory on a natural oak wood table, warm sunlight, organic lifestyle product photography, minimalist Scandinavian style',
  },
  // ===== 家居类 =====
  {
    id: 'living-room',
    name: '现代客厅',
    icon: '🛋️',
    category: '家居',
    prompt: 'Place the home item in a bright modern living room interior, natural window lighting, interior design photography, stylish and cozy atmosphere, magazine quality',
  },
  {
    id: 'kitchen',
    name: '厨房陈列',
    icon: '🍳',
    category: '家居',
    prompt: 'Place the home item in a clean modern kitchen setting, bright overhead lighting, kitchen product photography, organized and tidy, warm home feel',
  },
  {
    id: 'desk-setup',
    name: '桌面布置',
    icon: '💻',
    category: '家居',
    prompt: 'Place the item on a clean modern desk setup, soft desk lamp lighting, workspace product photography, organized aesthetic, productivity vibe',
  },
  // ===== 鞋包 =====
  {
    id: 'shoe-display',
    name: '鞋品展示',
    icon: '👟',
    category: '鞋包',
    prompt: 'Place the footwear on a clean white pedestal, professional studio lighting, shoe product photography, 45-degree angle view, premium athletic/lifestyle presentation',
  },
  {
    id: 'bag-display',
    name: '包袋陈列',
    icon: '👜',
    category: '鞋包',
    prompt: 'Place the bag on a minimalist display stand, soft studio lighting, luxury bag product photography, elegant and premium presentation, fashion editorial style',
  },
  // ===== 美妆 =====
  {
    id: 'beauty-studio',
    name: '美妆光影',
    icon: '💄',
    category: '美妆',
    prompt: 'Place the beauty product on a reflective glass surface, soft pink and gold lighting, beauty product photography, clean and fresh, spa-like atmosphere',
  },
  {
    id: 'natural-botanical',
    name: '自然植萃',
    icon: '🌱',
    category: '美妆',
    prompt: 'Place the beauty product among natural botanical elements, fresh green leaves and flowers, soft natural lighting, clean beauty photography, organic skincare vibe',
  },
  // ===== 通用 =====
  {
    id: 'white-backdrop',
    name: '纯白背景',
    icon: '⬜',
    category: '通用',
    prompt: 'Place the product on a seamless pure white background, professional studio lighting, clean e-commerce product photography, no distractions, catalog quality',
  },
  {
    id: 'gradient-bg',
    name: '渐变背景',
    icon: '🎨',
    category: '通用',
    prompt: 'Place the product on a soft pastel gradient background, professional studio lighting, creative product photography, aesthetic and modern, Instagram-worthy',
  },
  {
    id: 'concrete',
    name: '工业水泥',
    icon: '🏗️',
    category: '通用',
    prompt: 'Place the product on a textured concrete surface, directional lighting, industrial chic product photography, urban modern aesthetic, edgy brand style',
  },
]

/**
 * 生成场景图
 * 使用 Qwen-Image-Edit-2509 模型，将商品图放入指定场景
 */
export async function generateScene(input: GenerateSceneInput): Promise<GenerateSceneResult> {
  const { imageBase64, prompt, size = '1024x1024', steps = 4 } = input

  try {
    const response = await fetch(`${SILICONFLOW_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit-2509',
        prompt,
        image: imageBase64,
        image_size: size,
        num_inference_steps: steps,
        batch_size: 1,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: `场景图生成失败: ${data.message || response.status}`,
      }
    }

    const imageUrl = data.images?.[0]?.url
    if (!imageUrl) {
      return { success: false, error: '场景图生成失败: 未返回图片' }
    }

    return {
      success: true,
      imageUrl,
      inferenceTime: data.timings?.inference,
    }
  } catch (error) {
    return {
      success: false,
      error: `场景图服务异常: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 根据品类获取推荐的场景模板
 */
export function getTemplatesByCategory(category: string): SceneTemplate[] {
  if (category === '全部' || category === '通用') {
    return SCENE_TEMPLATES
  }
  return SCENE_TEMPLATES.filter(t => t.category === category || t.category === '通用')
}

/** 所有场景类别 */
export const SCENE_CATEGORIES = ['全部', '服装', '饰品', '家居', '鞋包', '美妆', '通用'] as const
