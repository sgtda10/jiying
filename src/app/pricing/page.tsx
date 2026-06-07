import Link from 'next/link'

const plans = [
  {
    name: '免费版',
    price: '¥0',
    period: '/月',
    desc: '适合个人卖家试试效果',
    features: [
      '5张/天 图片处理',
      '智能抠图（透明底PNG）',
      '白底图生成（2个平台）',
      '基础尺寸适配',
      '下载图片无水印',
    ],
    highlight: false,
    cta: '免费开始',
    href: '/workspace',
  },
  {
    name: 'Pro版',
    price: '¥29',
    period: '/月',
    desc: '适合中小卖家日常使用',
    features: [
      '100张/天 图片处理',
      '智能抠图（透明底PNG）',
      '白底图生成（9个平台全支持）',
      '智能场景图生成（20+模板）',
      'AI图片增强（Real-ESRGAN）',
      'Amazon RGB严格合规',
      '下载图片无水印',
      '优先处理队列',
    ],
    highlight: true,
    cta: '升级Pro',
    href: '/workspace',
  },
  {
    name: '企业版',
    price: '¥99',
    period: '/月',
    desc: '适合大卖家和团队',
    features: [
      '500张/天 图片处理',
      'Pro版全部功能',
      'API接口（批量处理）',
      '团队协作（3个成员）',
      '专属场景模板定制',
      '历史记录180天',
      'CSV批量导出',
      '专属客服支持',
    ],
    highlight: false,
    cta: '联系我们',
    href: '/workspace',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-900">即影</Link>
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-sm text-gray-600 hover:text-gray-900">工作台</Link>
            <Link href="/pricing" className="text-sm text-blue-600 font-medium">定价</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">简单定价，按需选择</h1>
          <p className="text-lg text-gray-500">先免费试用，觉得好用再升级</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlight
                  ? 'bg-blue-600 text-white ring-4 ring-blue-200 scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              <div className="mb-1">
                <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-400'}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                {plan.desc}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5">✅</span>
                    <span className={plan.highlight ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-gray-400">
          <p>💡 所有价格均为人民币（含税），支持支付宝/微信支付</p>
          <p className="mt-1">7天内无理由退款，随时取消订阅</p>
        </div>
      </main>
    </div>
  )
}
