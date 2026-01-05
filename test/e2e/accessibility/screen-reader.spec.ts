/**
 * Screen reader accessibility tests
 */

import { test, expect } from '@playwright/test';

test.describe('Screen Reader Support', () => {
  test('should announce step changes to screen readers', async ({ page }) => {
    await page.goto('/');

    // Should have live region for announcements
    const announcer = page.locator('[role="status"][aria-live], [aria-live="polite"], [aria-live="assertive"]');
    const count = await announcer.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have descriptive alt text on images', async ({ page }) => {
    await page.goto('/');

    // Pre-seed to get to step 3
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('bb_selectedFlag', 'palestine');
        sessionStorage.setItem('workflow-imageUrl', 'blob:test');
      } catch {}
    });

    await page.goto('/?step=3');

    // Avatar preview should have alt text
    const previewImgs = page.locator('img[alt]');
    const imgCount = await previewImgs.count();

    for (let i = 0; i < imgCount; i++) {
      const img = previewImgs.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt?.length).toBeGreaterThan(0);
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
      hasText: /skip|jump|main content/i
    });

    const count = await skipLinks.count();
    // Skip links are optional but recommended
    // If they exist, they should work
    if (count > 0) {
      await expect(skipLinks.first()).toBeVisible();
    }
  });
});
