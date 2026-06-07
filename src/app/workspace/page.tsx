'use client'

import { useState, useRef, useCallback } from 'react'
import { PLATFORMS, getPlatformSpec } from '@/lib/platforms'
import { SCENE_TEMPLATES, SCENE_CATEGORIES } from '@/lib/siliconflow'
import type { PlatformSpec } from '@/lib/platforms'
import type { SceneTemplate } from '@/lib/siliconflow'

type Step = 'upload' | 'processing' | 'result' | 'generating' | 'export' | 'scene-result'
type Mode = 'whitebg' | 'scene'

interface GeneratedImage {
  platformId: string
  platformName: string
  platformIcon: string
  size: number
  blobUrl: string
  format: string
}

export default function WorkspacePage() {
  // 流程状态
  const [step, setStep] = useState<Step>('upload')
  const [mode, setMode] = useState<Mode>('whitebg')
  const [error, setError] = useState<string | null>(null)

  // 图片状态
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null)
  const [processingTime, setProcessingTime] = useState(0)

  // 白底图状态
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['pinduoduo'])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  // 场景图状态
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [selectedTemplate, setSelectedTemplate] = useState<SceneTemplate | null>(null)
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null)
  const [sceneInferenceTime, setSceneInferenceTime] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ===== 上传图片并抠图 =====
  const handleImageUpload = async (file: File) => {
    setError(null)
    setStep('processing')
    setOriginalFileName(file.name.replace(/\.[^.]+$/, ''))
    setOriginalImage(URL.createObjectURL(file))
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '抠图失败')
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setRemovedBgImage(imageUrl)
      setProcessingTime(Number(((Date.now() - startTime) / 1000).toFixed(1)))
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '抠图失败，请重试')
      setStep('upload')
    }
  }

  // ===== 白底图：Canvas合成 =====
  const generateWhiteBgImages = useCallback(async () => {
    if (!removedBgImage || selectedPlatforms.length === 0) return
    setStep('generating')

    try {
      const img = await loadImage(removedBgImage)
      const results: GeneratedImage[] = []

      for (const platformId of selectedPlatforms) {
        const spec = getPlatformSpec(platformId)
        if (!spec) continue

        const format = spec.format[0] === 'JPEG' || spec.format[0] === 'JPG' ? 'image/jpeg' : 'image/png'
        const ext = format === 'image/jpeg' ? 'jpg' : 'png'

        const blobUrl = await compositeWhiteBg(img, spec.recommendedSize, format, 0.92)

        const prevUrl = results.find(r => r.platformId === platformId)?.blobUrl
        if (prevUrl) URL.revokeObjectURL(prevUrl)

        results.push({
          platformId,
          platformName: spec.name,
          platformIcon: spec.icon,
          size: spec.recommendedSize,
          blobUrl,
          format: ext,
        })
      }

      setGeneratedImages(results)
      setStep('export')
    } catch {
      setError('白底图生成失败，请重试')
      setStep('result')
    }
  }, [removedBgImage, selectedPlatforms])

  // ===== 场景图：调用AI生成 =====
  const generateSceneImage = useCallback(async () => {
    if (!removedBgImage || !selectedTemplate) return
    setStep('generating')
    setError(null)

    try {
      const responseBlob = await fetch(removedBgImage).then(r => r.blob())
      const formData = new FormData()
      formData.append('image', responseBlob, 'product.png')
      formData.append('prompt', selectedTemplate.prompt)

      const response = await fetch('/api/generate-scene', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || '场景图生成失败')
      }

      setSceneImageUrl(data.imageUrl)
      setSceneInferenceTime(data.inferenceTime || 0)
      setStep('scene-result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '场景图生成失败，请重试')
      setStep('result')
    }
  }, [removedBgImage, selectedTemplate])

  // ===== 工具函数 =====
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const downloadImage = (blobUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadAll = () => {
    generatedImages.forEach((img, i) => {
      setTimeout(() => {
        downloadImage(img.blobUrl, `即影_${originalFileName || '商品图'}_${img.platformName}_${img.size}x${img.size}.${img.format}`)
      }, i * 300)
    })
  }

  const resetAll = () => {
    if (originalImage) URL.revokeObjectURL(originalImage)
    if (removedBgImage) URL.revokeObjectURL(removedBgImage)
    generatedImages.forEach(img => URL.revokeObjectURL(img.blobUrl))
    setStep('upload')
    setOriginalImage(null)
    setRemovedBgImage(null)
    setGeneratedImages([])
    setOriginalFileName('')
    setError(null)
    setProcessingTime(0)
    setSceneImageUrl(null)
    setSelectedTemplate(null)
  }

  const backToSelect = () => {
    generatedImages.forEach(img => URL.revokeObjectURL(img.blobUrl))
    setGeneratedImages([])
    setSceneImageUrl(null)
    setSelectedTemplate(null)
    setStep('result')
  }

  // 筛选场景模板
  const filteredTemplates = selectedCategory === '全部'
    ? SCENE_TEMPLATES
    : SCENE_TEMPLATES.filter(t => t.category === selectedCategory || t.category === '通用')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">即影</a>
            <span className="hidden sm:inline text-sm text-gray-400">|</span>
            <span className="hidden sm:inline text-sm text-gray-500">AI电商商品图工具</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            {step !== 'upload' && (
              <button onClick={resetAll} className="text-gray-500 hover:text-gray-700 transition-colors">
                ← 重新开始
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ===== 步骤1：上传图片 ===== */}
        {step === 'upload' && (
          <UploadStep
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            error={error}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />
        )}

        {/* ===== 步骤2：抠图中 ===== */}
        {step === 'processing' && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="animate-spin text-6xl mb-6">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI正在抠图...</h2>
            <p className="text-gray-500">通常只需1-3秒，请稍候</p>
          </div>
        )}

        {/* ===== 步骤3：抠图结果 + 双模式选择 ===== */}
        {step === 'result' && removedBgImage && (
          <div className="space-y-6">
            {/* 模式切换 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">抠图完成 ✅ {processingTime}秒</h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('whitebg')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'whitebg' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📐 白底图适配
                </button>
                <button
                  onClick={() => setMode('scene')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'scene' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✨ AI场景图
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左侧：图片对比 */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">原图</div>
                    <img src={originalImage!} alt="原图" className="w-full aspect-square object-contain p-4" />
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-medium text-gray-600">抠图结果 (透明底)</div>
                    <div
                      className="w-full aspect-square p-4"
                      style={{
                        backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)',
                        backgroundSize: '20px 20px',
                      }}
                    >
                      <img src={removedBgImage} alt="抠图结果" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={removedBgImage}
                    download={`即影_${originalFileName || '抠图'}_透明底.png`}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
                  >
                    💾 下载透明底PNG
                  </a>
                  <button onClick={resetAll} className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    重新上传
                  </button>
                </div>
              </div>

              {/* 右侧：模式面板 */}
              {mode === 'whitebg' ? (
                <WhiteBgPanel
                  selectedPlatforms={selectedPlatforms}
                  togglePlatform={togglePlatform}
                  onGenerate={generateWhiteBgImages}
                />
              ) : (
                <ScenePanel
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  filteredTemplates={filteredTemplates}
                  onGenerate={generateSceneImage}
                />
              )}
            </div>
          </div>
        )}

        {/* ===== 白底图生成中 ===== */}
        {step === 'generating' && mode === 'whitebg' && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="animate-spin text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">正在生成 {selectedPlatforms.length} 个平台的白底图...</h2>
            <p className="text-gray-500">Canvas合成白底 + 尺寸适配，很快就好</p>
          </div>
        )}

        {/* ===== 场景图生成中 ===== */}
        {step === 'generating' && mode === 'scene' && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="animate-spin text-6xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI正在生成场景图...</h2>
            <p className="text-gray-500">调用 Qwen-Image-Edit，约5-10秒</p>
            {selectedTemplate && (
              <p className="text-sm text-blue-500 mt-2">{selectedTemplate.icon} {selectedTemplate.name}</p>
            )}
          </div>
        )}

        {/* ===== 白底图导出 ===== */}
        {step === 'export' && generatedImages.length > 0 && (
          <WhiteBgExport
            generatedImages={generatedImages}
            originalFileName={originalFileName}
            onDownloadAll={downloadAll}
            onBack={backToSelect}
            onDownload={downloadImage}
          />
        )}

        {/* ===== 场景图结果 ===== */}
        {step === 'scene-result' && sceneImageUrl && (
          <SceneResult
            sceneImageUrl={sceneImageUrl}
            templateName={selectedTemplate?.name || ''}
            templateIcon={selectedTemplate?.icon || ''}
            inferenceTime={sceneInferenceTime}
            originalFileName={originalFileName}
            onBack={backToSelect}
            onRegenerate={generateSceneImage}
          />
        )}
      </main>

      {/* 全局错误提示 */}
      {error && step !== 'upload' && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm shadow-lg max-w-sm z-50">
          <button onClick={() => setError(null)} className="float-right ml-2 text-red-400 hover:text-red-600">✕</button>
          ❌ {error}
        </div>
      )}
    </div>
  )
}

// ===== 子组件 =====

function UploadStep({ onDrop, onClick, error, fileInputRef, onFileChange }: {
  onDrop: (e: React.DragEvent) => void
  onClick: () => void
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">上传商品照片</h2>
      <p className="text-gray-500 mb-8">拍一张实物照，AI帮你10秒出专业商品图</p>

      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={onClick}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <div className="text-6xl mb-4">📸</div>
        <p className="text-lg font-medium text-gray-700 mb-2">点击上传或拖拽图片到这里</p>
        <p className="text-sm text-gray-400">支持 JPG / PNG / WebP，最大 10MB</p>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} className="hidden" />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">❌ {error}</div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-700 font-medium mb-2">💡 拍摄建议</p>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• 在光线充足的地方拍摄，避免阴影</li>
          <li>• 商品居中，尽量占画面主体</li>
          <li>• 背景简洁（纯色/白色最佳），AI抠图更精准</li>
        </ul>
      </div>
    </div>
  )
}

function WhiteBgPanel({ selectedPlatforms, togglePlatform, onGenerate }: {
  selectedPlatforms: string[]
  togglePlatform: (id: string) => void
  onGenerate: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">选择目标平台</h3>
        <p className="text-sm text-gray-500">勾选后自动生成合规白底图</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">🇨🇳 国内平台</p>
        {PLATFORMS.filter(p => p.region === 'domestic').map(p => (
          <PlatformCheckbox key={p.id} platform={p} checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">🌏 海外平台</p>
        {PLATFORMS.filter(p => p.region === 'overseas').map(p => (
          <PlatformCheckbox key={p.id} platform={p} checked={selectedPlatforms.includes(p.id)} onChange={() => togglePlatform(p.id)} />
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={selectedPlatforms.length === 0}
        className="w-full py-3.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        🎯 生成 {selectedPlatforms.length} 个平台白底图
      </button>
    </div>
  )
}

function PlatformCheckbox({ platform, checked, onChange }: {
  platform: PlatformSpec
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
      checked ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded text-blue-600 focus:ring-blue-500" />
      <span className="text-lg">{platform.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm">{platform.name}</div>
        <div className="text-xs text-gray-400">{platform.recommendedSize}×{platform.recommendedSize}px</div>
      </div>
      {platform.requireWhiteBg === 'mandatory' && (
        <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded whitespace-nowrap">需白底</span>
      )}
    </label>
  )
}

function ScenePanel({ selectedCategory, setSelectedCategory, selectedTemplate, setSelectedTemplate, filteredTemplates, onGenerate }: {
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  selectedTemplate: SceneTemplate | null
  setSelectedTemplate: (t: SceneTemplate) => void
  filteredTemplates: SceneTemplate[]
  onGenerate: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">选择场景模板</h3>
        <p className="text-sm text-gray-500">AI自动将商品融入场景</p>
      </div>

      {/* 品类筛选 */}
      <div className="flex flex-wrap gap-1.5">
        {SCENE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 模板卡片 */}
      <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">{template.icon}</div>
            <div className="text-sm font-medium text-gray-900">{template.name}</div>
            <div className="text-[10px] text-gray-400">{template.category}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={!selectedTemplate}
        className="w-full py-3.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        ✨ {selectedTemplate ? `生成「${selectedTemplate.name}」场景图` : '请先选择场景模板'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        ⚡ AI场景图约需5-10秒 | 每次消耗约¥0.03
      </p>
    </div>
  )
}

function WhiteBgExport({ generatedImages, originalFileName, onDownloadAll, onBack, onDownload }: {
  generatedImages: GeneratedImage[]
  originalFileName: string
  onDownloadAll: () => void
  onBack: () => void
  onDownload: (url: string, name: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">导出白底图</h2>
          <p className="text-sm text-gray-500 mt-1">已为 {generatedImages.length} 个平台生成合规白底图</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← 调整平台
          </button>
          <button onClick={onDownloadAll} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
            📦 一键下载全部
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {generatedImages.map(img => {
          const spec = getPlatformSpec(img.platformId)
          return (
            <div key={img.platformId} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{img.platformIcon}</span>
                  <span className="text-xs font-medium text-gray-700 truncate">{img.platformName}</span>
                </div>
                {spec?.requireWhiteBg === 'mandatory' && (
                  <span className="text-[10px] bg-green-50 text-green-600 px-1 py-0.5 rounded whitespace-nowrap">✓ 合规</span>
                )}
              </div>
              <div className="aspect-square bg-white p-3 flex items-center justify-center">
                <img src={img.blobUrl} alt={img.platformName} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="px-3 py-2 bg-gray-50 border-t flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{img.size}×{img.size} · {img.format.toUpperCase()}</span>
                <button
                  onClick={() => onDownload(img.blobUrl, `即影_${originalFileName || '商品图'}_${img.platformName}_${img.size}x${img.size}.${img.format}`)}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors font-medium"
                >
                  ⬇ 下载
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SceneResult({ sceneImageUrl, templateName, templateIcon, inferenceTime, originalFileName, onBack, onRegenerate }: {
  sceneImageUrl: string
  templateName: string
  templateIcon: string
  inferenceTime: number
  originalFileName: string
  onBack: () => void
  onRegenerate: () => void
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">场景图生成完成</h2>
          <p className="text-sm text-gray-500 mt-1">
            {templateIcon} {templateName} · {inferenceTime > 0 ? `${inferenceTime.toFixed(1)}秒` : '完成'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            ← 换模板
          </button>
          <button onClick={onRegenerate} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
            🔄 重新生成
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-600 flex items-center gap-2">
          {templateIcon} {templateName} <span className="text-xs text-gray-400 font-normal">· AI场景图</span>
        </div>
        <div className="p-6 flex items-center justify-center bg-white">
          <img
            src={sceneImageUrl}
            alt={`场景图 - ${templateName}`}
            className="max-w-full max-h-[500px] object-contain rounded-lg"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <a
          href={sceneImageUrl}
          target="_blank"
          rel="noopener"
          download={`即影_${originalFileName || '商品图'}_场景_${templateName}.png`}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          💾 下载场景图
        </a>
        <button onClick={onBack} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          换个模板
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        💡 提示：图片链接7天内有效，请及时下载保存
      </p>
    </div>
  )
}

// ===== Canvas工具函数 =====

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

function compositeWhiteBg(
  sourceImg: HTMLImageElement,
  targetSize: number,
  format: string = 'image/jpeg',
  quality: number = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = targetSize
    canvas.height = targetSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas不可用'))

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, targetSize, targetSize)

    const imgW = sourceImg.naturalWidth
    const imgH = sourceImg.naturalHeight
    const padding = targetSize * 0.05
    const maxW = targetSize - padding * 2
    const maxH = targetSize - padding * 2
    const scale = Math.min(maxW / imgW, maxH / imgH, 1)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const x = (targetSize - drawW) / 2
    const y = (targetSize - drawH) / 2

    ctx.drawImage(sourceImg, x, y, drawW, drawH)

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas导出失败'))
        resolve(URL.createObjectURL(blob))
      },
      format,
      quality
    )
  })
}
