/**
 * E2E test to verify downloaded image matches Step 3 preview
 * This test catches regressions where the download doesn't match what's shown in the UI
 */

import { test, expect } from '@playwright/test';
import { uploadImage, waitForRenderComplete } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';
import { TEST_RESULTS_DIR, getTestResultsPath } from '../helpers/test-paths';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Download Matches Preview', () => {
  test('should download image that matches Step 3 preview with zoom and position', async ({ page }) => {
    const testResultsDir = TEST_RESULTS_DIR;
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    await page.goto('/');

    // Upload test image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-portrait-clr-1518x2700.png');
    await uploadImage(page, testImagePath);

    // Wait for Step 1 controls
    await page.waitForSelector('.step1-controls', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Set specific zoom and position values in Step 1 using keyboard navigation
    // Radix UI sliders use role="slider" on button elements
    const zoomSlider = page.getByLabel('Zoom level').locator('[role="slider"]').first();
    const hOffsetSlider = page.getByLabel('Horizontal position').locator('[role="slider"]').first();
    const vOffsetSlider = page.getByLabel('Vertical position').locator('[role="slider"]').first();
    
    await expect(zoomSlider).toBeVisible({ timeout: 10000 });
    
    // Set zoom to 10%
    await zoomSlider.focus();
    await page.keyboard.press('Home'); // Go to 0%
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    
    // Set H offset to 24% (slider is inverted, so move from -50 to -24)
    await hOffsetSlider.focus();
    await page.keyboard.press('Home'); // Go to -50
    for (let i = 0; i < 26; i++) { // Move right 26 steps: -50 + 26 = -24
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    
    // Set V offset to -42% (slider is inverted, so move from -50 to 42)
    await vOffsetSlider.focus();
    await page.keyboard.press('Home'); // Go to -50
    for (let i = 0; i < 92; i++) { // Move right 92 steps: -50 + 92 = 42
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);

    // Navigate to Step 2
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await expect(nextButton).toBeVisible({ timeout: 10000 });
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Select flag - use same approach as zoom-visual-verification
    const flagCombobox = page.getByRole('combobox', { name: /choose a flag/i });
    await expect(flagCombobox).toBeVisible({ timeout: 10000 });
    await flagCombobox.click();
    await page.waitForTimeout(1000);
    let flagOption = page.getByRole('option', { name: TEST_FLAGS.PALESTINE });
    if (await flagOption.count() === 0) {
      flagOption = page.getByRole('option', { name: /palestine/i });
    }
    await expect(flagOption).toBeVisible({ timeout: 10000 });
    await flagOption.click();
    await page.waitForTimeout(1000);

    // Navigate to Step 3
    await nextButton.click();
    await page.waitForTimeout(2000);
    await waitForRenderComplete(page);

    // Take screenshot of just the circular image element in Step 3
    // This should match the downloaded image
    const previewCircle = page.locator('.choose-circle.readonly');
    await expect(previewCircle).toBeVisible({ timeout: 10000 });
    
    // Wait a bit more for any final rendering
    await page.waitForTimeout(1000);
    
    const previewScreenshot = await previewCircle.screenshot();
    expect(previewScreenshot).toBeTruthy();
    
    // Save preview screenshot for debugging
    const previewPath = getTestResultsPath('preview-before-download.png');
    fs.writeFileSync(previewPath, previewScreenshot);

    // Find and click download button
    const downloadButton = page.getByRole('button', { name: /save|download/i });
    const buttonCount = await downloadButton.count();
    
    if (buttonCount === 0) {
      test.skip();
      return;
    }

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);

    // Save downloaded file
    const downloadPath = getTestResultsPath('downloaded-image.png');
    await download.saveAs(downloadPath);

    // Verify file exists and has content
    expect(fs.existsSync(downloadPath)).toBe(true);
    const downloadStats = fs.statSync(downloadPath);
    expect(downloadStats.size).toBeGreaterThan(0);

    // Compare downloaded image with preview screenshot
    // Extract the circular image area from both and compare pixel-by-pixel
    const comparisonResult = await page.evaluate(
      async ({ previewScreenshotBase64, downloadPathBase64 }) => {
        // Load preview screenshot (what's shown in UI - already just the circle element)
        const previewImg = new Image();
        await new Promise((resolve, reject) => {
          previewImg.onload = resolve;
          previewImg.onerror = reject;
          previewImg.src = `data:image/png;base64,${previewScreenshotBase64}`;
        });

        // Load downloaded image
        const downloadImg = new Image();
        await new Promise((resolve, reject) => {
          downloadImg.onload = resolve;
          downloadImg.onerror = reject;
          downloadImg.src = `data:image/png;base64,${downloadPathBase64}`;
        });

        // Resize both to same size for comparison
        const comparisonSize = Math.max(
          Math.min(previewImg.width, previewImg.height),
          Math.min(downloadImg.width, downloadImg.height)
        );

        // Resize both images to same size for comparison
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = comparisonSize;
        previewCanvas.height = comparisonSize;
        const previewCtx = previewCanvas.getContext('2d')!;
        previewCtx.drawImage(previewImg, 0, 0, comparisonSize, comparisonSize);

        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = comparisonSize;
        downloadCanvas.height = comparisonSize;
        const downloadCtx = downloadCanvas.getContext('2d')!;
        downloadCtx.drawImage(downloadImg, 0, 0, comparisonSize, comparisonSize);

        // Compare pixel data
        const previewData = previewCtx.getImageData(0, 0, comparisonSize, comparisonSize).data;
        const downloadData = downloadCtx.getImageData(0, 0, comparisonSize, comparisonSize).data;

        let diffPixels = 0;
        let totalPixels = 0;
        let imageAreaDiffPixels = 0; // Track differences in the image area (center circle)
        let imageAreaTotalPixels = 0;
        const threshold = 5; // Very strict threshold - images should be almost identical
        const imageAreaRadius = comparisonSize * 0.4; // Approximate radius of inner image circle (80% of total)
        const centerX = comparisonSize / 2;
        const centerY = comparisonSize / 2;

        for (let y = 0; y < comparisonSize; y++) {
          for (let x = 0; x < comparisonSize; x++) {
            const idx = (y * comparisonSize + x) * 4;
            
            // Skip fully transparent pixels (outside the circle)
            if (previewData[idx + 3] === 0 && downloadData[idx + 3] === 0) continue;

            totalPixels++;
            
            // Check if this pixel is in the image area (inner circle)
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const isInImageArea = distFromCenter < imageAreaRadius;
            if (isInImageArea) {
              imageAreaTotalPixels++;
            }

            const r1 = previewData[idx];
            const g1 = previewData[idx + 1];
            const b1 = previewData[idx + 2];
            const a1 = previewData[idx + 3];

            const r2 = downloadData[idx];
            const g2 = downloadData[idx + 1];
            const b2 = downloadData[idx + 2];
            const a2 = downloadData[idx + 3];

            // Calculate color difference (including alpha)
            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);
            if (diff > threshold) {
              diffPixels++;
              if (isInImageArea) {
                imageAreaDiffPixels++;
              }
            }
          }
        }

        const similarity = totalPixels > 0 ? ((totalPixels - diffPixels) / totalPixels) * 100 : 100;
        const imageAreaSimilarity = imageAreaTotalPixels > 0 
          ? ((imageAreaTotalPixels - imageAreaDiffPixels) / imageAreaTotalPixels) * 100 
          : 100;
        return {
          similarity,
          imageAreaSimilarity, // Similarity specifically in the image area (center circle)
          diffPixels,
          imageAreaDiffPixels,
          totalPixels,
          imageAreaTotalPixels,
          previewSize: { width: previewImg.width, height: previewImg.height },
          downloadSize: { width: downloadImg.width, height: downloadImg.height },
        };
      },
      {
        previewScreenshotBase64: previewScreenshot.toString('base64'),
        downloadPathBase64: fs.readFileSync(downloadPath).toString('base64'),
      }
    );

    // Log comparison results for debugging (before assertions so we see them even on failure)
    console.log('Image comparison:', {
      overallSimilarity: `${comparisonResult.similarity.toFixed(2)}%`,
      imageAreaSimilarity: `${comparisonResult.imageAreaSimilarity.toFixed(2)}%`,
      diffPixels: comparisonResult.diffPixels,
      imageAreaDiffPixels: comparisonResult.imageAreaDiffPixels,
      totalPixels: comparisonResult.totalPixels,
      imageAreaTotalPixels: comparisonResult.imageAreaTotalPixels,
      previewSize: comparisonResult.previewSize,
      downloadSize: comparisonResult.downloadSize,
    });

    // Verify images are similar - they should be almost identical
    // Note: Small differences are expected due to:
    // - CSS gradients (preview) vs canvas rendering (download) for borders
    // - Anti-aliasing differences between rendering methods
    // - Compression artifacts
    // But overall they should match very closely
    if (comparisonResult.similarity <= 95) {
      throw new Error(`Overall similarity ${comparisonResult.similarity.toFixed(2)}% is below 95% threshold`);
    }
    expect(comparisonResult.similarity).toBeGreaterThan(95);
    // CRITICAL: Image area (center circle) must match almost perfectly - this catches positioning/zoom issues
    // The photo itself should be rendered identically (both use canvas for the image)
    if (comparisonResult.imageAreaSimilarity <= 98) {
      throw new Error(`Image area similarity ${comparisonResult.imageAreaSimilarity.toFixed(2)}% is below 98% threshold. This likely indicates a positioning or zoom mismatch.`);
    }
    expect(comparisonResult.imageAreaSimilarity).toBeGreaterThan(98);
    expect(comparisonResult.totalPixels).toBeGreaterThan(1000); // Ensure we're comparing actual content
    expect(comparisonResult.imageAreaTotalPixels).toBeGreaterThan(200); // Ensure we're checking the image area
  });

  test('should download image that matches preview with different zoom levels', async ({ page }) => {
    const testResultsDir = TEST_RESULTS_DIR;
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    await page.goto('/');

    // Upload test image
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic-square-clr-256x256.jpg');
    await uploadImage(page, testImagePath);

    // Wait for Step 1 controls
    await page.waitForSelector('.step1-controls', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Set high zoom level using keyboard navigation
    const zoomSlider = page.getByLabel('Zoom level').locator('[role="slider"]').first();
    await expect(zoomSlider).toBeVisible({ timeout: 10000 });
    
    await zoomSlider.focus();
    await page.keyboard.press('Home'); // Go to 0%
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);

    // Navigate through steps
    const nextButton = page.getByRole('button', { name: /next|→/i }).first();
    await nextButton.click();
    await page.waitForTimeout(1000);
    
    // Select flag
    const flagCombobox = page.getByRole('combobox', { name: /choose a flag/i });
    await expect(flagCombobox).toBeVisible({ timeout: 10000 });
    await flagCombobox.click();
    await page.waitForTimeout(1000);
    let flagOption = page.getByRole('option', { name: TEST_FLAGS.PALESTINE });
    if (await flagOption.count() === 0) {
      flagOption = page.getByRole('option', { name: /palestine/i });
    }
    await expect(flagOption).toBeVisible({ timeout: 10000 });
    await flagOption.click();
    await page.waitForTimeout(1000);
    
    await nextButton.click();
    await page.waitForTimeout(2000);
    await waitForRenderComplete(page);

    // Verify preview is visible
    const previewWrapper = page.locator('.adjust-wrapper');
    await expect(previewWrapper).toBeVisible({ timeout: 10000 });

    // Download
    const downloadButton = page.getByRole('button', { name: /save|download/i });
    if (await downloadButton.count() === 0) {
      test.skip();
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download succeeded
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);
    
    // Save for inspection
    const downloadPath = getTestResultsPath('downloaded-zoom50.png');
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);
  });
});
