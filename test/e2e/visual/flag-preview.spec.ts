import { test, expect } from '@playwright/test';

/**
 * Palestine flag preview: verify app loads and Palestine preview asset is available.
 * Does not rely on testMode=forceFlag or flags.json (app may not serve them).
 */
test('palestine flag preview asset is fetchable from home', async ({ page }) => {
  await page.goto('/');

  // Home shows upload / choose picture
  await expect(page.getByText(/Choose|profile picture/i).first()).toBeVisible({ timeout: 10000 });

  // Palestine preview PNG is served by the app (used on step 2 when Palestine is selected)
  const resp = await page.evaluate(async () => {
    try {
      const r = await fetch('/flags/palestine.preview.png');
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  });
  expect(resp.ok).toBe(true);
});
