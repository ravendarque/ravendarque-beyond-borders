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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split React and React-DOM into separate chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          
          // Split MUI into separate chunk (largest dependency)
          if (id.includes('node_modules/@mui') || 
              id.includes('node_modules/@emotion')) {
            return 'mui-vendor';
          }
          
          // Split renderer utilities (canvas operations)
          if (id.includes('/src/renderer/')) {
            return 'renderer';
          }
          
          // Split flag data into separate chunk
          if (id.includes('/src/flags/')) {
            return 'flags';
          }
        },
      },
    },
    // Increase chunk size warning limit slightly (default is 500)
    // We've optimized, but some chunks may still be close to the limit
    chunkSizeWarningLimit: 600,
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
