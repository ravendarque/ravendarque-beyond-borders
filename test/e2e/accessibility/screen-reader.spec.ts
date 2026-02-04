/**
 * Screen reader accessibility tests
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3, waitForStep3Ready } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Screen Reader Support', () => {
  test('should announce step changes to screen readers', async ({ page }) => {
    await page.goto('/');

    const announcer = page.locator(
      '[role="status"][aria-live], [aria-live="polite"], [aria-live="assertive"]',
    );
    const count = await announcer.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have descriptive alt text on images', async ({ page }) => {
    await page.goto('/');
    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);
    await waitForStep3Ready(page);

    // Step 3 preview is ImageUploadZone (readonly) with role="img" and aria-label; any img must have descriptive alt
    const step3 = page.getByTestId(TEST_IDS.STEP_3);
    const previewRole = step3.getByRole('img', { name: 'Profile picture preview' });
    await expect(previewRole).toBeVisible({ timeout: 15000 });
    const imgsWithAlt = step3.locator('img[alt]');
    const count = await imgsWithAlt.count();
    for (let i = 0; i < count; i++) {
      const alt = await imgsWithAlt.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(0);
    }
  });

  test('should have proper ARIA descriptions', async ({ page }) => {
    await page.goto('/');

    // Check for aria-describedby usage
    const elementsWithDescription = page.locator('[aria-describedby]');
    const count = await elementsWithDescription.count();

    // Should have some elements with descriptions (sliders, inputs, etc.)
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const el = elementsWithDescription.nth(i);
        const describedBy = await el.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();

        // Check that the description element exists
        const descId = describedBy?.split(' ')[0];
        if (descId) {
          const descEl = page.locator(`#${descId}`);
          const descCount = await descEl.count();
          expect(descCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have skip navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for skip links
    const skipLinks = page.locator('a[href^="#"], [href="#main"], [href="#content"]').filter({
      hasText: /skip|jump|main content/i,
    });

    const count = await skipLinks.count();
    // Skip links are optional but recommended
    // If they exist, they should work
    if (count > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
  });
});
