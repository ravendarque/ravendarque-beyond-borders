#!/usr/bin/env node
/**
 * Analyzes PNG files to check canvas usage and transparency
 * Loads a PNG file, computes the non-transparent bounding box, and reports coverage percentages
 */

import { resolveFromScript } from './lib/paths.js';
import { logger } from './lib/logger.js';
import { loadOptionalDep } from './lib/deps.js';
import { exitWithError, FileError } from './lib/errors.js';
import fs from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (!args[0]) {
  logger.error('Usage: node scripts/inspect-flag-raster.js <path/to/png>');
  process.exit(2);
}

const file = resolve(process.cwd(), args[0]);
if (!fs.existsSync(file)) {
  exitWithError(new FileError('File not found', file), 2);
}

const playwright = await loadOptionalDep('playwright');
if (!playwright) {
  logger.error('Playwright not installed');
  process.exit(2);
}

const { chromium } = playwright;
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await context.newPage();
const buf = fs.readFileSync(file);
const b64 = buf.toString('base64');
const mime = 'image/png';
const dataUrl = `data:${mime};base64,${b64}`;
const html = `<!doctype html><html><body style="margin:0"><img id=img src="${dataUrl}"></body></html>`;
await page.setContent(html);
await page.waitForSelector('#img');
const res = await page.evaluate(async () => {
  const img = document.getElementById('img');
  await new Promise((r) => { if (img.complete) r(); else img.onload = r; });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let hasNonTransparent = false;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 0) {
        hasNonTransparent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!hasNonTransparent) {
    return { usedW: 0, usedH: 0, pctW: 0, pctH: 0, canvasW: canvas.width, canvasH: canvas.height };
  }
  const usedW = maxX - minX + 1;
  const usedH = maxY - minY + 1;
  const pctW = (usedW / canvas.width) * 100;
  const pctH = (usedH / canvas.height) * 100;
  return { usedW, usedH, pctW, pctH, canvasW: canvas.width, canvasH: canvas.height, minX, minY, maxX, maxY };
});

logger.info(`Canvas: ${res.canvasW}×${res.canvasH}`);
logger.info(`Used area: ${res.usedW}×${res.usedH} (${res.pctW.toFixed(1)}% width, ${res.pctH.toFixed(1)}% height)`);
if (res.minX !== undefined) {
  logger.info(`Bounding box: (${res.minX}, ${res.minY}) to (${res.maxX}, ${res.maxY})`);
}

await browser.close();
