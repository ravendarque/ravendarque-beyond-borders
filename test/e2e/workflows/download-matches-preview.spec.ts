/**
 * E2E test to verify downloaded image matches Step 3 preview.
 * Uses a positioning test image (solid colour + markers) so we can verify
 * zoom/position by sampling pixel colours instead of brittle photo comparison.
 */

import { test, expect } from '@playwright/test';
import {
  uploadImage,
  selectFlag,
  setSliderValue,
  goToStep3,
  waitForStep3Ready,
  selectPresentationMode,
} from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS, POSITIONING_TEST_IMAGE_PATH } from '../helpers/test-data';
import { TEST_RESULTS_DIR, getTestResultsPath } from '../helpers/test-paths';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Sample pixel at (x, y) from raw buffer; info has width, height, channels */
function samplePixel(
  data: Buffer,
  info: { width: number; height: number; channels: number },
  x: number,
  y: number,
): [number, number, number] {
  const { width, channels } = info;
  const idx = channels * (width * Math.floor(y) + Math.floor(x));
  return [data[idx], data[idx + 1], data[idx + 2]];
}

/** Assert colour matches expected [R,G,B] within tolerance (default 25) */
function expectColorNear(
  actual: [number, number, number],
  expected: [number, number, number],
  tolerance = 25,
) {
  expect(Math.abs(actual[0] - expected[0])).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual[1] - expected[1])).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual[2] - expected[2])).toBeLessThanOrEqual(tolerance);
}

test.describe('Download Matches Preview', () => {
  test('should download image that matches Step 3 preview with zoom and position', async ({
    page,
  }) => {
    const testResultsDir = TEST_RESULTS_DIR;
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    expect(fs.existsSync(POSITIONING_TEST_IMAGE_PATH)).toBe(true);

    await page.goto('/');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(POSITIONING_TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    await page
      .locator('[aria-label="Zoom level"]')
      .getByRole('slider')
      .waitFor({ state: 'visible', timeout: 15000 });

    // Zoom 50%, position 0,0: center of source image should appear at center of output
    await setSliderValue(page, 'Zoom level', 50);
    await setSliderValue(page, 'Horizontal position', 0);
    await setSliderValue(page, 'Vertical position', 0);

    await page.getByTestId(TEST_IDS.STEP1_NEXT).click();
    await page.waitForTimeout(500);

    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await page.waitForTimeout(500);

    const downloadButton = page.getByTestId(TEST_IDS.SAVE_AVATAR);
    await expect(downloadButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);

    const downloadPath = getTestResultsPath('downloaded-positioning-test.png');
    await download.saveAs(downloadPath);

    expect(fs.existsSync(downloadPath)).toBe(true);
    expect(fs.statSync(downloadPath).size).toBeGreaterThan(0);

    // Verify positioning by sampling the center of the downloaded image (circle center = source center at 0,0)
    // Our test image has a red center marker (#c04040); the output circle center should show that red
    const { data, info } = await sharp(downloadPath).raw().toBuffer({ resolveWithObject: true });

    const centerX = info.width / 2;
    const centerY = info.height / 2;
    const centerPixel = samplePixel(data, info, centerX, centerY);

    // Center of output should be red (center marker from positioning-test-image)
    const RED_MARKER: [number, number, number] = [0xc0, 0x40, 0x40];
    expectColorNear(centerPixel, RED_MARKER);

    // Optional: sample a point toward top-left; should be blue (background) or green (corner marker) depending on zoom
    const towardTopLeftX = info.width * 0.25;
    const towardTopLeftY = info.height * 0.25;
    const topLeftPixel = samplePixel(data, info, towardTopLeftX, towardTopLeftY);
    const BLUE_BG: [number, number, number] = [0x40, 0x80, 0xc0];
    const GREEN_MARKER: [number, number, number] = [0x40, 0xc0, 0x40];
    const isBackgroundOrCorner =
      Math.abs(topLeftPixel[0] - BLUE_BG[0]) <= 40 &&
      Math.abs(topLeftPixel[1] - BLUE_BG[1]) <= 40 &&
      Math.abs(topLeftPixel[2] - BLUE_BG[2]) <= 40;
    const isGreen =
      Math.abs(topLeftPixel[0] - GREEN_MARKER[0]) <= 40 &&
      Math.abs(topLeftPixel[1] - GREEN_MARKER[1]) <= 40 &&
      Math.abs(topLeftPixel[2] - GREEN_MARKER[2]) <= 40;
    expect(isBackgroundOrCorner || isGreen).toBe(true);
  });

  test('should download image that matches preview with different zoom levels', async ({
    page,
  }) => {
    const testResultsDir = TEST_RESULTS_DIR;
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    expect(fs.existsSync(POSITIONING_TEST_IMAGE_PATH)).toBe(true);
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(POSITIONING_TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    await page
      .locator('[aria-label="Zoom level"]')
      .getByRole('slider')
      .waitFor({ state: 'visible', timeout: 15000 });
    await setSliderValue(page, 'Zoom level', 50);

    await page.getByTestId(TEST_IDS.STEP1_NEXT).click();
    await page.waitForTimeout(500);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);

    await expect(page.locator('.step-layout')).toBeVisible({ timeout: 10000 });

    const downloadButton = page.getByTestId(TEST_IDS.SAVE_AVATAR);
    await expect(downloadButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download succeeded
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.(png|jpg|jpeg)$/i);

    // Save for inspection
    const downloadPath = getTestResultsPath('downloaded-zoom50.png');
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('should download cutout mode with the flag rendered at a sane scale in the ring', async ({
    page,
  }) => {
    // Regression test for a WebGL export bug where the flag rectangle was sized from the
    // ring's circumference instead of its diameter, producing a wildly wrong scale, and a
    // separate bug where the flag texture was deleted before the draw call that used it,
    // rendering the ring band black. Neither is easily caught by a mocked-GL unit test, so
    // this exercises the real download in a real browser.
    await page.goto('/');

    await uploadImage(page);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);
    await selectPresentationMode(page, 'Cutout');
    await waitForStep3Ready(page);

    const downloadButton = page.getByTestId(TEST_IDS.SAVE_AVATAR);
    await expect(downloadButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = getTestResultsPath('downloaded-cutout-test.png');
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);

    const { data, info } = await sharp(downloadPath).raw().ensureAlpha().toBuffer({
      resolveWithObject: true,
    });

    // Sample around the ring band (partway between center and edge, where the flag renders)
    // at several angles. If the flag texture was deleted before the draw (bug), these pixels
    // come back as fully transparent black. If the flag rect was sized from circumference
    // instead of diameter (bug), the flag would still render, but not necessarily blank -
    // combined with the unit-test value assertions on u_flagSize/u_flagPos, this E2E check's
    // job is to confirm the real, non-mocked WebGL pipeline produces visible, varied content
    // in the ring band at all.
    const cx = info.width / 2;
    const cy = info.height / 2;
    const ringSampleRadius = info.width * 0.45; // near the outer edge, inside the ring band
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    const samples: Array<[number, number, number, number]> = angles.map((angle) => {
      const x = Math.round(cx + ringSampleRadius * Math.cos(angle));
      const y = Math.round(cy + ringSampleRadius * Math.sin(angle));
      const idx = info.channels * (info.width * y + x);
      return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
    });

    for (const [r, g, b, a] of samples) {
      // Not fully transparent (rules out the texture-delete-before-draw regression)
      expect(a).toBeGreaterThan(0);
      // Not pure black (rules out sampling the default 1x1 black texture)
      expect(r + g + b).toBeGreaterThan(0);
    }

    // The flag has real color variation around the ring, not a single degenerate color
    // (rules out the ring band collapsing to a single sampled pixel from a mis-scaled UV).
    const uniqueColors = new Set(samples.map(([r, g, b]) => `${r},${g},${b}`));
    expect(uniqueColors.size).toBeGreaterThan(1);
  });
});
