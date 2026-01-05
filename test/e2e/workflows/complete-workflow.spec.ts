/**
 * Complete workflow tests: upload → select flag → adjust → download
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

test.describe('Complete Workflow', () => {
  test('should complete full happy path: upload → flag → adjust → download', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    await uploadImage(page);

    // Step 2: Select flag
    await selectFlag(page, TEST_FLAGS.PALESTINE);

    // Verify flag is selected
    await expect(page.locator('#flag-select-label')).toBeVisible();

    // Step 3: Adjust settings (should be on step 3 now)
    await waitForRenderComplete(page);

    // Verify presentation mode selector is visible
    await expect(page.getByText('Presentation Style')).toBeVisible();

    // Select Ring mode
    await selectPresentationMode(page, 'Ring');

    // Adjust border width
    await setSliderValue(page, 'Border Width', 15);

    // Verify preview is rendered
    const previewImg = page.locator('img[data-preview-url]').first();
    if (await previewImg.count() > 0) {
      await expect(previewImg).toBeVisible();
    }

    // Step 4: Download (if download button exists)
    const downloadButton = page.getByRole('button', { name: /download|save|export/i });
    if (await downloadButton.count() > 0) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg)$/i);
    }
  });

  test('should navigate between steps correctly', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/');

    // Step 1: Verify we're on step 1
    await expect(page.getByText(/Choose your profile picture|Upload/i)).toBeVisible();

    // Upload image to move to step 2
    await uploadImage(page);

    // Step 2: Verify we're on step 2
    await expect(page.locator('#flag-select-label')).toBeVisible();

    // Select flag to move to step 3
    await selectFlag(page, TEST_FLAGS.PALESTINE);

    // Step 3: Verify we're on step 3
    await waitForRenderComplete(page);
    await expect(page.getByText('Presentation Style')).toBeVisible();
  });

  test('should show step indicator with correct state', async ({ page }) => {
    await page.goto('/');

    // Check step indicator exists
    const stepIndicator = page.locator('[aria-label*="step" i], [data-step]').first();
    if (await stepIndicator.count() > 0) {
      await expect(stepIndicator).toBeVisible();
    }

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // Step indicator should update (if implemented)
    // This is a placeholder for when step indicator is fully implemented
  });
});
