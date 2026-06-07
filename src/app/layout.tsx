import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '即影 - AI电商商品图工具',
  description: '拍实物照，10秒出白底图/场景图，9大平台一键适配',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
