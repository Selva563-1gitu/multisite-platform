import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// GITHUB PAGES: set base to your repo name
// e.g. if your repo is github.com/yourname/my-platform → base: '/my-platform/'
// For local dev, base: '/' works fine — CI overrides this via env var
const base = process.env.VITE_BASE_PATH || '/multisite-platform/'

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@generated': resolve(__dirname, 'generated'),
      '@apps': resolve(__dirname, 'apps'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // Each app chunk is split automatically via React.lazy()
      // Vite handles code-splitting natively with dynamic imports
      output: {
        manualChunks(id) {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          // Per-app chunks: apps/network-dashboard/... → chunk: app-network-dashboard
          const appsMatch = id.match(/\/apps\/([^/]+)\//)
          if (appsMatch) {
            return `app-${appsMatch[1]}`
          }
        },
      },
    },
  },
  // Optimize deps so Vite doesn't re-bundle React every HMR
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
