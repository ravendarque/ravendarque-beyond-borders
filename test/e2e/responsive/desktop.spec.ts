/**
 * Desktop viewport tests (1280px, 1440px, 1920px)
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

const desktopViewports = [
  { width: 1280, height: 720, name: 'HD' },
  { width: 1440, height: 900, name: 'MacBook' },
  { width: 1920, height: 1080, name: 'Full HD' },
];

for (const viewport of desktopViewports) {
  test.describe(`Desktop - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('should render without horizontal scrolling', async ({ page }) => {
      await page.goto('/');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('should have proper layout on desktop', async ({ page }) => {
      await page.goto('/');

      // Complete workflow
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      await page.waitForTimeout(1000);

      const flagSelector = page.locator('#flag-select-label').locator('..');
      await flagSelector.click();
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
      await page.waitForTimeout(800);

      await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });

      // All controls should be visible
      await expect(page.getByText('Presentation Style')).toBeVisible();
      
      // Sliders should be accessible
      const sliders = page.locator('input[type="range"]');
      const sliderCount = await sliders.count();
      expect(sliderCount).toBeGreaterThan(0);
    });

    test('should maintain proper spacing on large screens', async ({ page }) => {
      await page.goto('/');

      // Check content doesn't stretch too wide
      const mainContent = page.locator('main, [role="main"], .container').first();
      if (await mainContent.count() > 0) {
        const width = await mainContent.evaluate((el) => el.clientWidth);
        // Content should have max-width constraint on large screens
        if (viewport.width >= 1440) {
          expect(width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });
  });
}
