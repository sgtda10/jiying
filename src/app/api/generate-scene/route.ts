import { NextRequest, NextResponse } from 'next/server'
import { generateScene } from '@/lib/siliconflow'

/**
 * POST /api/generate-scene
 * 接收透明底商品图 + 场景描述 → 调用 Qwen-Image-Edit → 返回场景图
 *
 * 请求：multipart/form-data
 *   - image: 商品透明底PNG
 *   - prompt: 场景描述
 *   - size: 可选，图片尺寸，默认 1024x1024
 * 响应：JSON { success, imageUrl?, inferenceTime?, error? }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const prompt = formData.get('prompt') as string | null
    const size = (formData.get('size') as string) || '1024x1024'

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '请上传商品图片' },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请提供场景描述' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { success: false, error: '仅支持 JPG/PNG/WebP 格式' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '图片大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 转换为 base64
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const mimeType = imageFile.type || 'image/png'
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`

    // 调用场景图生成
    const result = await generateScene({
      imageBase64: base64,
      prompt,
      size,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('场景图生成API异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请重试' },
      { status: 500 }
    )
  }
}
