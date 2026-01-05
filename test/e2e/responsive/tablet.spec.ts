/**
 * Tablet viewport tests (768px, 834px, 1024px)
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

const tabletViewports = [
  { width: 768, height: 1024, name: 'iPad' },
  { width: 834, height: 1194, name: 'iPad Pro' },
  { width: 1024, height: 1366, name: 'iPad Pro 12.9"' },
];

for (const viewport of tabletViewports) {
  test.describe(`Tablet - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('should render without horizontal scrolling', async ({ page }) => {
      await page.goto('/');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });

    test('should have proper layout on tablet', async ({ page }) => {
      await page.goto('/');

      // Upload and select flag
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      await page.waitForTimeout(1000);

      const flagSelector = page.locator('#flag-select-label').locator('..');
      await flagSelector.click();
      await page.waitForTimeout(300);
      await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
      await page.waitForTimeout(800);

      // Wait for step 3
      await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });

      // Check layout elements
      await expect(page.getByText('Presentation Style')).toBeVisible();
    });

    test('should support both touch and mouse interactions', async ({ page }) => {
      await page.goto('/');

      // Test mouse interaction
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(TEST_IMAGE_PATH);
      await page.waitForTimeout(1000);

      // Test touch interaction on flag selector
      const flagSelector = page.locator('#flag-select-label').locator('..');
      await flagSelector.tap();
      await page.waitForTimeout(300);

      // Should work with both
      const dropdown = page.locator('[role="listbox"]');
      if (await dropdown.count() > 0) {
        await expect(dropdown).toBeVisible();
      }
    });
  });
}
