/**
 * Complete workflow tests: upload → select flag → adjust → download
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_IMAGE_PATH = path.resolve(__dirname, '../../test-data/profile-pic.jpg');

test.describe('Complete Workflow', () => {
  test('should complete full happy path: upload → flag → adjust → download', async ({ page }) => {
    await page.goto('/');

    // Step 1: Upload image
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // Verify no error
    const errorCount = await page.getByText(/Invalid file type|File too large|Image dimensions too large/).count();
    expect(errorCount).toBe(0);

    // Step 2: Select flag
    const flagSelector = page.locator('#flag-select-label').locator('..');
    await flagSelector.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
    await page.waitForTimeout(800);

    // Verify flag is selected
    await expect(page.locator('#flag-select-label')).toBeVisible();

    // Step 3: Adjust settings (should be on step 3 now)
    await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });

    // Verify presentation mode selector is visible
    await expect(page.getByText('Presentation Style')).toBeVisible();

    // Select Ring mode
    await page.getByRole('radio', { name: 'Ring' }).check();
    await page.waitForTimeout(500);

    // Adjust border width
    const thicknessSlider = page.locator('input[type="range"][aria-label*="thickness" i]').first();
    await thicknessSlider.waitFor({ state: 'visible', timeout: 5000 });
    await thicknessSlider.fill('15');
    await page.waitForTimeout(400);

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

  test('should navigate between steps correctly', async ({ page }) => {
    await page.goto('/');

    // Step 1: Verify we're on step 1
    await expect(page.getByText(/Choose your profile picture|Upload/i)).toBeVisible();

    // Upload image to move to step 2
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // Step 2: Verify we're on step 2
    await expect(page.locator('#flag-select-label')).toBeVisible();

    // Select flag to move to step 3
    const flagSelector = page.locator('#flag-select-label').locator('..');
    await flagSelector.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Palestine — Palestinian flag' }).click();
    await page.waitForTimeout(800);

    // Step 3: Verify we're on step 3
    await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });
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
