import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Read version from package.json for local dev, or use VERSION env var for CI
function getVersion(): string {
  if (process.env.VERSION) {
    return process.env.VERSION;
  }
  try {
    const packageJson = JSON.parse(
      readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
    );
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  // Set base URL for deployment
  // Priority: BASE_URL env var > production default > dev default
  // BASE_URL is used for beta deployments (e.g., /beta/0.2.136-pr/)
  // Production uses / for custom domain (wearebeyondborders.com)
  base: process.env.BASE_URL || 
        (process.env.NODE_ENV === 'production' ? '/' : '/'),
  plugins: [react()],
  define: {
    // Inject version at build time
    'import.meta.env.APP_VERSION': JSON.stringify(getVersion()),
  },
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
          // Keep React together in vendor chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler')) {
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
