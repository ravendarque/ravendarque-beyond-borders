/**
 * Visual regression tests for flag rendering
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3 } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Flag Rendering Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadImage(page);
  });

  test('should render Palestine flag preview correctly', async ({ page }) => {
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    const step3 = page.getByTestId(TEST_IDS.STEP_3);
    const previewArea = step3.getByRole('img', { name: 'Profile picture preview' });
    await expect(previewArea).toBeVisible({ timeout: 15000 });
  });

  test('should render Pride flag preview correctly', async ({ page }) => {
    await selectFlag(page, TEST_FLAGS.PRIDE);
    await goToStep3(page);

    const step3 = page.getByTestId(TEST_IDS.STEP_3);
    const previewArea = step3.getByRole('img', { name: 'Profile picture preview' });
    await expect(previewArea).toBeVisible({ timeout: 15000 });
  });
});
