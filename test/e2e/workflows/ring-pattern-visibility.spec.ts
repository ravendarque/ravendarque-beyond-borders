/**
 * Test to verify ring mode pattern is visible in UI
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  selectPresentationMode,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Ring Pattern Visibility', () => {
  test('should show ring pattern in Step 3 preview', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await selectPresentationMode(page, 'Ring');
    await page.waitForTimeout(500);

    // Check if pattern layer exists and is visible
    const patternLayer = page.locator('.choose-wrapper-pattern');
    await expect(patternLayer).toBeVisible({ timeout: 5000 });

    // Check if pattern has background-image set (not transparent)
    const backgroundImage = await patternLayer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage;
    });

    // Pattern is either CSS radial-gradient or a blob URL (canvas-generated)
    expect(backgroundImage).not.toBe('none');
    expect(backgroundImage.includes('radial-gradient') || backgroundImage.includes('blob:')).toBe(
      true,
    );

    // Check if wrapper background is transparent (hatch should be hidden)
    const wrapper = page.locator('.choose-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });

    const { background, backgroundColor } = await wrapper.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { background: style.background, backgroundColor: style.backgroundColor };
    });

    // Background should be transparent (no hatch pattern). Check both shorthand and color.
    // Browsers may report "transparent", "rgba(0, 0, 0, 0)", "rgba(0,0,0,0)", etc.
    const transparentRe = /transparent|rgba?\s*\(\s*0\s*,?\s*0\s*,?\s*0\s*,?\s*0\s*\)/;
    const isTransparent = transparentRe.test(background) || transparentRe.test(backgroundColor);
    expect(isTransparent).toBe(true);
  });
});
