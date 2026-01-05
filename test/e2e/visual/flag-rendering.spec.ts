/**
 * Visual regression tests for flag rendering
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

test.describe('Flag Rendering Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);
  });

  test('should render Palestine flag preview correctly', async ({ page }) => {
    // Select Palestine flag
    const flagSelector = page.locator('#flag-select-label').locator('..');
    await flagSelector.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
    await page.waitForTimeout(800);

    // Wait for preview to render
    await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });

    // Take screenshot of flag preview
    const flagPreview = page.locator('[data-flag-preview], .flag-preview, img[alt*="flag" i]').first();
    if (await flagPreview.count() > 0) {
      await expect(flagPreview).toHaveScreenshot('palestine-flag-preview.png');
    }
  });

  test('should render Pride flag preview correctly', async ({ page }) => {
    const flagSelector = page.locator('#flag-select-label').locator('..');
    await flagSelector.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Pride — Rainbow Flag' }).click();
    await page.waitForTimeout(800);

    await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });

    const flagPreview = page.locator('[data-flag-preview], .flag-preview, img[alt*="flag" i]').first();
    if (await flagPreview.count() > 0) {
      await expect(flagPreview).toHaveScreenshot('pride-flag-preview.png');
    }
  });
});
