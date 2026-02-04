import { test } from '@playwright/test';
import { uploadImage, selectFlag } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

/** Read render debug state from the page (for when signal never fires). */
async function getRenderDebug(page: { evaluate: (fn: () => unknown) => Promise<unknown> }) {
  return page.evaluate(() => {
    const w = window as unknown as {
      __BB_RENDER_STAGE__?: string;
      __BB_RENDER_ERROR__?: string;
      __BB_UPLOAD_DONE__?: boolean;
    };
    return {
      stage: w.__BB_RENDER_STAGE__ ?? '(not set)',
      error: w.__BB_RENDER_ERROR__ ?? '(none)',
      uploadDone: w.__BB_UPLOAD_DONE__,
    };
  });
}

/**
 * One-off benchmark: how long does the Step 3 render actually take?
 * Run with: pnpm exec playwright test render-timing --project=chromium
 * (or --project=webkit / firefox). On WebKit timeout, check attachment for __BB_RENDER_STAGE__.
 */
test('measure time from Step 2 Next click until render complete', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));

  await page.goto('/');
  await uploadImage(page);
  await selectFlag(page, TEST_FLAGS.UKRAINE);

  const step2Next = page.getByTestId(TEST_IDS.STEP2_NEXT);
  await step2Next.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(
    () => (window as unknown as { __BB_DIMENSIONS_READY__?: boolean }).__BB_DIMENSIONS_READY__ === true,
    null,
    { timeout: 15000 },
  );
  await step2Next.click();
  await page.waitForTimeout(300);

  const start = Date.now();
  try {
    await page.waitForFunction(
      () => (window as unknown as { __BB_UPLOAD_DONE__?: boolean }).__BB_UPLOAD_DONE__ === true,
      null,
      { timeout: 30000 },
    );
  } catch (e) {
    const debug = await getRenderDebug(page);
    const body = [
      `__BB_RENDER_STAGE__: ${debug.stage}`,
      `__BB_RENDER_ERROR__: ${debug.error}`,
      `__BB_UPLOAD_DONE__: ${debug.uploadDone}`,
      '',
      '--- console ---',
      ...logs.slice(-50),
    ].join('\n');
    await test.info().attach('render-debug-on-timeout', { body, contentType: 'text/plain' });
    throw e;
  }
  const elapsed = Date.now() - start;

  // eslint-disable-next-line no-console
  console.log(`[render-timing] Step 3 render took ${elapsed} ms`);
  test.info().annotations.push({ type: 'render-ms', description: String(elapsed) });
});
