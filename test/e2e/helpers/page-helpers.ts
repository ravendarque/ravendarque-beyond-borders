/**
 * Shared helper functions for E2E tests
 * Reduces duplication across test files
 */

import { Page, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEST_IDS } from './test-ids';

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
  const nextBtn = page.getByTestId(TEST_IDS.STEP1_NEXT);
  await nextBtn.waitFor({ state: 'visible', timeout: 15000 });
  await expect(nextBtn).toBeEnabled({ timeout: 15000 });
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Wait for step 2: flag selector trigger becomes visible
  await page
    .getByRole(FLAG_SELECT_TRIGGER, { name: 'Choose a flag' })
    .waitFor({ state: 'visible', timeout: 10000 });
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

  // Click the flag option by text content (exact match to avoid e.g. "Pride" matching "Trans Pride")
  const flagOption = page.getByRole('option', { name: flagName, exact: true });
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
 * Wait for step 3 to be ready: render done (signal or Save button enabled).
 * We accept either __BB_UPLOAD_DONE__ === true OR Save button enabled so WebKit
 * (where the global may not be observed by waitForFunction) still passes when render completes.
 * Fails fast with __BB_RENDER_ERROR__ if the render threw.
 * @param page - Playwright page object
 * @param timeout - Max time to wait in ms (default 30s)
 */
export async function waitForStep3Ready(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    (saveTestId: string) => {
      const w = window as unknown as {
        __BB_UPLOAD_DONE__?: boolean;
        __BB_RENDER_ERROR__?: string;
      };
      if (w.__BB_RENDER_ERROR__) {
        throw new Error(`Render failed: ${w.__BB_RENDER_ERROR__}`);
      }
      if (w.__BB_UPLOAD_DONE__ === true) return true;
      const saveBtn = document.querySelector(`[data-testid="${saveTestId}"]`);
      return !!(saveBtn && !(saveBtn as HTMLButtonElement).disabled);
    },
    TEST_IDS.SAVE_AVATAR,
    { timeout },
  );
  const saveBtn = page.getByTestId(TEST_IDS.SAVE_AVATAR);
  await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
  await expect(saveBtn).toBeEnabled({ timeout: 5000 });
}

/**
 * Click step-2 Next and wait for step 3 to be ready. Call this when already on step 2.
 * Waits for the app's async dimension detection (__BB_DIMENSIONS_READY__) before clicking Next,
 * so step 3 render runs immediately and tests are deterministic.
 * @param page - Playwright page object
 * @param timeout - Max time to wait for step 3 ready in ms (default 30s)
 */
export async function goToStep3(page: Page, timeout = 30000): Promise<void> {
  const step2Next = page.getByTestId(TEST_IDS.STEP2_NEXT);
  await step2Next.waitFor({ state: 'visible', timeout: 10000 });
  await expect(step2Next).toBeEnabled({ timeout: 10000 });
  // Wait for dimension detection so step 3 render runs (deterministic, no fixed delay)
  await page.waitForFunction(
    () =>
      (window as unknown as { __BB_DIMENSIONS_READY__?: boolean }).__BB_DIMENSIONS_READY__ === true,
    null,
    { timeout: 15000 },
  );
  await step2Next.click();
  await page.waitForTimeout(500);
  await waitForStep3Ready(page, timeout);
}

/**
 * Wait for a re-render to complete (e.g. after slider/mode/flag change).
 * When render runs, Save is disabled (isRendering); when done, Save is enabled.
 * We wait for disabled (render started) then enabled (render done).
 * @param page - Playwright page object
 * @param timeout - Max time to wait for Save to be enabled again (default 25s)
 */
export async function waitForReRender(page: Page, timeout = 25000): Promise<void> {
  const saveBtn = page.getByTestId(TEST_IDS.SAVE_AVATAR);
  await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
  await expect(saveBtn).toBeDisabled({ timeout: 5000 }).catch(() => {
    // Already re-rendering or no change triggered; proceed to wait for enabled
  });
  await expect(saveBtn).toBeEnabled({ timeout });
}

/**
 * Wait for the upload/render pipeline to complete (global __BB_UPLOAD_DONE__).
 * Use waitForStep3Ready instead when you only need "step 3 is ready to use".
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
