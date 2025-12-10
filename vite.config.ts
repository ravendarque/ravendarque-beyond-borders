import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // Set base URL for deployment
  // Priority: BASE_URL env var > production default > dev default
  // BASE_URL is used for UAT deployments (e.g., /ravendarque-beyond-borders/uat/branch-name/)
  base: process.env.BASE_URL || 
        (process.env.NODE_ENV === 'production' ? '/ravendarque-beyond-borders/' : '/'),
  plugins: [react()],
  server: {
    // Optimize static file serving
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep React and MUI together in vendor chunk
          // MUI depends on React and they must share the same React instance
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/@mui') || 
              id.includes('node_modules/@emotion')) {
            return 'vendor';
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
    // Increase chunk size warning limit to accommodate vendor chunk
    // Vendor chunk includes React + MUI which is larger but necessary
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'happy-dom',
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
