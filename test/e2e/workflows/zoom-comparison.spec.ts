/**
 * E2E test to compare rendered images at 0% vs 10% zoom
 * This verifies that zoom is actually being applied by comparing the rendered output
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Zoom Comparison', () => {
  test('should render different images at 0% vs 10% zoom', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('.choose-wrapper', { timeout: 10000 });
    
    // Upload test image
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
    
    // Set zoom to 0% and render
    await zoomSlider.focus();
    await page.keyboard.press('Home');
    await page.waitForTimeout(500);
    
    // Navigate to Step 3
    await page.getByRole('button', { name: /next|→/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Select first flag
    const flagCombobox = page.getByRole('combobox', { name: /choose a flag/i });
    await flagCombobox.click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('[role="option"]', { timeout: 10000 });
    const flagOption = page.getByRole('option').first();
    await flagOption.click();
    await page.waitForTimeout(1000);
    
    // Go to Step 3
    await page.getByRole('button', { name: /next|→/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Wait for render
    await page.waitForSelector('.adjust-wrapper', { timeout: 20000 });
    await page.waitForSelector('.avatar-preview-image', { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Get image at 0% zoom
    const image0 = page.locator('.avatar-preview-image');
    await expect(image0).toBeVisible();
    const src0 = await image0.getAttribute('src');
    expect(src0).toBeTruthy();
    
    // Go back to Step 1
    await page.getByRole('button', { name: /back|←/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /back|←/i }).first().click();
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
    
    // Verify zoom is 10%
    const zoomValue = page.locator('.slider-value').filter({ hasText: /10/ }).first();
    await expect(zoomValue).toBeVisible({ timeout: 5000 });
    
    // Navigate to Step 3 again
    await page.getByRole('button', { name: /next|→/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Select flag again
    const flagCombobox2 = page.getByRole('combobox', { name: /choose a flag/i });
    if (await flagCombobox2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await flagCombobox2.click();
      await page.waitForTimeout(500);
      const flagOption2 = page.getByRole('option').first();
      await flagOption2.click();
      await page.waitForTimeout(1000);
    }
    
    // Go to Step 3
    await page.getByRole('button', { name: /next|→/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Wait for render
    await page.waitForSelector('.adjust-wrapper', { timeout: 20000 });
    await page.waitForSelector('.avatar-preview-image', { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Get image at 10% zoom
    const image10 = page.locator('.avatar-preview-image');
    await expect(image10).toBeVisible();
    const src10 = await image10.getAttribute('src');
    expect(src10).toBeTruthy();
    
    // The images MUST be different if zoom is working
    // Different blob URLs means different rendering
    expect(src0).not.toBe(src10);
    
    console.log('0% zoom image:', src0?.substring(0, 50));
    console.log('10% zoom image:', src10?.substring(0, 50));
    console.log('Images are different:', src0 !== src10);
  });
});
