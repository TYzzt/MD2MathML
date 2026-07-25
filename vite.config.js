import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          analytics: ['react-ga4'],
          markdown: ['@traeblain/markdown-it-temml', 'highlight.js', 'markdown-it', 'markdown-it-footnote'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/convert': {
        changeOrigin: true,
        rewrite: () => '/convert',
        target: 'https://markdown-to-word-converter.fly.dev',
      },
    },
  },
})
