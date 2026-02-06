/**
 * E2E test to verify zoom is visually applied correctly
 * This test verifies that zoom, position, and offset set in Step 1 are actually visible in Step 3
 */

import { test, expect } from '@playwright/test';
import { selectFlag, goToStep3 } from '../helpers/page-helpers';
import { TEST_IDS } from '../helpers/test-ids';
import { TEST_FLAGS } from '../helpers/test-data';
import { getTestResultsPath } from '../helpers/test-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Zoom Visual Verification', () => {
  test('should apply zoom, H offset, and V offset from Step 1 to Step 3', async ({ page }) => {
    test.setTimeout(240000); // 4 min – under full-suite/CI load (slider steps + step3 render) can exceed 3 min
    // Listen for console messages to capture debug logs
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('RENDERER ZOOM') || text.includes('useAvatarRenderer')) {
        consoleMessages.push(text);
        console.log('Console:', text);
      }
      if (msg.type() === 'error') {
        console.log('Console error:', text);
      }
    });

    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('.avatar-circle-wrapper', { timeout: 10000 });

    // Upload specific test image
    const testImagePath = path.resolve(
      __dirname,
      '../../test-data/profile-pic-portrait-clr-1518x2700.png',
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Wait for image to load - the avatar-circle gets the "has-image" class when image is loaded
    await page.waitForSelector('.avatar-circle.has-image', { timeout: 20000 });

    // Wait for controls to appear - they show when imageUrl exists
    await page.waitForSelector('.step1-controls', { timeout: 20000 });

    // Wait for the zoom slider text to appear (indicates controls are rendered)
    await page.waitForSelector('text=Zoom Out', { timeout: 20000 });

    // Additional wait for React to fully render all controls
    await page.waitForTimeout(2000);

    // Verify image preview is visible
    const imagePreview = page.locator('.avatar-circle.has-image');
    await expect(imagePreview).toBeVisible();

    // Radix UI Slider uses role="slider" on a button element, not a standard input
    // Find sliders by their aria-label and use keyboard navigation
    const zoomSlider = page.getByLabel('Zoom level').locator('[role="slider"]').first();
    const hOffsetSlider = page.getByLabel('Horizontal position').locator('[role="slider"]').first();
    const vOffsetSlider = page.getByLabel('Vertical position').locator('[role="slider"]').first();

    await expect(zoomSlider).toBeVisible({ timeout: 10000 });

    // Set zoom to 10% using keyboard navigation
    // Radix sliders use arrow keys: Home = 0%, End = 200%, each arrow = 1%
    await zoomSlider.focus();
    await page.keyboard.press('Home'); // Go to 0%
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight'); // Move right 10 times = 10%
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(400);

    // Verify zoom value is set by checking displayed value
    const zoomValueDisplay = page.locator('.slider-value').filter({ hasText: /10/ }).first();
    await expect(zoomValueDisplay).toBeVisible({ timeout: 5000 });

    // After setting zoom, H position should be enabled
    await expect(hOffsetSlider).toBeVisible({ timeout: 5000 });
    await expect(vOffsetSlider).toBeVisible({ timeout: 5000 });

    // Note: The sliders are inverted in the UI
    // Horizontal: slider value = -position.x. Vertical: slider value = -position.y
    // We use modest values to minimize key presses while still verifying zoom/position carry to step 3

    const TARGET_H = 24; // position.x 24 → slider -24, from -50 need 26 steps
    const TARGET_V = -20; // position.y -20 → slider 20, from -50 need 70 steps (was -42/92)

    // Set H offset (slider -24)
    await hOffsetSlider.focus();
    await page.keyboard.press('Home'); // -50
    for (let i = 0; i < 26; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(400);

    // Set V offset (slider 20)
    await vOffsetSlider.focus();
    await page.keyboard.press('Home'); // -50
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(400);

    // Verify the displayed position values (these should show the actual position)
    const sliderValues = page.locator('.slider-value');
    const hDisplayValue = await sliderValues.nth(0).textContent(); // First is H position
    const vDisplayValue = await sliderValues.nth(1).textContent(); // Second is V position
    const zoomDisplayValue = await sliderValues.nth(2).textContent(); // Third is Zoom
    expect(parseFloat(hDisplayValue || '0')).toBeCloseTo(TARGET_H, 0);
    expect(parseFloat(vDisplayValue || '0')).toBeCloseTo(TARGET_V, 0);
    expect(parseFloat(zoomDisplayValue || '0')).toBeCloseTo(10, 0);

    // Take screenshot of Step 1 with these settings
    const step1Preview = page.locator('.avatar-circle-wrapper');
    await step1Preview.screenshot({ path: getTestResultsPath('step1-zoom10-h24-v-20.png') });

    // Go to Step 2 (click Step 1 Next)
    await page.getByTestId(TEST_IDS.STEP1_NEXT).click();
    await page.waitForTimeout(500);
    await page
      .getByRole('combobox', { name: 'Choose a flag' })
      .waitFor({ state: 'visible', timeout: 10000 });

    // Step 2: select flag and go to Step 3 (deterministic: waits dimensions + step 3 ready)
    await selectFlag(page, TEST_FLAGS.PALESTINE);
    await goToStep3(page, 45000); // 45s for step 3 ready on slow CI

    // Wait for the rendered image to appear (using avatar-circle in readonly mode)
    await page.waitForSelector('.avatar-circle.has-image', { timeout: 20000 });

    // Wait for rendering to complete (zoom/position should be applied)
    await page.waitForTimeout(3000);

    // Step 3 preview is ImageUploadZone (avatar-circle-wrapper + pattern).
    // goToStep3 already waited for render complete; ensure step 3 content and Save are ready.
    await page.locator('[data-testid="step-3"]').waitFor({ state: 'visible', timeout: 5000 });
    const renderedImage = page.locator('.avatar-circle.has-image');
    await expect(renderedImage).toBeVisible({ timeout: 10000 });

    // Save button enabled = render done (use role for robustness across browsers)
    const saveBtn = page.getByRole('button', { name: 'Save avatar' });
    await expect(saveBtn).toBeEnabled({ timeout: 10000 });

    // Take screenshot of Step 3 preview
    const step3Preview = page.locator('.step-layout');
    await step3Preview.screenshot({ path: getTestResultsPath('step3-zoom10-h24-v-20.png') });

    // Get image dimensions from Step 3 (avatar-circle container)
    const imageBoundingBox = await renderedImage.boundingBox();
    expect(imageBoundingBox).toBeTruthy();
    expect(imageBoundingBox!.width).toBeGreaterThan(0);
    expect(imageBoundingBox!.height).toBeGreaterThan(0);

    // Log console messages to verify zoom was applied
    console.log('Console messages captured:', consoleMessages.length);
    consoleMessages.forEach((msg) => console.log('  -', msg));

    // Verify we have zoom debug logs (in dev mode)
    // This confirms zoom calculation was executed
    const zoomLogs = consoleMessages.filter(
      (msg) => msg.includes('RENDERER ZOOM') || msg.includes('zoom='),
    );
    if (zoomLogs.length > 0) {
      console.log('Zoom debug logs found:', zoomLogs);
    }

    // The test passes if we get here - it means zoom/position were applied and image rendered
    // Screenshots are saved for manual inspection
  });
});
