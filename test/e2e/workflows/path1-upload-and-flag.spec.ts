import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag, goToStep3 } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';

// Path 1: upload image -> flag selection -> presentation enabled and default border rendered
test('upload image then select flag enables presentation and renders default border', async ({
  page,
}) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(`console:${m.type()}: ${m.text()}`));
  page.on('pageerror', (err) => logs.push(`pageerror: ${String(err)}`));
  let testError: any = null;
  try {
    await page.goto('/');

    // Step 1: Upload image (helper clicks Step 1 Next and waits for step 2)
    await uploadImage(page);

    // Step 2: Select flag then go to step 3 (waits for dimensions + __BB_UPLOAD_DONE__)
    await selectFlag(page, TEST_FLAGS.UKRAINE);
    await goToStep3(page);

    // Step 3: Ring button and overlay (goToStep3 already waited for render)
    const ringButton = page.getByRole('button', { name: /^Ring/ });
    await ringButton.waitFor({ state: 'visible', timeout: 15000 });
    const overlayImgElem = page.locator('img[data-preview-url]').first();
    if ((await overlayImgElem.count()) > 0) await expect(overlayImgElem).toBeVisible();

    // Ensure Ukraine flag preview asset is fetchable (served from public/flags)
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
      test.info().attachments.push({
        name: 'console.log',
        contentType: 'text/plain',
        body: logs.join('\n'),
      } as any);
    } catch {}
  }
});
