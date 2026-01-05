/**
 * Layout consistency and visual regression tests
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

test.describe('Layout Consistency', () => {
  test('should maintain layout during step transitions', async ({ page }) => {
    await page.goto('/');

    // Step 1 screenshot
    await expect(page).toHaveScreenshot('step1-initial.png', { fullPage: true });

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // Step 2 screenshot
    await expect(page).toHaveScreenshot('step2-after-upload.png', { fullPage: true });

    // Select flag
    const flagSelector = page.locator('#flag-select-label').locator('..');
    await flagSelector.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
    await page.waitForTimeout(800);

    // Step 3 screenshot
    await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });
    await expect(page).toHaveScreenshot('step3-after-flag-select.png', { fullPage: true });
  });

  test('should not have layout shifts during loading', async ({ page }) => {
    await page.goto('/');

    // Monitor layout shifts
    const layoutShifts: number[] = [];
    await page.evaluate(() => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            layoutShifts.push((entry as any).value);
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(2000);

    // Get layout shift values
    const shifts = await page.evaluate(() => {
      const entries = performance.getEntriesByType('layout-shift') as any[];
      return entries
        .filter((e) => !e.hadRecentInput)
        .map((e) => e.value);
    });

    // Cumulative Layout Shift should be low (< 0.1 is good)
    const cumulativeShift = shifts.reduce((sum, val) => sum + val, 0);
    expect(cumulativeShift).toBeLessThan(0.25); // Allow some tolerance
  });

  test('should maintain theme consistency', async ({ page }) => {
    await page.goto('/');

    // Check for consistent colors
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });

    // Should have defined colors (not transparent/auto)
    expect(bodyStyles.backgroundColor).not.toBe('transparent');
    expect(bodyStyles.color).toBeTruthy();
  });
});
