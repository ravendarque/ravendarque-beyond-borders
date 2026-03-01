/**
 * Ring pattern visibility in Step 3.
 * Step 3 uses AvatarPreviewCanvas (WebGL/2D canvas) — no .avatar-circle-pattern div.
 */

import { test, expect } from '@playwright/test';
import { getTestResultsPath } from '../helpers/test-paths';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  selectPresentationMode,
  waitForReRender,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Ring Pattern Debug', () => {
  test('should show ring pattern in Step 3', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await selectPresentationMode(page, 'Ring');
    await waitForReRender(page);

    const wrapper = page.locator('.avatar-circle-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });

    const canvas = page.locator('.avatar-preview-canvas');
    const canvasCount = await canvas.count();

    if (canvasCount === 0) {
      await page.screenshot({ path: getTestResultsPath('ring-pattern-debug.png'), fullPage: true });
      throw new Error('Preview canvas not rendered');
    }

    await expect(canvas).toBeVisible({ timeout: 5000 });

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
  });
});
