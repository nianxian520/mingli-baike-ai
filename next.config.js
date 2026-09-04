/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // --- 生产部署关键：Next.js 官方推荐 standalone 模式
  // 产出 .next/standalone/ 可独立运行（无需 node_modules/源码，仅 ~50MB）
  // 注意: 必须手动复制 public 与 .next/static 到 standalone 对应目录
  output: 'standalone',
  // 命理计算引擎(lunar-javascript)需要Node API,API Routes默认Node Runtime
  // 部署到Cloudflare时开启 nodejs_compat
  experimental: {
    serverComponentsExternalPackages: ['lunar-javascript', '@prisma/client'],
  },
  // Cloudflare Pages 部署需要
  // webpack: (config) => { config.resolve.fallback = { ...config.resolve.fallback, fs: false }; return config; },
  // 生产压缩: 默认已开启, 这里仅显式声明
  compress: true,
  poweredByHeader: false, // 隐私: 不泄露 X-Powered-By:Next.js
  // 生产域 CSP/图片域名可在此扩展 (暂不限制)
};

module.exports = nextConfig;
