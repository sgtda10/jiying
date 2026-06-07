/**
 * 即影 - rembg 抠图 API 客户端
 * rembg自部署HTTP服务：rembg s -p 8000
 * API文档：http://localhost:8000/api
 */

const REMBG_API_URL = process.env.REMBG_API_URL || 'http://localhost:8000'

export interface RemoveBgResult {
  success: boolean
  imageData?: Buffer
  error?: string
}

/**
 * 调用 rembg HTTP API 移除图片背景
 * 注意：rembg要求的字段名是"file"而非"image"
 */
export async function removeBackground(imageBuffer: Buffer): Promise<RemoveBgResult> {
  try {
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', blob, 'image.png')

    const response = await fetch(`${REMBG_API_URL}/api/remove`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `抠图失败: ${response.status} ${errorText}` }
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer())
    return { success: true, imageData: resultBuffer }
  } catch (error) {
    return {
      success: false,
      error: `抠图服务异常: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 检测 rembg 服务是否可用
 */
export async function checkRembgHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${REMBG_API_URL}/`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
