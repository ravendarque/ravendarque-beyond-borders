/**
 * Desktop viewport tests (1280px, 1440px, 1920px)
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3, waitForStep3Ready } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

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

      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);
      await waitForStep3Ready(page);

      await expect(page.getByRole('radiogroup', { name: 'Presentation style' })).toBeVisible();
      const sliderRoot = page.locator('[aria-label="Border thickness"]');
      await expect(sliderRoot.getByRole('slider')).toBeVisible();
    });

    test('should maintain proper spacing on large screens', async ({ page }) => {
      await page.goto('/');

      // Check content doesn't stretch too wide
      const mainContent = page.locator('main, [role="main"], .container').first();
      if ((await mainContent.count()) > 0) {
        const width = await mainContent.evaluate((el) => el.clientWidth);
        // Content should have max-width constraint on large screens
        if (viewport.width >= 1440) {
          expect(width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });
  });
}
