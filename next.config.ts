import withPWA from 'next-pwa'
import createNextIntlPlugin from 'next-intl/plugin'
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

async function setup() {
  if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform()
  }
}

setup()

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      }
    ],
  },
  // 确保输出目录正确
  output: 'export',
  // 禁用静态导出的 trailingSlash
  trailingSlash: false,
};

// 只在非生产环境使用 PWA
const withPWAConfigured = process.env.NODE_ENV !== 'production' ? withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
}) as any : (config: any) => config

const configWithPWA = withPWAConfigured(nextConfig as any) as any

export default withNextIntl(configWithPWA)
