/**
 * Test to verify ring mode pattern is visible in UI
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, selectPresentationMode, waitForRenderComplete } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Ring Pattern Visibility', () => {
  test('should show ring pattern in Step 3 preview', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-square-clr-256x256.jpg');
    await uploadImage(page, testImagePath);
    await page.waitForTimeout(1000);

    // Step 2: Select flag
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await page.waitForTimeout(1000);

    // Step 3: Navigate to Step 3
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton.click();
    await page.waitForTimeout(2000);
    await waitForRenderComplete(page);

    // Select Ring mode
    await selectPresentationMode(page, 'Ring');
    await page.waitForTimeout(1000);

    // Check if pattern layer exists and is visible
    const patternLayer = page.locator('.choose-wrapper-pattern');
    await expect(patternLayer).toBeVisible({ timeout: 5000 });

    // Check if pattern has background-image set (not transparent)
    const backgroundImage = await patternLayer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage;
    });

    console.log('Pattern background-image:', backgroundImage);
    
    // Should have a radial-gradient, not 'none' or 'transparent'
    expect(backgroundImage).not.toBe('none');
    expect(backgroundImage).toContain('radial-gradient');

    // Check if wrapper background is transparent (hatch should be hidden)
    const wrapper = page.locator('.choose-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });
    
    const wrapperBackground = await wrapper.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.background;
    });

    console.log('Wrapper background:', wrapperBackground);
    
    // Background should be transparent (no hatch pattern)
    expect(wrapperBackground).toContain('transparent');
  });
});
