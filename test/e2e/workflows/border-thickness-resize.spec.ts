/**
 * E2E test to verify circle resizes when border thickness changes
 * This test verifies that adjusting border thickness in Step 3 actually resizes the image circle
 */

import { test, expect } from '@playwright/test';
import { selectFlag, waitForRenderComplete } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import { getTestResultsPath } from '../helpers/test-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Border Thickness Resize', () => {
  test('should resize image circle when border thickness changes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('.choose-wrapper', { timeout: 10000 });
    
    // Upload test image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-portrait-clr-1518x2700.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image to load
    await page.waitForSelector('.choose-circle.has-image', { timeout: 20000 });
    await page.waitForTimeout(1000);
    
    // Navigate to Step 2
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await expect(nextButton).toBeVisible({ timeout: 10000 });
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Select flag - use the same approach as zoom-visual-verification test
    const flagCombobox = page.getByRole('combobox', { name: /choose a flag/i });
    await expect(flagCombobox).toBeVisible({ timeout: 10000 });
    await flagCombobox.click();
    await page.waitForTimeout(1000); // Wait longer for menu to open
    
    // Wait for any flag option to appear (menu is open)
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    
    // Select Palestine flag - try exact name first, then partial match
    let flagOption = page.getByRole('option', { name: TEST_FLAGS.PALESTINE });
    if (await flagOption.count() === 0) {
      // Try partial match
      flagOption = page.getByRole('option', { name: /palestine/i });
    }
    await expect(flagOption).toBeVisible({ timeout: 10000 });
    await flagOption.click();
    await page.waitForTimeout(1000);
    
    // Navigate to Step 3
    await nextButton.click();
    await page.waitForTimeout(2000); // Wait for render
    
    // Wait for Step 3 controls
    await page.waitForSelector('text=Thinner', { timeout: 10000 });
    await waitForRenderComplete(page);
    
    // Get the circle element - in readonly mode it has .readonly class, not .has-image
    const circle = page.locator('.choose-circle.readonly');
    await expect(circle).toBeVisible();
    
    // Get initial circle size (bounding box)
    const initialBox = await circle.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;
    const initialHeight = initialBox!.height;
    
    // Take screenshot at initial thickness (default 10%)
    await circle.screenshot({ path: getTestResultsPath('border-thickness-10.png') });
    
    // Find thickness slider
    const thicknessSlider = page.getByLabel('Border thickness').locator('[role="slider"]').first();
    await expect(thicknessSlider).toBeVisible({ timeout: 10000 });
    
    // Set thickness to 20% (thicker border = smaller circle)
    await thicknessSlider.focus();
    await page.keyboard.press('Home'); // Go to minimum (5%)
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight'); // Move to 20%
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000); // Wait for render
    
    // Wait for render to complete
    await waitForRenderComplete(page);
    await page.waitForTimeout(500);
    
    // Get new circle size
    const thickerBox = await circle.boundingBox();
    expect(thickerBox).not.toBeNull();
    const thickerWidth = thickerBox!.width;
    const thickerHeight = thickerBox!.height;
    
    // Circle should be smaller with thicker border
    expect(thickerWidth).toBeLessThan(initialWidth);
    expect(thickerHeight).toBeLessThan(initialHeight);
    
    // Take screenshot at 20% thickness
    await circle.screenshot({ path: getTestResultsPath('border-thickness-20.png') });
    
    // Set thickness to 5% (thinner border = larger circle)
    await thicknessSlider.focus();
    await page.keyboard.press('Home'); // Go to minimum (5%)
    await page.waitForTimeout(1000); // Wait for render
    
    // Wait for render to complete
    await waitForRenderComplete(page);
    await page.waitForTimeout(500);
    
    // Get new circle size
    const thinnerBox = await circle.boundingBox();
    expect(thinnerBox).not.toBeNull();
    const thinnerWidth = thinnerBox!.width;
    const thinnerHeight = thinnerBox!.height;
    
    // Circle should be larger with thinner border
    expect(thinnerWidth).toBeGreaterThan(thickerWidth);
    expect(thinnerHeight).toBeGreaterThan(thickerHeight);
    
    // Take screenshot at 5% thickness
    await circle.screenshot({ path: getTestResultsPath('border-thickness-5.png') });
    
    // Log the sizes for debugging
    console.log('Initial size:', initialWidth, 'x', initialHeight);
    console.log('Thicker (20%):', thickerWidth, 'x', thickerHeight);
    console.log('Thinner (5%):', thinnerWidth, 'x', thinnerHeight);
  });
});
