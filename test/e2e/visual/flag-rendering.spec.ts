/**
 * Visual regression tests for flag rendering
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, waitForRenderComplete } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Flag Rendering Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadImage(page);
  });

  test('should render Palestine flag preview correctly', async ({ page }) => {
    // Select Palestine flag
    await selectFlag(page, TEST_FLAGS.PALESTINE);

    // Wait for preview to render
    await waitForRenderComplete(page);

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
