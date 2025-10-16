import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // Set base URL for GitHub Pages deployment
  // In production, assets will be served from /ravendarque-beyond-borders/
  // In development, assets are served from root /
  base: process.env.NODE_ENV === 'production' ? '/ravendarque-beyond-borders/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/test/e2e/**', // Exclude Playwright E2E tests from Vitest
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
})
