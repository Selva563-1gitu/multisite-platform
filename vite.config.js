import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * BASE PATH CONFIGURATION
 * ────────────────────────────────────────────────────────
 * Your GitHub Pages URL is:
 *   https://selva563-1gitu.github.io/multisite-platform/
 *
 * So base MUST be '/multisite-platform/'
 *
 * Rule: base = '/' + <your-repo-name> + '/'
 *
 * For local dev: Vite still works fine with a sub-path base.
 * Run `npm run dev` and navigate to:
 *   http://localhost:5173/multisite-platform/
 */
const base = '/multisite-platform/'

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@':          resolve(__dirname, 'src'),
      '@generated': resolve(__dirname, 'generated'),
      '@apps':      resolve(__dirname, 'apps'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,  // disable sourcemaps in prod — reduces deploy size
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          const appsMatch = id.match(/\/apps\/([^/]+)\//)
          if (appsMatch) return `app-${appsMatch[1]}`
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
