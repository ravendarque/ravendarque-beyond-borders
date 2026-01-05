#!/usr/bin/env node
/**
 * Captures screenshots of the cutout mode for testing
 * Launches the app in cutout mode and takes screenshots for visual regression testing
 */

import { chromium } from 'playwright';
import fs from 'fs';
import { resolveFromScript } from './lib/paths.js';
import { logger } from './lib/logger.js';
import { exitWithError, NetworkError, FileError } from './lib/errors.js';

const outDir = resolveFromScript(import.meta.url);
const screenshotPath = resolveFromScript(import.meta.url, 'cutout-screenshot.png');
const logsPath = resolveFromScript(import.meta.url, 'cutout-console.log');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
page.on('console', (msg) => {
  const text = msg.text();
  const type = msg.type();
  const entry = { type, text };
  logs.push(entry);
  logger.debug(`[PAGE] ${type} ${text}`);
});

page.on('pageerror', (err) => {
  logs.push({ type: 'error', text: String(err) });
  logger.error('[PAGE ERROR]', err);
});

const url = 'http://localhost:5173/';
logger.info('Opening', url);

// Retry a couple times if the server is still warming up
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    break;
  } catch (err) {
    logger.warn(`page.goto failed on attempt ${attempt}:`, err.message);
    if (attempt === 3) throw err;
    await new Promise((r) => setTimeout(r, 500));
  }
}

// Generate a valid PNG in the page via an in-browser canvas to avoid external downloads
// and headless decode problems. We'll ask the page to return a dataURL and upload that.
const tmpImage = resolveFromScript(import.meta.url, 'test-image.png');
const dataUrl = await page.evaluate(() => {
  const w = 512, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  // Draw a simple, high-contrast test image
  ctx.fillStyle = '#88CCEE';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#204060';
  ctx.fillRect(56, 56, 400, 400);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '48px sans-serif';
  ctx.fillText('TEST', 120, 280);
  return c.toDataURL('image/png');
});

const base64 = dataUrl.split(',')[1];
fs.writeFileSync(tmpImage, Buffer.from(base64, 'base64'));
logger.success('Wrote generated test image to', tmpImage);

// Wait for app to initialize
await page.waitForTimeout(1000);

// Upload image: use the first input[type=file]
try {
  // Don't require visibility; many frameworks hide the native file input
  const fileInput = await page.$('input[type=file]');
  if (!fileInput) throw new Error('file input not found');
  await fileInput.setInputFiles(tmpImage);
  logger.success('Uploaded test image (via hidden input)');
} catch (uploadErr) {
  logger.warn('Upload failed:', uploadErr?.message);
}

// Wait for UI to enable controls
await page.waitForTimeout(1200);

// Select flag: attempt to set select option value 'ps' (Palestine)
// Use the first <select> element for flag
// Wait for the flag <select> to appear and choose the Palestine flag (value 'ps')
try {
  // Many UI libs render a hidden <select> or a custom list; set the underlying select value
  // Interact with the visible MUI Select: open it and click the menu item labeled 'Palestine'
  try {
    // Click the labeled control (MUI renders a button/combobox) — use Playwright's getByLabel
    const flagLabel = page.getByLabel('Flag');
    await flagLabel.click({ timeout: 3000 });
    // Click the MenuItem with the displayName
    const item = page.getByText('Palestine');
    await item.click({ timeout: 3000 });
    logger.success('Selected flag ps via visible menu');
  } catch (e) {
    logger.warn('Flag selection via visible menu failed:', e?.message);
  }
} catch (e) {
  logger.warn('Flag select evaluation failed:', e?.message);
}

// Choose Cutout radio
try {
  try {
    // Click the visible label 'Cutout' so MUI's Radio receives the event
    const radioLabel = page.getByLabel('Cutout');
    await radioLabel.click({ timeout: 2000 });
    logger.success('Set cutout radio via visible label');
  } catch (e) {
    logger.warn('Setting cutout radio via visible label failed:', e?.message);
  }
} catch (e) {
  logger.warn('Setting cutout radio failed:', e?.message);
}

// Wait for rendering to happen
await page.waitForTimeout(1500);

// Capture screenshot of the main content area
// Try to find the preview image element first
const previewImg = await page.$('img');
if (previewImg) {
  await previewImg.screenshot({ path: screenshotPath });
  logger.success('Saved preview img screenshot to', screenshotPath);
} else {
  // Fallback: full page screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true });
  logger.success('Saved full page screenshot to', screenshotPath);
}

// Save captured logs
fs.writeFileSync(logsPath, logs.map((l) => `[${l.type}] ${l.text}`).join('\n'));
logger.success('Saved logs to', logsPath);

await browser.close();
logger.success('Done');
