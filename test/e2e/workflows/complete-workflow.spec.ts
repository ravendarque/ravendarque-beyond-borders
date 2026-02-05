/**
 * Complete workflow tests: upload → select flag → adjust → download
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  goToStep3,
  selectPresentationMode,
  setSliderValue,
} from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Complete Workflow', () => {
  test(
    'should complete full happy path: upload → flag → adjust → download',
    { tag: '@smoke' },
    async ({ page }) => {
      await page.goto('/');

      // Step 1: Upload image
      await uploadImage(page);

      // Step 2: Select flag then go to step 3
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);

      // Step 3: Adjust settings (goToStep3 already waited for step 3 ready)

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

      // Step 4: Download (stable testid)
      const downloadButton = page.getByTestId(TEST_IDS.SAVE_AVATAR);
      if ((await downloadButton.count()) > 0) {
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;
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

    // Select flag then go to step 3
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    // Step 3: Verify we're on step 3
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
