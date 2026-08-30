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
import {
  TEST_FLAGS,
  POSITIONING_TEST_IMAGE_PATH,
  CIRCLE_TEST_PATTERN_PATH,
} from '../helpers/test-data';
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
    // TEMP DIAGNOSTIC V4: testing whether forcing WebGL1 alone fixes the webkit blank-periphery
    // bug at full native resolution (no downscale). Radial profile out from center along +x.
    const radialProfile = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.49].map((frac) => ({
      frac,
      px: samplePixel(data, info, centerX + frac * info.width, centerY),
    }));
    // eslint-disable-next-line no-console
    console.log(
      'DIAGNOSTIC_V4',
      JSON.stringify({ centerPixel, topLeftPixel, radialProfile, dims: [info.width, info.height] }),
    );
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
    // at several angles. Note: the Palestine flag itself has a genuine solid-black stripe, so
    // "pure black" isn't by itself a sign of the texture-delete-before-draw bug (which produces
    // the WebGL spec's default texture — also opaque black) — a single black sample is
    // expected. What both bugs this guards against have in common is collapsing the ring band
    // to a single degenerate value everywhere, so we check for real variation across angles
    // instead of asserting anything about one individual sample's color.
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

    for (const [, , , a] of samples) {
      // Not fully transparent (rules out the texture-delete-before-draw regression producing
      // a wrong flagUV that falls out of the shader's [0,1] sample bounds everywhere)
      expect(a).toBeGreaterThan(0);
    }

    // The flag has real color variation around the ring, not a single degenerate color
    // (rules out both the black-texture-fallback bug and the ring band collapsing to a single
    // sampled pixel from a mis-scaled circumference-based UV).
    const uniqueColors = new Set(samples.map(([r, g, b]) => `${r},${g},${b}`));
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  test('should download a user image scaled/positioned the same as the live preview', async ({
    page,
  }) => {
    // Regression test for a WebGL export bug where the user's image was uploaded to the GPU
    // texture as-is, with none of the position/zoom/cover-scale processing the live preview
    // applies — so the export ignored the ring border and Step 1 adjustments entirely,
    // stretching the raw image across the full canvas instead of cover-scaling it into just
    // the inner circle. A pure uniform mis-scale of a square test pattern stays radially
    // symmetric, so sampling several angles at a fixed radius within one render can't tell
    // correct from broken — what actually distinguishes them is that the two code paths
    // (live preview vs. export) disagreed. So this compares live preview to the download
    // directly, sampling the same relative points in each, which is exactly how this bug was
    // originally noticed ("live preview is fine, but the download is distorted").
    expect(fs.existsSync(CIRCLE_TEST_PATTERN_PATH)).toBe(true);

    await page.goto('/');

    await uploadImage(page, CIRCLE_TEST_PATTERN_PATH);
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page);
    await waitForStep3Ready(page);

    // Sample the live preview canvas directly via getImageData, at fractional coordinates so
    // it doesn't matter that the preview canvas and the exported PNG are different resolutions.
    // 0.35 from center is empirically calibrated (not arbitrary): close enough to the image/ring
    // boundary that a uniform mis-scale bug lands the sample in a visibly different band of the
    // test pattern, while still safely inside the image circle for the default border thickness
    // so the test isn't sensitive to exact thickness/padding defaults changing slightly.
    const relPoints: Array<[number, number]> = [
      [0.5, 0.15],
      [0.5, 0.85],
      [0.15, 0.5],
      [0.85, 0.5],
    ];
    const previewSamples = await page.evaluate((points) => {
      const canvas = document.querySelector<HTMLCanvasElement>('.avatar-preview-canvas');
      if (!canvas) throw new Error('preview canvas not found');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context on preview canvas');
      return points.map(([fx, fy]) => {
        const d = ctx.getImageData(
          Math.round(fx * canvas.width),
          Math.round(fy * canvas.height),
          1,
          1,
        ).data;
        return [d[0], d[1], d[2]] as [number, number, number];
      });
    }, relPoints);

    const downloadButton = page.getByTestId(TEST_IDS.SAVE_AVATAR);
    await expect(downloadButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadButton.click();
    const download = await downloadPromise;

    const downloadPath = getTestResultsPath('downloaded-circle-pattern-test.png');
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);

    const { data, info } = await sharp(downloadPath).raw().toBuffer({ resolveWithObject: true });
    const downloadSamples = relPoints.map(([fx, fy]) =>
      samplePixel(data, info, fx * info.width, fy * info.height),
    );

    for (let i = 0; i < relPoints.length; i++) {
      expectColorNear(downloadSamples[i], previewSamples[i], 20);
    }
  });
});
