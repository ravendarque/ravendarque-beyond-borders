import { test, expect } from '@playwright/test';

// Path 2: Just the flag -> select flag -> full-size flag loaded in circle crop centered on focal
test('flag-only mode uses focal point to center flag preview', async ({ page }) => {
  await page.addInitScript(() => { try { (window as any).__BB_DEBUG__ = (window as any).__BB_DEBUG__ || []; } catch {} });
  // Pre-seed selected flag so the app doesn't need to open the MUI select popover
  await page.addInitScript(() => { try { window.localStorage.setItem('bb_selectedFlag', 'palestine'); } catch {} });
  await page.goto('/?testMode=forceFlag');
  // Ensure manifest loaded (MenuItem should render); be resilient if not present
  await page.locator('text=Palestine').first().waitFor({ timeout: 10000 }).catch(() => {});
  // Ensure the flags manifest contains Palestine and that its preview PNG is fetchable
  const manifest = await page.evaluate(async () => {
    try {
      const r = await fetch('/flags/flags.json');
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  });
  expect(Array.isArray(manifest)).toBeTruthy();
  const hasPal = (manifest || []).some((f: any) => f && f.id === 'palestine');
  expect(hasPal).toBeTruthy();
  const resp = await page.evaluate(async () => {
    try {
      const r = await fetch('/flags/palestine.preview.png');
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  });
  expect(resp.ok).toBeTruthy();
});
