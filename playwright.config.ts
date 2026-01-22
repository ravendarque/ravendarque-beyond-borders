import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  outputDir: 'test/test-results',
  timeout: 120000,
  expect: {
    timeout: 5000,
    // Configure screenshot comparison threshold
    toHaveScreenshot: { threshold: 0.2 },
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test/test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Chromium (Desktop)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox (Desktop)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit/Safari (Desktop)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Chromium (Mobile)
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
    // WebKit (Mobile - iPhone)
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
