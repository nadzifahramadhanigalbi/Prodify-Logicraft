import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'audio/*', 'lottie/*'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'Prodify',
        short_name: 'Prodify',
        description: 'Empowering students through innovative productivity tools',
        theme_color: '#4F46E5',
        icons: [
          {
            src: 'https://ui-avatars.com/api/?name=SP&background=4F46E5&color=fff&size=192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://ui-avatars.com/api/?name=SP&background=4F46E5&color=fff&size=512',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
