/**
 * E2E test to verify circle resizes when border thickness changes.
 * Step 3 uses AvatarPreviewCanvas — canvas size is fixed; we verify content via pixel sampling.
 * At 5% thickness, pixel at 90% from center is inside photo; at 15% it's in the flag border.
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  setSliderValue,
  waitForReRender,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import { getTestResultsPath } from '../helpers/test-paths';

/** Sample pixel at 90% from center (left edge of inner circle at 5%, in border at 15%) */
function samplePixelAt90PercentFromCenter(
  canvas: HTMLCanvasElement,
): [number, number, number, number] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0, 0, 0, 0];
  const r = Math.min(canvas.width, canvas.height) / 2;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const x = Math.floor(cx - 0.9 * r);
  const y = Math.floor(cy);
  const imageData = ctx.getImageData(x, y, 1, 1);
  return [imageData.data[0], imageData.data[1], imageData.data[2], imageData.data[3]];
}

test.describe('Border Thickness Resize', () => {
  test('should resize image circle when border thickness changes', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    const canvas = page.locator('.avatar-preview-canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await canvas
      .screenshot({ path: getTestResultsPath('border-thickness-10.png') })
      .catch(() => {});

    const sliderRoot = page.locator('[aria-label="Border thickness"]');
    const thicknessSlider = sliderRoot.getByRole('slider');
    await thicknessSlider.waitFor({ state: 'visible', timeout: 15000 });

    // Set thickness to 15% (thicker border = smaller circle)
    await setSliderValue(page, 'Border thickness', 15);
    await waitForReRender(page);

    const pixelAt15 = await canvas.evaluate(samplePixelAt90PercentFromCenter);

    await canvas
      .screenshot({ path: getTestResultsPath('border-thickness-15.png') })
      .catch(() => {});

    // Set thickness to 5% (thinner border = larger circle)
    await setSliderValue(page, 'Border thickness', 5);
    await waitForReRender(page);

    const pixelAt5 = await canvas.evaluate(samplePixelAt90PercentFromCenter);

    await canvas.screenshot({ path: getTestResultsPath('border-thickness-5.png') }).catch(() => {});

    // At 5% thickness, 90% from center is inside photo (circle). At 15%, it's in the flag border.
    // Pixels must differ (photo vs Palestine flag colors)
    const same =
      pixelAt5[0] === pixelAt15[0] &&
      pixelAt5[1] === pixelAt15[1] &&
      pixelAt5[2] === pixelAt15[2] &&
      pixelAt5[3] === pixelAt15[3];
    expect(same).toBe(false);
  });
});
