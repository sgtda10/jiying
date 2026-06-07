import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/remove-bg
 * 接收图片 → 调用 Qwen-Image-Edit 抠图 → 返回透明背景PNG
 *
 * 不依赖任何外部服务，只用 SiliconFlow API
 * 请求：multipart/form-data，字段 "image" 为图片文件
 * 响应：透明背景PNG图片（Content-Type: image/png）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '请上传图片文件' },
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

    // 验证文件大小（最大5MB，SiliconFlow限制）
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '图片大小不能超过5MB' },
        { status: 400 }
      )
    }

    // 1. 先尝试 rembg 本地服务（如果有）
    const rembgUrl = process.env.REMBG_API_URL
    if (rembgUrl) {
      try {
        const rembgFormData = new FormData()
        rembgFormData.append('file', imageFile)
        const rembgResponse = await fetch(`${rembgUrl}/api/remove`, {
          method: 'POST',
          body: rembgFormData,
          signal: AbortSignal.timeout(15000), // 15秒超时
        })
        if (rembgResponse.ok) {
          const resultBuffer = Buffer.from(await rembgResponse.arrayBuffer())
          return new NextResponse(resultBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Content-Disposition': 'attachment; filename="removed-bg.png"',
            },
          })
        }
      } catch {
        // rembg 不可用，回退到 SiliconFlow
        console.log('rembg服务不可用，回退到SiliconFlow')
      }
    }

    // 2. 使用 SiliconFlow Qwen-Image-Edit 抠图
    const apiKey = process.env.SILICONFLOW_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '未配置 SILICONFLOW_API_KEY' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'

    // 转换图片为 base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const mimeType = imageFile.type || 'image/png'
    const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`

    // 调用 Qwen-Image-Edit：让AI把背景变透明
    const sfResponse = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit-2509',
        prompt: 'Remove the background completely, make it transparent, keep only the product with clean edges, no background at all',
        image: base64Image,
        image_size: '1024x1024',
        num_inference_steps: 4,
        batch_size: 1,
      }),
    })

    if (!sfResponse.ok) {
      const errorData = await sfResponse.json().catch(() => ({}))
      console.error('SiliconFlow抠图错误:', errorData)
      return NextResponse.json(
        { success: false, error: `抠图失败: ${(errorData as {message?: string}).message || sfResponse.status}` },
        { status: 500 }
      )
    }

    const sfData = await sfResponse.json()
    const resultImageUrl = sfData.images?.[0]?.url

    if (!resultImageUrl) {
      return NextResponse.json(
        { success: false, error: '抠图失败: 未返回图片' },
        { status: 500 }
      )
    }

    // 下载结果图片
    const imageResponse = await fetch(resultImageUrl)
    const resultBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // 返回透明背景PNG
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
      },
    })
  } catch (error) {
    console.error('抠图API异常:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误，请重试' },
      { status: 500 }
    )
  }
}
