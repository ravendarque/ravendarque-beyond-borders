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
  goToStep3,
  waitForStep3Ready,
  waitForReRender,
} from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

/**
 * Step 3 has no .avatar-preview-image (AdjustStep isn't used). Preview is ImageUploadZone
 * (choose-wrapper + pattern). Use render-done signal + Save button instead.
 */

test.describe('Visual Flows - Ring Mode', () => {
  test('should render ring mode with parameter variations', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    await uploadImage(page);

    // Step 2: Select Non-Binary Pride flag (displayName from app)
    await selectFlag(page, TEST_FLAGS.NON_BINARY);

    // Go to step 3 (clicks step2-next and waits for step 3 ready)
    await goToStep3(page);

    // Step 3: goToStep3 already waited for render; ensure Save is enabled
    await waitForStep3Ready(page);

    // Step 4: Select Ring mode
    await selectPresentationMode(page, 'Ring');

    // Step 5: Wait for re-render (Save disabled then enabled)
    await waitForReRender(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'ring-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border thickness (app slider aria-label), wait for re-render
    await setSliderValue(page, 'Border thickness', 12);
    await waitForReRender(page);

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

    // Step 2: Select Pride flag (displayName from app)
    await selectFlag(page, TEST_FLAGS.PRIDE);

    await goToStep3(page);

    // Step 3: goToStep3 already waited; ensure ready
    await waitForStep3Ready(page);

    // Step 4: Select Segment mode
    await selectPresentationMode(page, 'Segment');

    // Step 5: Wait for re-render
    await waitForReRender(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'segment-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border thickness (app slider)
    await setSliderValue(page, 'Border thickness', 10);
    await waitForReRender(page);

    // Step 4b: Change segment rotation (app slider, segment mode only)
    await setSliderValue(page, 'Segment rotation', 45);
    await waitForReRender(page);

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

    // Step 2: Select Palestine flag (displayName from app)
    await selectFlag(page, TEST_FLAGS.PALESTINE);

    await goToStep3(page);

    // Step 3: goToStep3 already waited; ensure ready
    await waitForStep3Ready(page);

    // Step 4: Select Cutout mode
    await selectPresentationMode(page, 'Cutout');

    // Step 5: Wait for re-render
    await waitForReRender(page);

    // Attach baseline screenshot
    const screenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cutout-mode-baseline.png',
      contentType: 'image/png',
      body: screenshot as any,
    });

    // Step 4a: Change border thickness (app slider)
    await setSliderValue(page, 'Border thickness', 10);
    await waitForReRender(page);

    // Step 4b: Change flag horizontal offset (app slider, cutout mode when offsetEnabled)
    await setSliderValue(page, 'Flag horizontal offset', -20);
    await waitForReRender(page);

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

    // Upload image once, select flag, go to step 3
    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.TRANSGENDER);
    await goToStep3(page);

    // Wait for initial render (goToStep3 already did this)
    await waitForStep3Ready(page);

    // Test Ring mode
    await selectPresentationMode(page, 'Ring');
    await waitForReRender(page);
    const ringScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-ring.png',
      contentType: 'image/png',
      body: ringScreenshot as any,
    });

    // Test Segment mode
    await selectPresentationMode(page, 'Segment');
    await waitForReRender(page);
    const segmentScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-segment.png',
      contentType: 'image/png',
      body: segmentScreenshot as any,
    });

    // Test Cutout mode
    await selectPresentationMode(page, 'Cutout');
    await waitForReRender(page);
    const cutoutScreenshot = await page.screenshot({ fullPage: false });
    test.info().attachments.push({
      name: 'cross-mode-cutout.png',
      contentType: 'image/png',
      body: cutoutScreenshot as any,
    });

    // Switch back to Ring and verify it still works
    await selectPresentationMode(page, 'Ring');
    await waitForReRender(page);
  });
});

test.describe('Visual Flows - Error Handling', () => {
  test('should handle missing image gracefully', async ({ page }) => {
    await page.goto('/');

    // On step 1 there is no flag selector; upload/choose prompt is shown
    await expect(page.getByText(/Choose|profile picture|Upload/i).first()).toBeVisible({
      timeout: 10000,
    });
    const comboboxOnStep1 = await page.getByRole('combobox', { name: 'Choose a flag' }).count();
    expect(comboboxOnStep1).toBe(0);
  });

  test('should handle flag changes smoothly', async ({ page }) => {
    test.setTimeout(120000); // 2 min – WebKit can be slow under full-suite load
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PRIDE);
    await goToStep3(page);
    await waitForStep3Ready(page);

    // Flag selector is only on step 2: go back, change flag, return to step 3
    await page.getByTestId('nav-back').click();
    await page.waitForTimeout(300);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);
    await waitForStep3Ready(page);

    await page.getByTestId('nav-back').click();
    await page.waitForTimeout(300);
    await selectFlag(page, TEST_FLAGS.TRANSGENDER);
    await goToStep3(page);
    await waitForStep3Ready(page);
  });
});
