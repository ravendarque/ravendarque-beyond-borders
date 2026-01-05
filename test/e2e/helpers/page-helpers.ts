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
  return path.resolve(__dirname, '../../test-data/profile-pic.jpg');
}

/**
 * Upload an image file to the page
 * @param page - Playwright page object
 * @param imagePath - Optional path to image file (defaults to test image)
 */
export async function uploadImage(page: Page, imagePath?: string): Promise<void> {
  const fileInput = page.locator('input[type="file"]').first();
  const testImagePath = imagePath || getTestImagePath();
  
  await fileInput.setInputFiles(testImagePath);
  await page.waitForTimeout(1000);
  
  // Verify no error message
  const errorCount = await page.getByText(/Invalid file type|File too large|Image dimensions too large/).count();
  expect(errorCount).toBe(0);
}

/**
 * Select a flag from the dropdown
 * @param page - Playwright page object
 * @param flagName - Name of the flag to select (exact match)
 */
export async function selectFlag(page: Page, flagName: string): Promise<void> {
  // Find the Select component by its label
  const flagSelector = page.locator('#flag-select-label').locator('..');
  await flagSelector.click();
  
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
 * @param page - Playwright page object
 * @param mode - Presentation mode to select
 */
export async function selectPresentationMode(
  page: Page,
  mode: 'Ring' | 'Segment' | 'Cutout'
): Promise<void> {
  const modeRadio = page.getByRole('radio', { name: mode });
  await modeRadio.check();
  
  // Wait for re-render
  await page.waitForTimeout(500);
}

/**
 * Set a slider value by its label
 * @param page - Playwright page object
 * @param label - Label text of the slider
 * @param value - Value to set
 */
export async function setSliderValue(page: Page, label: string, value: number): Promise<void> {
  // Create the aria-labelledby id from the label
  const labelId = label.replace(/\s+/g, '-').toLowerCase() + '-label';
  
  // Find the slider by its aria-labelledby attribute
  const slider = page.locator(`input[type="range"][aria-labelledby="${labelId}"]`);
  
  // Wait for slider to be visible
  await slider.waitFor({ state: 'visible', timeout: 5000 });
  
  await slider.fill(value.toString());
  
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
  await page.waitForFunction(() => {
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
  }, { timeout: 10000 });
}
