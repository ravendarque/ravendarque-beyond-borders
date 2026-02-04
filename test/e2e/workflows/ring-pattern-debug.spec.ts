/**
 * Ring pattern visibility in Step 3 (wrapper + pattern layer)
 */

import { test, expect } from '@playwright/test';
import { getTestResultsPath } from '../helpers/test-paths';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  selectPresentationMode,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Ring Pattern Debug', () => {
  test('should show ring pattern in Step 3', async ({ page }) => {
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await selectPresentationMode(page, 'Ring');
    await page.waitForTimeout(500);

    const wrapper = page.locator('.choose-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });

    const patternLayer = page.locator('.choose-wrapper-pattern');
    const patternCount = await patternLayer.count();

    if (patternCount === 0) {
      await page.screenshot({ path: getTestResultsPath('ring-pattern-debug.png'), fullPage: true });
      throw new Error('Pattern layer not rendered - patternStyle is likely undefined');
    }

    await expect(patternLayer).toBeVisible({ timeout: 5000 });

    const patternBg = await patternLayer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage;
    });
    expect(patternBg).not.toBe('none');
    expect(
      patternBg.includes('radial-gradient') || patternBg.includes('blob:'),
    ).toBe(true);
  });
});
