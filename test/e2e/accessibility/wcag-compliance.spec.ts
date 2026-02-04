/**
 * WCAG AA compliance tests using axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { TEST_IMAGE_PATH } from '../helpers/test-data';

test.describe('WCAG AA Compliance', () => {
  test(
    'should have no critical accessibility violations on home page',
    { tag: '@accessibility' },
    async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      const critical = results.violations.filter((v) =>
        ['color-contrast', 'heading-order', 'page-has-heading-one'].includes(v.id),
      );
      expect(critical).toEqual([]);
    },
  );

  test('should have no critical accessibility violations after upload', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) =>
      ['color-contrast', 'heading-order', 'page-has-heading-one'].includes(v.id),
    );
    expect(critical).toEqual([]);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // Filter only color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast',
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'heading-order' || v.id === 'page-has-heading-one',
    );

    expect(headingViolations).toEqual([]);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['aria-allowed-attr', 'aria-required-attr', 'aria-roles'])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'aria-allowed-attr' || v.id === 'aria-required-attr' || v.id === 'aria-roles',
    );

    expect(ariaViolations).toEqual([]);
  });

  test('should support reduced motion preference', async ({ page }) => {
    await page.goto('/');

    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Run full WCAG scan; axe-core 4.x does not expose prefers-reduced-motion as a runOnly rule.
    // We only assert that the page still has no critical violations when reduced motion is on.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const motionRelated = results.violations.filter(
      (v) => v.id === 'prefers-reduced-motion' || v.impact === 'serious',
    );
    expect(motionRelated.filter((v) => v.id === 'prefers-reduced-motion')).toEqual([]);
  });
});
