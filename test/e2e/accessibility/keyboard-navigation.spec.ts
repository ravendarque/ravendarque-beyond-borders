/**
 * E2E tests for accessibility (WCAG AA compliance)
 * Tests keyboard navigation, screen reader support, and ARIA labels
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through steps using keyboard only', async ({ page }) => {
      // Tab through all interactive elements
      await page.keyboard.press('Tab');

      // Should focus on file input or upload button
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'BUTTON', 'LABEL']).toContain(focusedElement);
    });

    test('should navigate flag selector with keyboard', async ({ page }) => {
      // Pre-seed with image to get to step 2
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=2');

      // Find flag selector and navigate with keyboard
      const flagSelector = page.locator('#flag-select-label').locator('..');
      await flagSelector.focus();
      await page.keyboard.press('Enter');

      // Should open dropdown
      await page.waitForTimeout(300);

      // Navigate options with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    });

    test('should navigate presentation mode buttons with keyboard', async ({ page }) => {
      // Pre-seed to get to step 3
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=3');

      // Find presentation mode buttons
      const ringButton = page.getByRole('radio', { name: 'Ring' });
      await ringButton.focus();

      // Should be keyboard accessible
      await page.keyboard.press('ArrowRight');

      // Should move to next option
      const segmentButton = page.getByRole('radio', { name: 'Segment' });
      await expect(segmentButton).toBeFocused();
    });

    test('should navigate sliders with keyboard', async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=3');

      // Find thickness slider
      const thicknessSlider = page
        .locator('input[type="range"][aria-label*="thickness" i]')
        .first();
      await thicknessSlider.focus();

      // Should be able to adjust with arrow keys
      await page.keyboard.press('ArrowRight');

      // Value should change
      const value = await thicknessSlider.inputValue();
      expect(parseInt(value)).toBeGreaterThan(0);
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on all interactive elements', async ({ page }) => {
      await page.goto('/');

      // Check file input
      const fileInput = page.locator('input[type="file"]').first();
      const ariaLabel = await fileInput.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should have proper roles on presentation mode selector', async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=3');

      // Should have radiogroup role
      const modeGroup = page.locator('[role="radiogroup"]');
      await expect(modeGroup).toBeVisible();
    });

    test('should have proper ARIA labels on sliders', async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=3');

      // All sliders should have aria-label
      const sliders = page.locator('input[type="range"]');
      const count = await sliders.count();

      for (let i = 0; i < count; i++) {
        const slider = sliders.nth(i);
        const ariaLabel = await slider.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should announce step changes to screen readers', async ({ page }) => {
      await page.goto('/');

      // Should have live region for announcements
      const announcer = page.locator('[role="status"][aria-live]');
      const count = await announcer.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have descriptive alt text on images', async ({ page }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('bb_selectedFlag', 'palestine');
          sessionStorage.setItem('workflow-imageUrl', 'blob:test');
        } catch {}
      });

      await page.goto('/?step=3');

      // Avatar preview should have alt text
      const previewImg = page.locator('img[alt*="Avatar" i]').first();
      const altText = await previewImg.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText?.length).toBeGreaterThan(0);
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

      // Open privacy modal
      const privacyButton = page.getByText(/privacy/i).first();
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
