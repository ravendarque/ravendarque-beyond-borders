const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve(__dirname);
  const screenshotPath = path.join(outDir, 'cutout-screenshot.png');
  const logsPath = path.join(outDir, 'cutout-console.log');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    const entry = { type, text };
    logs.push(entry);
    // also print to node console
    console.log('[PAGE]', type, text);
  });

  page.on('pageerror', (err) => {
    logs.push({ type: 'error', text: String(err) });
    console.error('[PAGE ERROR]', err);
  });

  const url = 'http://localhost:5174/';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // create small test png (10x10) from base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAHUlEQVQoU2NkYGBg+M8ABYwMDAwMgA0YwGAAAwB2cNn1Xo5AAAAAElFTkSuQmCC';
  const tmpImage = path.join(outDir, 'test-image.png');
  fs.writeFileSync(tmpImage, Buffer.from(pngBase64, 'base64'));

  // Wait a bit for app to initialize
  await page.waitForTimeout(500);

  // Upload image: use the first input[type=file]
  const fileInputs = await page.$$('input[type=file]');
  if (fileInputs.length === 0) throw new Error('file input not found');
  await fileInputs[0].setInputFiles(tmpImage);
  console.log('Uploaded test image');

  // Wait for UI to enable controls
  await page.waitForTimeout(600);

  // Select flag: attempt to set select option value 'ps' (Palestine)
  // Use the first <select> element for flag
  const selects = await page.$$('select');
  if (selects.length === 0) throw new Error('no select elements found');
  try {
    await selects[0].selectOption({ value: 'ps' });
    console.log('Selected flag ps');
  } catch (e) {
    console.warn('Failed to select flag ps', e);
  }

  // Choose Cutout radio
  const cutoutRadio = await page.$('input[type=radio][value=cutout]');
  if (cutoutRadio) {
    await cutoutRadio.check();
    console.log('Checked cutout radio');
  } else {
    console.warn('cutout radio not found');
  }

  // Wait for rendering to happen
  await page.waitForTimeout(1500);

  // Capture screenshot of the main content area
  // Try to find the preview image element first
  const previewImg = await page.$('img');
  if (previewImg) {
    await previewImg.screenshot({ path: screenshotPath });
    console.log('Saved preview img screenshot to', screenshotPath);
  } else {
    // fallback: full page screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved full page screenshot to', screenshotPath);
  }

  // Save captured logs
  fs.writeFileSync(logsPath, logs.map((l) => `[${l.type}] ${l.text}`).join('\n'));
  console.log('Saved logs to', logsPath);

  await browser.close();
  console.log('Done');
})();
