import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/KINKAN/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'KINKAN 勤怠管理',
        short_name: 'KINKAN',
        description: 'オフラインファーストな勤怠管理・ポモドーロアプリ',
        theme_color: '#1a1a2e',
        background_color: '#0d0d1a',
        display: 'standalone',
        start_url: '/KINKAN/',
        scope: '/KINKAN/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // オフラインファースト: アプリシェルをキャッシュ
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // Google Sheets API はネットワーク優先（オフライン時はスキップ）
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
