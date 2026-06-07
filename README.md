# 即影 - AI电商商品图工具

> 拍实物照，10秒出白底图/场景图，9大平台一键适配

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的API密钥

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000

## 技术栈

- **前端**: Next.js 15 + Tailwind CSS + TypeScript
- **后端**: Next.js API Routes + Supabase
- **AI抠图**: rembg (自部署HTTP服务，免费)
- **AI场景图**: 硅基流动 SiliconFlow API (SDXL)
- **AI增强**: 硅基流动 SiliconFlow API (Real-ESRGAN)
- **存储**: Supabase Storage
- **部署**: Vercel

## 项目结构

```
jiying/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # 首页
│   │   ├── layout.tsx       # 根布局
│   │   ├── api/             # API路由
│   │   │   ├── remove-bg/   # 抠图API
│   │   │   ├── generate-scene/ # 场景图生成API
│   │   │   └── enhance/     # 图片增强API
│   │   ├── workspace/       # 工作台页面
│   │   └── pricing/         # 定价页面
│   ├── components/          # React组件
│   │   ├── ImageUploader.tsx # 图片上传
│   │   ├── ImagePreview.tsx  # 图片预览
│   │   ├── PlatformSelector.tsx # 平台选择
│   │   └── SceneSelector.tsx # 场景模板选择
│   ├── lib/                 # 工具库
│   │   ├── supabase.ts      # Supabase客户端
│   │   ├── siliconflow.ts   # 硅基流动API
│   │   └── platforms.ts     # 平台规格配置
│   └── types/               # TypeScript类型
├── public/                  # 静态资源
├── .env.example             # 环境变量模板
└── package.json
```
