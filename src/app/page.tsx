import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航 */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">即影</h1>
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-sm text-gray-600 hover:text-gray-900">
              工作台
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              定价
            </Link>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              免费开始
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            🚀 支持9大电商平台 · 国内海外一键适配
          </div>
          <h2 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            拍一张实物照<br />
            <span className="text-blue-600">10秒出专业商品图</span>
          </h2>
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            不用请摄影师，不用学PS。<br />
            AI自动抠图 → 白底图/场景图 → 9大平台合规适配，直接上架。
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              免费试做5张 →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-colors border border-gray-200"
            >
              了解更多
            </a>
          </div>

          {/* 信任背书 */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <span>✅ 无需信用卡</span>
            <span>✅ 5张/天免费</span>
            <span>✅ 10秒出图</span>
          </div>
        </div>

        {/* 核心功能 */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">智能抠图</h3>
            <p className="text-gray-500">
              AI一键移除背景，支持透明材质、毛绒、反光等复杂边缘，精度95%+
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">9大平台适配</h3>
            <p className="text-gray-500">
              拼多多/淘宝/抖音/小红书/京东 + Amazon/Shopee/Lazada，一次出图全部合规
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">场景图生成</h3>
            <p className="text-gray-500">
              20+专业场景模板，AI自动合成自然光影，让你的商品图脱颖而出
            </p>
          </div>
        </div>

        {/* 平台一览 */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">一图九平台，不再重复做图</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['🛒 拼多多', '🛍️ 淘宝', '🎵 抖音', '📕 小红书', '🏪 京东', '📦 Amazon', '🦐 Shopee', '🔵 Lazada', '🛍️ Temu'].map(p => (
              <span key={p} className="px-5 py-2.5 bg-white rounded-full border border-gray-200 text-gray-700 font-medium shadow-sm">
                {p}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
