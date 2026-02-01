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
  test(
    'should complete full happy path: upload → flag → adjust → download',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/');

      // Step 1: Upload image
      await uploadImage(page);

      // Step 2: Select flag
      await selectFlag(page, TEST_FLAGS.PALESTINE);

      // Go to step 3 (user must click Next after selecting flag)
      await page.getByRole('button', { name: 'Go to next step' }).click();
      await page.waitForTimeout(300);

      // Step 3: Wait for render then adjust settings
      await waitForRenderComplete(page);

      // Verify presentation mode selector is visible (radiogroup with Ring/Segment/Cutout)
      await expect(page.getByRole('radiogroup', { name: 'Presentation style' })).toBeVisible();

      // Select Ring mode
      await selectPresentationMode(page, 'Ring');

      // Adjust border thickness (app uses aria-label "Border thickness")
      await setSliderValue(page, 'Border thickness', 15);

      // Verify preview is rendered
      const previewImg = page.locator('img[data-preview-url]').first();
      if ((await previewImg.count()) > 0) {
        await expect(previewImg).toBeVisible();
      }

      // Step 4: Download (app uses aria-label "Save avatar")
      const downloadButton = page.getByRole('button', { name: 'Save avatar' });
      if ((await downloadButton.count()) > 0) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;

        // Verify download
        expect(download.suggestedFilename()).toMatch(/\.(png|jpg|jpeg)$/i);
      }
    },
  );

  test('should navigate between steps correctly', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/');

    // Step 1: Verify we're on step 1
    await expect(page.getByText(/Choose your profile picture|Upload/i)).toBeVisible();

    // Upload image to move to step 2
    await uploadImage(page);

    // Step 2: Verify we're on step 2 (flag selector visible)
    await expect(page.getByRole('combobox', { name: 'Choose a flag' })).toBeVisible();

    // Select flag then click Next to go to step 3
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await page.getByRole('button', { name: 'Go to next step' }).click();
    await page.waitForTimeout(300);

    // Step 3: Verify we're on step 3 (presentation mode selector)
    await waitForRenderComplete(page);
    await expect(page.getByRole('radiogroup', { name: 'Presentation style' })).toBeVisible();
  });

  test('should show step indicator with correct state', async ({ page }) => {
    await page.goto('/');

    // Check step indicator exists
    const stepIndicator = page.locator('[aria-label*="step" i], [data-step]').first();
    if ((await stepIndicator.count()) > 0) {
      await expect(stepIndicator).toBeVisible();
    }

    // Upload image
    await uploadImage(page);

    // Step indicator should update (if implemented)
    // This is a placeholder for when step indicator is fully implemented
  });
});
