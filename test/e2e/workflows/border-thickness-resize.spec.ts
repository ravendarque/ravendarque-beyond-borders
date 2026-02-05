/**
 * E2E test to verify circle resizes when border thickness changes
 * Uses shared helpers and ARIA-only slider selector for WebKit compatibility.
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3, setSliderValue } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import { getTestResultsPath } from '../helpers/test-paths';

test.describe('Border Thickness Resize', () => {
  test('should resize image circle when border thickness changes', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    const circle = page.locator('.choose-circle.readonly');
    await expect(circle).toBeVisible({ timeout: 10000 });

    const initialBox = await circle.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;
    const initialHeight = initialBox!.height;

    await circle
      .screenshot({ path: getTestResultsPath('border-thickness-10.png') })
      .catch(() => {});

    // ARIA-only: [aria-label="Border thickness"] then getByRole('slider') for WebKit
    const sliderRoot = page.locator('[aria-label="Border thickness"]');
    const thicknessSlider = sliderRoot.getByRole('slider');
    await thicknessSlider.waitFor({ state: 'visible', timeout: 15000 });

    // Set thickness to 15% (thicker border = smaller circle; app max is 15%)
    await setSliderValue(page, 'Border thickness', 15);

    // Get new circle size
    const thickerBox = await circle.boundingBox();
    expect(thickerBox).not.toBeNull();
    const thickerWidth = thickerBox!.width;
    const thickerHeight = thickerBox!.height;

    // Circle should be smaller with thicker border
    expect(thickerWidth).toBeLessThan(initialWidth);
    expect(thickerHeight).toBeLessThan(initialHeight);

    await circle
      .screenshot({ path: getTestResultsPath('border-thickness-15.png') })
      .catch(() => {});

    // Set thickness to 5% (thinner border = larger circle)
    await setSliderValue(page, 'Border thickness', 5);

    // Get new circle size
    const thinnerBox = await circle.boundingBox();
    expect(thinnerBox).not.toBeNull();
    const thinnerWidth = thinnerBox!.width;
    const thinnerHeight = thinnerBox!.height;

    // Circle should be larger with thinner border
    expect(thinnerWidth).toBeGreaterThan(thickerWidth);
    expect(thinnerHeight).toBeGreaterThan(thickerHeight);

    await circle.screenshot({ path: getTestResultsPath('border-thickness-5.png') }).catch(() => {});
  });
});
