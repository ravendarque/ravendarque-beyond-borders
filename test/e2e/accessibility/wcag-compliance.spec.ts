/**
 * WCAG AA compliance tests using axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('WCAG AA Compliance', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have no accessibility violations after upload', async ({ page }) => {
    await page.goto('/');

    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    const testImagePath = path.resolve(__dirname, '../../test-data/profile-pic.jpg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // Filter only color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order' || v.id === 'page-has-heading-one'
    );

    expect(headingViolations).toEqual([]);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-roles'])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'aria-allowed-attr' || v.id === 'aria-required-attr' || v.id === 'aria-roles'
    );

    expect(ariaViolations).toEqual([]);
  });

  test('should support reduced motion preference', async ({ page }) => {
    await page.goto('/');

    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['prefers-reduced-motion'])
      .analyze();

    const motionViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'prefers-reduced-motion'
    );

    expect(motionViolations).toEqual([]);
  });
});
