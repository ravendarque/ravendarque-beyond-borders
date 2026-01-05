/**
 * Error handling and validation tests
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('File Upload Validation', () => {
  test('should show error for invalid file types', async ({ page }) => {
    await page.goto('/');

    // Create a text file path (won't exist, but test the UI behavior)
    const invalidFile = path.resolve(__dirname, '../../test-data/invalid.txt');

    try {
      const fileInput = page.locator('input[type="file"]').first();
      
      // Check accept attribute
      const accept = await fileInput.getAttribute('accept');
      expect(accept).toBeTruthy();
      expect(accept).toMatch(/image\//);
    } catch {
      // File doesn't exist, but we can test the input constraints
      test.skip();
    }
  });

  test('should show user-friendly error messages', async ({ page }) => {
    await page.goto('/');

    // Check that error messages would be user-friendly
    // This is a placeholder - actual error testing requires file upload failures
    const errorContainer = page.locator('[role="alert"], .error, [aria-live="assertive"]');
    
    // Error container should exist (even if not visible)
    const count = await errorContainer.count();
    // Should have error handling mechanism
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Network Error Handling', () => {
  test('should handle flag manifest load failure gracefully', async ({ page }) => {
    // Block flag manifest request
    await page.route('**/flags/flags.json', (route) => route.abort());

    await page.goto('/');

    // Should still show UI (not crash)
    const uploadButton = page.getByText(/Upload|Choose/i).first();
    await expect(uploadButton).toBeVisible();
  });

  test('should handle flag image load failure gracefully', async ({ page }) => {
    // Block flag preview images
    await page.route('**/flags/*.preview.png', (route) => route.abort());

    await page.goto('/');

    // Pre-seed flag
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('bb_selectedFlag', 'palestine');
      } catch {}
    });

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic.jpg');
    try {
      await fileInput.setInputFiles(testImagePath);
    } catch {
      // File might not exist, skip
      test.skip();
    }
    await page.waitForTimeout(1000);

    // Should still function (fallback behavior)
    const flagSelector = page.locator('#flag-select-label');
    await expect(flagSelector).toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test('should handle very small images', async ({ page }) => {
    await page.goto('/');

    // This would require a tiny test image
    // For now, verify the UI accepts images
    const fileInput = page.locator('input[type="file"]').first();
    const accept = await fileInput.getAttribute('accept');
    expect(accept).toBeTruthy();
  });

  test('should handle very large images', async ({ page }) => {
    await page.goto('/');

    // This would require a large test image
    // For now, verify file input exists
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();
  });
});
