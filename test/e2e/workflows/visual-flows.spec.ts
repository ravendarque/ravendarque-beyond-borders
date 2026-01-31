/**
 * E2E tests for core visual flows
 *
 * Tests the three main presentation modes (Ring, Segment, Cutout) with various
 * parameter adjustments to verify correct rendering behavior.
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  selectPresentationMode,
  setSliderValue,
  waitForRenderComplete,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

/**
 * Helper to capture canvas as base64 data URL
 */
async function captureCanvas(page: any): Promise<string> {
  const canvasDataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    return canvas.toDataURL('image/png');
  });
  return canvasDataUrl;
}

/**
 * Helper to verify canvas has content (not blank)
 * Waits for the canvas to actually render content
 */
async function verifyCanvasHasContent(page: any) {
  // Wait for canvas to have actual rendered content (non-transparent pixels)
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Check if there are enough non-transparent pixels (at least 1% of canvas)
      let nonTransparentCount = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) {
          nonTransparentCount++;
          // Early exit once we have enough pixels
          if (nonTransparentCount > (data.length / 4) * 0.01) return true;
        }
      }
      return false;
    },
    { timeout: 10000 },
  );
}

/**
 * Helper to compare two canvas data URLs and verify they're different
 */
function verifyCanvasChanged(before: string, after: string, message: string) {
  expect(before).not.toBe(after);
  console.log(`✓ ${message}`);
}

test.describe('Visual Flows - Ring Mode', () => {
  test('should render ring mode with parameter variations', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    await uploadImage(page);

    // Step 2: Select Non-binary flag (this triggers rendering with uploaded image)
    await selectFlag(page, 'Non-binary Pride — Non-binary flag');

    // Step 3: Wait for initial render and verify
    await verifyCanvasHasContent(page);

    // Step 4: Select Ring mode
    await selectPresentationMode(page, 'Ring');

    // Step 5: Verify ring image is rendered
    await verifyCanvasHasContent(page);
    const baselineImage = await captureCanvas(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'ring-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border width and verify
    await setSliderValue(page, 'Border Width', 40);
    await verifyCanvasHasContent(page);
    const afterBorderWidth = await captureCanvas(page);
    verifyCanvasChanged(baselineImage, afterBorderWidth, 'Border width change affected render');

    // Step 4b: Change inset and verify
    await setSliderValue(page, 'Inset', 15);
    await verifyCanvasHasContent(page);
    const afterInset = await captureCanvas(page);
    verifyCanvasChanged(afterBorderWidth, afterInset, 'Inset change affected render');

    // Step 4c: Change outset and verify
    await setSliderValue(page, 'Outset', 25);
    await verifyCanvasHasContent(page);
    const afterOutset = await captureCanvas(page);
    verifyCanvasChanged(afterInset, afterOutset, 'Outset change affected render');

    // Attach final screenshot
    const finalScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'ring-mode-final.png',
      contentType: 'image/png',
      body: finalScreenshot as any,
    });
  });
});

test.describe('Visual Flows - Segment Mode', () => {
  test('should render segment mode with parameter variations', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    await uploadImage(page);

    // Step 2: Select Pride flag (this triggers rendering)
    await selectFlag(page, 'Pride — Rainbow Flag');

    // Step 3: Wait for initial render
    await verifyCanvasHasContent(page);

    // Step 4: Select Segment mode
    await selectPresentationMode(page, 'Segment');

    // Step 5: Verify segment image is rendered
    await verifyCanvasHasContent(page);
    const baselineImage = await captureCanvas(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'segment-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border width and verify
    await setSliderValue(page, 'Border Width', 35);
    await verifyCanvasHasContent(page);
    const afterBorderWidth = await captureCanvas(page);
    verifyCanvasChanged(baselineImage, afterBorderWidth, 'Border width change affected render');

    // Step 4b: Change inset and verify
    await setSliderValue(page, 'Inset', 10);
    await verifyCanvasHasContent(page);
    const afterInset = await captureCanvas(page);
    verifyCanvasChanged(afterBorderWidth, afterInset, 'Inset change affected render');

    // Step 4c: Change outset and verify
    await setSliderValue(page, 'Outset', 20);
    await verifyCanvasHasContent(page);
    const afterOutset = await captureCanvas(page);
    verifyCanvasChanged(afterInset, afterOutset, 'Outset change affected render');

    // Attach final screenshot
    const finalScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'segment-mode-final.png',
      contentType: 'image/png',
      body: finalScreenshot as any,
    });
  });
});

test.describe('Visual Flows - Cutout Mode', () => {
  test('should render cutout mode with parameter variations', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    await uploadImage(page);

    // Step 2: Select Palestine flag (this triggers rendering)
    await selectFlag(page, 'Palestine — Palestinian flag');

    // Step 3: Wait for initial render
    await verifyCanvasHasContent(page);

    // Step 4: Select Cutout mode
    await selectPresentationMode(page, 'Cutout');

    // Step 5: Verify cutout image is rendered
    await verifyCanvasHasContent(page);
    const baselineImage = await captureCanvas(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cutout-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border width and verify
    await setSliderValue(page, 'Border Width', 30);
    await verifyCanvasHasContent(page);
    const afterBorderWidth = await captureCanvas(page);
    verifyCanvasChanged(baselineImage, afterBorderWidth, 'Border width change affected render');

    // Step 4b: Change inset and verify
    await setSliderValue(page, 'Inset', 12);
    await verifyCanvasHasContent(page);
    const afterInset = await captureCanvas(page);
    verifyCanvasChanged(afterBorderWidth, afterInset, 'Inset change affected render');

    // Step 4c: Change outset and verify
    await setSliderValue(page, 'Outset', 18);
    await verifyCanvasHasContent(page);
    const afterOutset = await captureCanvas(page);
    verifyCanvasChanged(afterInset, afterOutset, 'Outset change affected render');

    // Step 4d: Change horizontal offset to -200 and verify
    await setSliderValue(page, 'Horizontal Offset', -200);
    await verifyCanvasHasContent(page);
    const afterHorizontalOffset = await captureCanvas(page);
    verifyCanvasChanged(
      afterOutset,
      afterHorizontalOffset,
      'Horizontal offset change affected render',
    );

    // Attach final screenshot
    const finalScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cutout-mode-final.png',
      contentType: 'image/png',
      body: finalScreenshot as any,
    });
  });
});

test.describe('Visual Flows - Cross-mode Verification', () => {
  test('should switch between modes and maintain image quality', async ({ page }) => {
    await page.goto('/');

    // Upload image once
    await uploadImage(page);
    await selectFlag(page, 'Transgender Pride — Transgender flag');

    // Wait for initial render
    await verifyCanvasHasContent(page);

    // Test Ring mode
    await selectPresentationMode(page, 'Ring');
    await verifyCanvasHasContent(page);
    const ringScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-ring.png',
      contentType: 'image/png',
      body: ringScreenshot as any,
    });

    // Test Segment mode
    await selectPresentationMode(page, 'Segment');
    await verifyCanvasHasContent(page);
    const segmentScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-segment.png',
      contentType: 'image/png',
      body: segmentScreenshot as any,
    });

    // Test Cutout mode
    await selectPresentationMode(page, 'Cutout');
    await verifyCanvasHasContent(page);
    const cutoutScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-cutout.png',
      contentType: 'image/png',
      body: cutoutScreenshot as any,
    });

    // Switch back to Ring and verify it still works
    await selectPresentationMode(page, 'Ring');
    await verifyCanvasHasContent(page);
  });
});

test.describe('Visual Flows - Error Handling', () => {
  test('should handle missing image gracefully', async ({ page }) => {
    await page.goto('/');

    // Try to select flag without image
    await selectFlag(page, 'Palestine');

    // Should show upload prompt or placeholder
    const uploadButton = await page.locator('text=/Upload|Choose/i').count();
    expect(uploadButton).toBeGreaterThan(0);
  });

  test('should handle flag changes smoothly', async ({ page }) => {
    await page.goto('/');

    // Upload image
    await uploadImage(page);

    // Select first flag
    await selectFlag(page, 'Pride — Rainbow Flag');
    await verifyCanvasHasContent(page);
    await selectPresentationMode(page, 'Ring');
    await verifyCanvasHasContent(page);
    const firstRender = await captureCanvas(page);

    // Change to different flag
    await selectFlag(page, 'Palestine — Palestinian flag');
    await verifyCanvasHasContent(page);
    const secondRender = await captureCanvas(page);

    // Verify render changed
    verifyCanvasChanged(firstRender, secondRender, 'Flag change affected render');

    // Change to third flag
    await selectFlag(page, 'Transgender Pride — Transgender flag');
    await verifyCanvasHasContent(page);
    const thirdRender = await captureCanvas(page);

    // Verify render changed again
    verifyCanvasChanged(secondRender, thirdRender, 'Second flag change affected render');
  });
});
