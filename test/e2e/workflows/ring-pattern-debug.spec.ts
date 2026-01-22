/**
 * Debug test for ring pattern visibility
 */

import { test, expect } from '@playwright/test';
import { getTestResultsPath } from '../helpers/test-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Ring Pattern Debug', () => {
  test('should show ring pattern in Step 3', async ({ page }) => {
    await page.goto('/');

    // Upload image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-square-clr-256x256.jpg');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);

    // Navigate to Step 2
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Select flag using combobox
    const combobox = page.getByRole('combobox');
    await combobox.click();
    await page.waitForTimeout(500);
    
    // Click Palestine option
    const palestineOption = page.getByRole('option', { name: /palestine/i }).first();
    await palestineOption.click();
    await page.waitForTimeout(1000);

    // Navigate to Step 3
    await nextButton.click();
    await page.waitForTimeout(2000);

    // Select Ring mode
    const ringButton = page.getByRole('button', { name: /ring/i }).first();
    await ringButton.click();
    await page.waitForTimeout(1000);

    // Check if wrapper has readonly class
    const wrapper = page.locator('.choose-wrapper.readonly');
    await expect(wrapper).toBeVisible({ timeout: 5000 });
    
    // Check wrapper background is transparent (rgba(0,0,0,0) is transparent)
    const wrapperBg = await wrapper.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        background: style.background,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      };
    });
    
    console.log('Wrapper background:', wrapperBg);
    // rgba(0,0,0,0) is transparent, so this is correct

    // Check if pattern layer exists
    const patternLayer = page.locator('.choose-wrapper-pattern');
    const patternCount = await patternLayer.count();
    console.log('Pattern layer count:', patternCount);
    
    // Debug: Check what props are being passed to ImageUploadZone
    const debugInfo = await page.evaluate(() => {
      const wrapper = document.querySelector('.choose-wrapper.readonly');
      if (!wrapper) return { error: 'Wrapper not found' };
      
      const circle = wrapper.querySelector('.choose-circle.readonly');
      const pattern = wrapper.querySelector('.choose-wrapper-pattern');
      
      return {
        wrapperExists: !!wrapper,
        circleExists: !!circle,
        patternExists: !!pattern,
        wrapperClasses: wrapper.className,
        wrapperSize: wrapper.getBoundingClientRect().width,
      };
    });
    
    console.log('Debug info:', debugInfo);
    
    if (patternCount === 0) {
      // Pattern layer not rendered - check why
      console.log('Pattern layer not found! Checking component state...');
      
      // Check if we can see console logs
      const logs = await page.evaluate(() => {
        // This won't work, but let's check the DOM structure
        return {
          wrapper: document.querySelector('.choose-wrapper.readonly')?.outerHTML.substring(0, 200),
        };
      });
      
      console.log('DOM structure:', logs);
      
      // Take screenshot for debugging
      await page.screenshot({ path: getTestResultsPath('ring-pattern-debug.png'), fullPage: true });
      throw new Error('Pattern layer not rendered - patternStyle is likely undefined');
    }
    
    await expect(patternLayer).toBeVisible({ timeout: 5000 });
    
    // Check pattern background-image
    const patternBg = await patternLayer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backgroundImage: style.backgroundImage,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        zIndex: style.zIndex,
      };
    });
    
    console.log('Pattern layer styles:', patternBg);
    expect(patternBg.backgroundImage).not.toBe('none');
    expect(patternBg.backgroundImage).toContain('radial-gradient');
  });
});
