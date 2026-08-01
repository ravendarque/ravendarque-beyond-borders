/**
 * Test to verify ring mode pattern is visible in Step 3 preview.
 * Step 3 uses AvatarPreviewCanvas (WebGL/2D canvas) — no .avatar-circle-pattern div.
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  selectPresentationMode,
  waitForReRender,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Ring Pattern Visibility', () => {
  test('should show ring pattern in Step 3 preview', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await selectPresentationMode(page, 'Ring');
    await waitForReRender(page);

    // Step 3 uses canvas (AvatarPreviewCanvas) — pattern is drawn inside the canvas
    const canvas = page.locator('.avatar-preview-canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Canvas must have non-transparent content (ring pattern + photo)
    const hasContent = await canvas.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      if (!c.width || !c.height) return false;
      const ctx = c.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imageData.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);

    // Wrapper background should be transparent (no hatch pattern)
    const wrapper = page.locator('.avatar-circle-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });

    const { background, backgroundColor } = await wrapper.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { background: style.background, backgroundColor: style.backgroundColor };
    });

    const transparentRe = /transparent|rgba?\s*\(\s*0\s*,?\s*0\s*,?\s*0\s*,?\s*0\s*\)/;
    const isTransparent = transparentRe.test(background) || transparentRe.test(backgroundColor);
    expect(isTransparent).toBe(true);
  });
});
