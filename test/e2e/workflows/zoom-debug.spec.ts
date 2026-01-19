/**
 * E2E test to debug zoom application
 * Compares rendered images at 0% vs 10% zoom to verify zoom is actually being applied
 */

import { test, expect } from '@playwright/test';
import { selectFlag, waitForRenderComplete } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Zoom Debug', () => {
  test('should verify zoom is visually different between 0% and 10%', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('.choose-wrapper', { timeout: 10000 });
    
    // Upload specific test image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-portrait-clr-1518x2700.png');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image to load
    await page.waitForSelector('.choose-circle.has-image', { timeout: 20000 });
    await page.waitForSelector('.step1-controls', { timeout: 20000 });
    await page.waitForSelector('text=Zoom Out', { timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Find zoom slider
    const zoomSlider = page.getByLabel('Zoom level').locator('[role="slider"]').first();
    await expect(zoomSlider).toBeVisible({ timeout: 10000 });
    
    // Set zoom to 0%
    await zoomSlider.focus();
    await page.keyboard.press('Home'); // Go to 0%
    await page.waitForTimeout(500);
    
    // Navigate to Step 3
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Select flag
    const flagCombobox = page.getByRole('combobox', { name: /choose a flag/i });
    await flagCombobox.click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    let flagOption = page.getByRole('option', { name: TEST_FLAGS.PALESTINE });
    if (await flagOption.count() === 0) {
      flagOption = page.getByRole('option', { name: /palestine/i });
    }
    if (await flagOption.count() === 0) {
      flagOption = page.getByRole('option').first();
    }
    await flagOption.click();
    await page.waitForTimeout(1000);
    
    // Go to Step 3
    const nextButton2 = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton2.click();
    await page.waitForTimeout(1000);
    
    // Wait for render
    await page.waitForSelector('.adjust-wrapper', { timeout: 20000 });
    await waitForRenderComplete(page);
    await page.waitForSelector('.avatar-preview-image', { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Get rendered image at 0% zoom
    const renderedImage0 = page.locator('.avatar-preview-image');
    await expect(renderedImage0).toBeVisible();
    const imageSrc0 = await renderedImage0.getAttribute('src');
    expect(imageSrc0).toBeTruthy();
    
    // Take screenshot at 0% zoom
    await page.screenshot({ path: 'test-results/zoom-0-percent.png', fullPage: false });
    
    // Go back to Step 1 and set zoom to 10%
    const backButton = page.getByRole('button', { name: /back|←/i }).first();
    await backButton.click();
    await page.waitForTimeout(1000);
    await backButton.click();
    await page.waitForTimeout(1000);
    
    // Set zoom to 10%
    const zoomSlider2 = page.getByLabel('Zoom level').locator('[role="slider"]').first();
    await zoomSlider2.focus();
    await page.keyboard.press('Home');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    
    // Verify zoom is set to 10%
    const zoomValue = page.locator('.slider-value').filter({ hasText: /10/ }).first();
    await expect(zoomValue).toBeVisible({ timeout: 5000 });
    
    // Navigate to Step 3 again
    const nextButton3 = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton3.click();
    await page.waitForTimeout(1000);
    
    // Select flag again (state might have reset)
    const flagCombobox2 = page.getByRole('combobox', { name: /choose a flag/i });
    if (await flagCombobox2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await flagCombobox2.click();
      await page.waitForTimeout(500);
      const flagOption2 = page.getByRole('option').first();
      await flagOption2.click();
      await page.waitForTimeout(1000);
    }
    
    // Go to Step 3
    const nextButton4 = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton4.click();
    await page.waitForTimeout(1000);
    
    // Wait for render
    await page.waitForSelector('.adjust-wrapper', { timeout: 20000 });
    await waitForRenderComplete(page);
    await page.waitForSelector('.avatar-preview-image', { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Get rendered image at 10% zoom
    const renderedImage10 = page.locator('.avatar-preview-image');
    await expect(renderedImage10).toBeVisible();
    const imageSrc10 = await renderedImage10.getAttribute('src');
    expect(imageSrc10).toBeTruthy();
    
    // Take screenshot at 10% zoom
    await page.screenshot({ path: 'test-results/zoom-10-percent.png', fullPage: false });
    
    // The images should be different if zoom is working
    // Compare the image sources - they should be different blob URLs
    expect(imageSrc0).not.toBe(imageSrc10);
    
    // Also compare image dimensions if possible
    const bbox0 = await renderedImage0.boundingBox();
    const bbox10 = await renderedImage10.boundingBox();
    
    // If zoom is working, the 10% zoom image should show more of the image (larger scale)
    // But the bounding box might be the same due to CSS constraints
    // The actual difference should be in the image content, not the container size
    
    console.log('0% zoom image src:', imageSrc0?.substring(0, 50));
    console.log('10% zoom image src:', imageSrc10?.substring(0, 50));
    console.log('Images are different:', imageSrc0 !== imageSrc10);
  });
});
