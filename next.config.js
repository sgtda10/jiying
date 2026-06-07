/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许加载外部图片（Supabase Storage、硅基流动CDN、SiliconFlow S3）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.siliconflow.cn' },
      { protocol: 'https', hostname: 's3.siliconflow.cn' },
    ],
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: '即影',
  },
}

module.exports = nextConfig
