/**
 * Debug test to understand the UI behavior
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGE_PATH = path.resolve(__dirname, '../test-data/profile-pic.jpg');

test('debug UI behavior', async ({ page }) => {
  // Capture console logs and errors
  const logs: string[] = [];
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  
  await page.goto('/');
  
  // Take initial screenshot
  await page.screenshot({ path: '.local/debug-01-initial.png', fullPage: true });
  
  // Upload image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(TEST_IMAGE_PATH);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '.local/debug-02-after-upload.png', fullPage: true });
  
  // Check if canvas exists
  const canvasExists = await page.locator('canvas').count();
  console.log('Canvas exists:', canvasExists);
  
  // Try to select a flag
  const flagSelectorLabel = await page.locator('text=Select a flag').count();
  console.log('Flag selector visible:', flagSelectorLabel);
  
  if (flagSelectorLabel > 0) {
    // Click on the select
    await page.locator('#flag-select-label').locator('..').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.local/debug-03-menu-open.png', fullPage: true });
    
    // List available options
    const options = await page.locator('[role="option"]').allTextContents();
    console.log('Available flag options:', options);
    
    // Select first real flag (not "None")
    if (options.length > 1) {
      await page.getByRole('option').nth(1).click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '.local/debug-04-flag-selected.png', fullPage: true });
      
      // Wait longer and check multiple times
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        const info = await page.evaluate(() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement;
          if (!canvas) return { hasCanvas: false };
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return { hasCanvas: true, hasContext: false };
          
          const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
          let nonTransparentPixels = 0;
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) nonTransparentPixels++;
          }
          
          return {
            hasCanvas: true,
            hasContext: true,
            nonTransparentPixels,
            iteration: 0
          };
        });
        console.log(`Check ${i}:`, info);
        if (info.nonTransparentPixels && info.nonTransparentPixels > 0) {
          console.log('Canvas has content!');
          break;
        }
      }
      
      await page.screenshot({ path: '.local/debug-04b-after-wait.png', fullPage: true });
    }
  }
  
  // Check canvas again
  const canvasAfter = await page.locator('canvas').count();
  console.log('Canvas after flag select:', canvasAfter);
  
  if (canvasAfter > 0) {
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nonTransparentPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) nonTransparentPixels++;
      }
      
      return {
        width: canvas.width,
        height: canvas.height,
        nonTransparentPixels,
        totalPixels: canvas.width * canvas.height
      };
    });
    console.log('Final canvas info:', canvasInfo);
  }
  
  // Check for presentation controls
  const presentationControls = await page.locator('text=Presentation Style').count();
  console.log('Presentation controls visible:', presentationControls);
  
  await page.screenshot({ path: '.local/debug-05-final.png', fullPage: true });
  
  // Print captured logs and errors
  console.log('\n=== Console Logs ===');
  logs.forEach(log => console.log(log));
  
  console.log('\n=== Page Errors ===');
  errors.forEach(err => console.log(err));
  
  if (errors.length === 0) {
    console.log('No page errors detected');
  }
});
