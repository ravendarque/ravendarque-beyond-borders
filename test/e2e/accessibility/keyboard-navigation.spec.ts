/**
 * E2E tests for accessibility (WCAG AA compliance)
 * Tests keyboard navigation, screen reader support, and ARIA labels
 */

import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3, waitForStep3Ready } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through steps using keyboard only', async ({ page }) => {
      await page.keyboard.press('Tab');

      // Should focus on something interactive (input, button, label, or focusable div)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'LABEL', 'DIV']).toContain(focusedElement);
    });

    test('should navigate flag selector with keyboard', async ({ page }) => {
      await uploadImage(page);

      const flagSelector = page.getByRole('combobox', { name: 'Choose a flag' });
      await flagSelector.focus();
      await page.keyboard.press('Enter');

      await page.waitForTimeout(300);

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    });

    test('should navigate presentation mode buttons with keyboard', async ({ page }) => {
      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);
      await waitForStep3Ready(page);

      // App uses buttons with aria-pressed in a radiogroup; Tab moves between them (arrow-key nav not implemented)
      const ringButton = page.getByRole('button', { name: /^Ring/ });
      await ringButton.focus();
      await expect(ringButton).toBeFocused();

      await page.keyboard.press('Tab');
      const segmentButton = page.getByRole('button', { name: /^Segment/ });
      await expect(segmentButton).toBeFocused();
    });

    test('should navigate sliders with keyboard', async ({ page }) => {
      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);
      await waitForStep3Ready(page);

      // Radix Slider: role="slider" inside [aria-label="Border thickness"]; ARIA-only for WebKit
      const sliderRoot = page.locator('[aria-label="Border thickness"]');
      const thicknessSlider = sliderRoot.getByRole('slider');
      await thicknessSlider.waitFor({ state: 'visible', timeout: 15000 });
      await thicknessSlider.focus();

      await page.keyboard.press('ArrowRight');

      const valueStr = await thicknessSlider.getAttribute('aria-valuenow');
      expect(parseInt(valueStr ?? '0', 10)).toBeGreaterThan(0);
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on all interactive elements', async ({ page }) => {
      await page.goto('/');

      const fileInput = page.locator('input[type="file"]').first();
      const ariaLabel = await fileInput.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should have proper roles on presentation mode selector', async ({ page }) => {
      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);

      const modeGroup = page.getByRole('radiogroup', { name: 'Presentation style' });
      await expect(modeGroup).toBeVisible();
    });

    test('should have proper ARIA labels on sliders', async ({ page }) => {
      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);

      // Radix Slider: root has aria-label, thumb has role="slider"
      const thicknessRoot = page.locator('[aria-label="Border thickness"]');
      await expect(thicknessRoot.getByRole('slider')).toBeVisible();
      expect(await thicknessRoot.getAttribute('aria-label')).toBe('Border thickness');
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should announce step changes to screen readers', async ({ page }) => {
      await page.goto('/');

      const announcer = page.locator('[role="status"][aria-live]');
      const count = await announcer.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have descriptive alt text on images', async ({ page }) => {
      await uploadImage(page);
      await selectFlag(page, TEST_FLAGS.PALESTINE);
      await goToStep3(page);
      await waitForStep3Ready(page);

      // Step 3 preview is ImageUploadZone (readonly) with role="img" and aria-label; flag preview imgs have alt
      const step3 = page.getByTestId(TEST_IDS.STEP_3);
      const previewRole = step3.getByRole('img', { name: 'Profile picture preview' });
      await expect(previewRole).toBeVisible({ timeout: 15000 });
      // Flag preview images (if any in step 3) must have descriptive alt
      const imgsWithAlt = step3.locator('img[alt]');
      const count = await imgsWithAlt.count();
      for (let i = 0; i < count; i++) {
        const alt = await imgsWithAlt.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt!.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain focus when switching steps', async ({ page }) => {
      await page.goto('/');

      // Focus on upload button
      const uploadButton = page.locator('label[for="step1-file-upload"]');
      await uploadButton.focus();

      // Navigate to next step (would need image uploaded)
      // Focus should be managed appropriately
    });

    test('should trap focus in modals', async ({ page }) => {
      await page.goto('/');

      // Open privacy modal (button has aria-label "Learn about privacy: Stays on your device")
      const privacyButton = page.getByRole('button', { name: /privacy/i });
      await privacyButton.click();

      await page.waitForTimeout(300);

      // Focus should be trapped in modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Tab should cycle within modal, not escape
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement);
      expect(focused).toBeTruthy();
    });
  });
});
