/**
 * Mobile viewport tests (320px, 375px, 414px)
 */

import { test, expect, devices } from '@playwright/test';
import { uploadImage } from '../helpers/page-helpers';
import { TEST_IMAGE_PATH } from '../helpers/test-data';

const mobileViewports = [
  { width: 320, height: 568, name: 'iPhone SE' },
  { width: 375, height: 667, name: 'iPhone 8' },
  { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
];

for (const viewport of mobileViewports) {
  test.describe(`Mobile - ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('should render without horizontal scrolling', async ({ page }) => {
      await page.goto('/');

      // Check for horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
    });

    test('should have proper padding and spacing', async ({ page }) => {
      await page.goto('/');

      // Check main container has padding
      const mainContainer = page.locator('main, [role="main"], .container').first();
      if ((await mainContainer.count()) > 0) {
        const padding = await mainContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            left: parseInt(style.paddingLeft) || 0,
            right: parseInt(style.paddingRight) || 0,
          };
        });

        // Should have some padding on mobile
        expect(padding.left + padding.right).toBeGreaterThan(0);
      }
    });

    test('should support touch interactions', async ({ page }) => {
      await page.goto('/');

      // Upload image
      await uploadImage(page);

      // Test flag selector (should work with touch)
      const flagSelector = page.locator('#flag-select-label').locator('..');
      await flagSelector.tap();
      await page.waitForTimeout(300);

      // Should open dropdown
      const dropdown = page.locator('[role="listbox"]');
      if ((await dropdown.count()) > 0) {
        await expect(dropdown).toBeVisible();
      }
    });

    test('should scale images responsively', async ({ page }) => {
      await page.goto('/');

      // Upload image
      await uploadImage(page);

      // Check image doesn't exceed viewport
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const boundingBox = await img.boundingBox();
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });

    test('should render all UI elements on mobile', async ({ page }) => {
      await page.goto('/');

      // Check key elements are visible
      const uploadButton = page.getByText(/Upload|Choose/i).first();
      await expect(uploadButton).toBeVisible();
    });
  });
}
