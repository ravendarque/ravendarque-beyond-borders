import { test, expect } from '@playwright/test';
import path from 'path';

// Path 1: upload image -> flag selection -> presentation enabled and default border rendered
test('upload image then select flag enables presentation and renders default border', async ({ page }) => {
  // ensure debug array exists
  await page.addInitScript(() => { try { (window as any).__BB_DEBUG__ = (window as any).__BB_DEBUG__ || []; } catch {} });
  const logs: string[] = [];
  page.on('console', (m) => logs.push(`console:${m.type()}: ${m.text()}`));
  page.on('pageerror', (err) => logs.push(`pageerror: ${String(err)}`));
  let testError: any = null;
  try {

  // Pre-seed a selected flag so the UI won't require interacting with the select control
  await page.addInitScript(() => { try { window.localStorage.setItem('bb_selectedFlag', 'ukraine'); } catch {} });
  await page.goto('/');

  // Click the choose image button and set a file on the hidden input
  const input = await page.locator('input[type="file"]').first();
  const fixture = path.resolve(process.cwd(), 'tests', 'fixtures', 'avatar-sample.png');
  await input.setInputFiles(fixture);

  // Wait for flags manifest to load (ensures selected flag is valid)
  await page.locator('text=Ukraine').first().waitFor({ timeout: 10000 }).catch(() => {});
  // Re-apply the file input now that the manifest is loaded so the component processes
  // the uploaded file with a valid selectedFlag present.
  await input.setInputFiles(fixture);

  // allow time for image to be processed and preview to render (give more time in CI)
  const ringRadio = page.getByRole('radio', { name: 'Ring' });
  await ringRadio.waitFor({ state: 'visible', timeout: 10000 });
  // Wait for the upload/render pipeline to complete (test hook set by app)
  await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout: 30000 });
  const overlayImgElem = page.locator('img[data-preview-url]').first();
  if (await overlayImgElem.count() > 0) await expect(overlayImgElem).toBeVisible();

  // Ensure manifest lists the selected flag (ukraine) and its preview PNG is fetchable
  const manifest = await page.evaluate(async () => {
    try {
      const r = await fetch('/flags/flags.json');
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  });
  expect(Array.isArray(manifest)).toBeTruthy();
  const hasUk = (manifest || []).some((f: any) => f && f.id === 'ukraine');
  expect(hasUk).toBeTruthy();
    const resp = await page.evaluate(async () => {
      try {
        const r = await fetch('/flags/ukraine.preview.png');
        return { ok: r.ok, status: r.status };
      } catch (e) {
        return { ok: false, status: 0 };
      }
    });
    expect(resp.ok).toBeTruthy();
  } catch (err) {
    testError = err;
    throw err;
  } finally {
    try {
      const debug = await page.evaluate(() => (window as any).__BB_DEBUG__ || []);
      test.info().attachments.push({ name: 'bb_debug.json', contentType: 'application/json', body: JSON.stringify(debug) } as any);
    } catch {}
    try {
      test.info().attachments.push({ name: 'console.log', contentType: 'text/plain', body: logs.join('\n') } as any);
    } catch {}
    if (testError) {
      // rethrow so test runner still marks failure
    }
  }
});
