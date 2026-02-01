/**
 * Shared helper functions for E2E tests
 * Reduces duplication across test files
 */

import { Page, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the path to the test image
 */
export function getTestImagePath(): string {
  return path.resolve(__dirname, '../../test-data/profile-pic-square-clr-256x256.jpg');
}

/**
 * Upload an image file to the page
 * @param page - Playwright page object
 * @param imagePath - Optional path to image file (defaults to test image)
 */
/** Selector for the flag dropdown trigger (visible on step 2). */
const FLAG_SELECT_TRIGGER = 'combobox';

export async function uploadImage(page: Page, imagePath?: string): Promise<void> {
  const fileInput = page.locator('input[type="file"]').first();
  const testImagePath = imagePath || getTestImagePath();

  await fileInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1000);

  // Verify no error message
  const errorCount = await page
    .getByText(/Invalid file type|File too large|Image dimensions too large/)
    .count();
  expect(errorCount).toBe(0);

  // Step 1 has a "NEXT" button; user must click it to go to step 2 (no auto-advance)
  const nextBtn = page.getByRole('button', { name: 'Go to next step' });
  await nextBtn.waitFor({ state: 'visible', timeout: 15000 });
  await expect(nextBtn).toBeEnabled({ timeout: 15000 });
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Wait for step 2: flag selector trigger becomes visible
  await page.getByRole(FLAG_SELECT_TRIGGER, { name: 'Choose a flag' }).waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Select a flag from the dropdown
 * @param page - Playwright page object
 * @param flagName - Name of the flag to select (exact match)
 */
export async function selectFlag(page: Page, flagName: string): Promise<void> {
  // Open the flag dropdown (trigger has aria-label "Choose a flag"; Radix gives it role combobox)
  await page.getByRole(FLAG_SELECT_TRIGGER, { name: 'Choose a flag' }).click();

  // Wait for menu to open
  await page.waitForTimeout(300);

  // Click the flag option by text content
  const flagOption = page.getByRole('option', { name: flagName });
  await flagOption.click();

  // Wait for flag to load and render
  await page.waitForTimeout(800);
}

/**
 * Select a presentation mode (Ring, Segment, or Cutout)
 * UI uses buttons with aria-pressed in a radiogroup, not actual radio inputs.
 */
export async function selectPresentationMode(
  page: Page,
  mode: 'Ring' | 'Segment' | 'Cutout',
): Promise<void> {
  const modeButton = page.getByRole('button', { name: new RegExp(`^${mode}`) });
  await modeButton.click();

  // Wait for re-render
  await page.waitForTimeout(500);
}

/**
 * Set a slider value by its accessible name (aria-label on Radix Slider.Root).
 * Radix uses a <span role="slider"> thumb, not <input type="range">, so we use
 * keyboard (focus + ArrowRight/ArrowLeft) to set the value.
 */
export async function setSliderValue(page: Page, label: string, value: number): Promise<void> {
  const root = page.locator(`[aria-label="${label}"]`);
  const slider = root.getByRole('slider');

  await slider.waitFor({ state: 'visible', timeout: 10000 });
  await slider.focus();

  const currentStr = await slider.getAttribute('aria-valuenow');
  const current = parseInt(currentStr ?? '0', 10);
  const steps = value - current;
  const key = steps > 0 ? 'ArrowRight' : 'ArrowLeft';
  for (let i = 0; i < Math.abs(steps); i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
  }

  // Wait for debounce and re-render (150ms debounce + render time)
  await page.waitForTimeout(400);
}

/**
 * Wait for the upload/render pipeline to complete
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForRenderComplete(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(() => !!(window as any).__BB_UPLOAD_DONE__, null, { timeout });
}

/**
 * Pre-seed localStorage with a selected flag
 * @param page - Playwright page object
 * @param flagId - Flag ID to pre-select
 */
export async function preSelectFlag(page: Page, flagId: string): Promise<void> {
  await page.addInitScript((flagId) => {
    try {
      window.localStorage.setItem('bb_selectedFlag', flagId);
    } catch {}
  }, flagId);
}

/**
 * Pre-seed sessionStorage with an image URL
 * @param page - Playwright page object
 * @param imageUrl - Image URL to pre-seed
 */
export async function preSeedImage(page: Page, imageUrl: string): Promise<void> {
  await page.addInitScript((url) => {
    try {
      sessionStorage.setItem('workflow-imageUrl', url);
    } catch {}
  }, imageUrl);
}

/**
 * Verify canvas has content (not blank)
 * @param page - Playwright page object
 */
export async function verifyCanvasHasContent(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Check if there are any non-transparent pixels
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true; // Found non-transparent pixel
      }

      return false;
    },
    { timeout: 10000 },
  );
}
