# E2E Test Suite Documentation

## Overview

This directory contains end-to-end tests using Playwright. Tests are organized into subdirectories by category:

- **`workflows/`** - Complete user workflows and happy paths
- **`responsive/`** - Mobile, tablet, and desktop viewport tests
- **`accessibility/`** - WCAG compliance and accessibility tests
- **`visual/`** - Visual regression and layout consistency tests
- **`errors/`** - Error handling and edge case tests
- **`helpers/`** - Shared test utilities and helpers

## Running Tests

### Run All Tests
```bash
pnpm test:e2e
```

### Run Specific Test File
```bash
pnpm test:e2e test/e2e/workflows/complete-workflow.spec.ts
```

### Run Tests by Tag
```bash
# Run only smoke tests
pnpm test:e2e --grep @smoke

# Run only accessibility tests
pnpm test:e2e --grep @accessibility

# Run only slow tests
pnpm test:e2e --grep @slow
```

### Run Tests on Specific Browser
```bash
# Run only on Chromium
pnpm test:e2e --project=chromium

# Run only on Firefox
pnpm test:e2e --project=firefox

# Run only mobile tests
pnpm test:e2e --project=chromium-mobile
```

### Run Tests in UI Mode
```bash
pnpm test:e2e --ui
```

### Run Tests in Debug Mode
```bash
pnpm test:e2e --debug
```

## Test Tags

Tests can be tagged for selective execution:

- **`@smoke`** - Critical path tests that should run on every commit
- **`@accessibility`** - Accessibility and WCAG compliance tests
- **`@visual`** - Visual regression tests (screenshot comparison)
- **`@slow`** - Tests that take longer to run
- **`@mobile`** - Mobile-specific tests

## Writing Tests

### Using Shared Helpers

Always use shared helpers from `helpers/page-helpers.ts` instead of duplicating code:

```typescript
import { uploadImage, selectFlag, selectPresentationMode } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test('my test', async ({ page }) => {
  await page.goto('/');
  await uploadImage(page);
  await selectFlag(page, TEST_FLAGS.PALESTINE);
  await selectPresentationMode(page, 'Ring');
});
```

### Available Helpers

- `uploadImage(page, imagePath?)` - Upload an image file
- `selectFlag(page, flagName)` - Select a flag from dropdown
- `selectPresentationMode(page, mode)` - Select Ring/Segment/Cutout
- `setSliderValue(page, label, value)` - Set a slider value
- `waitForRenderComplete(page, timeout?)` - Wait for render to finish
- `preSelectFlag(page, flagId)` - Pre-seed localStorage with flag
- `preSeedImage(page, imageUrl)` - Pre-seed sessionStorage with image
- `verifyCanvasHasContent(page)` - Verify canvas has rendered content

### Test Data

Use constants from `helpers/test-data.ts`:

```typescript
import { TEST_FLAGS, TEST_IMAGE_PATH } from '../helpers/test-data';

// Use flag constants
await selectFlag(page, TEST_FLAGS.PALESTINE);

// Use test image path
await uploadImage(page, TEST_IMAGE_PATH);
```

### Test Patterns

#### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { uploadImage, selectFlag } from '../helpers/page-helpers';
import { TEST_FLAGS } from '../helpers/test-data';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Test steps here
  });
});
```

#### Waiting for Async Operations
```typescript
// Wait for render to complete
await waitForRenderComplete(page);

// Wait for specific element
await page.waitForSelector('#my-element');

// Wait for function
await page.waitForFunction(() => window.someCondition);
```

#### Screenshots
```typescript
// Full page screenshot
await expect(page).toHaveScreenshot('screenshot-name.png', { fullPage: true });

// Element screenshot
await expect(element).toHaveScreenshot('element-name.png');
```

#### Error Handling
```typescript
// Test error states
await page.route('**/api/endpoint', (route) => route.abort());
// Verify graceful degradation
```

## Test Organization

### Workflows
Tests for complete user journeys:
- Upload → Flag Selection → Adjust → Download
- Step navigation
- State persistence

### Responsive
Tests for different viewport sizes:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 834px, 1024px
- Desktop: 1280px, 1440px, 1920px

### Accessibility
WCAG AA compliance tests:
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA labels

### Visual
Visual regression tests:
- Screenshot comparison
- Layout shift detection
- Theme consistency

### Errors
Error handling tests:
- File validation
- Network failures
- Edge cases

## Screenshot Baselines

Visual regression tests use screenshot comparison. To update baselines:

```bash
# Update all baselines
pnpm test:e2e --update-snapshots

# Update specific test
pnpm test:e2e test/e2e/visual/flag-rendering.spec.ts --update-snapshots
```

**Note**: Baselines are stored in `test-results/` directory. Review changes carefully before committing.

## CI/CD

Tests run automatically on:
- Every pull request
- Every push to main branch

The CI runs tests on all browser projects (Chromium, Firefox, WebKit, mobile).

## Troubleshooting

### Tests Failing Locally

1. **Ensure dev server is running**: Tests require `pnpm dev` to be running on port 5173
2. **Check browser installation**: Run `pnpm exec playwright install`
3. **Clear test results**: `rm -rf test-results/`

### Flaky Tests

If a test is flaky:
1. Add appropriate waits (don't use fixed timeouts)
2. Use `waitForFunction` or `waitForSelector` instead of `waitForTimeout`
3. Check for race conditions
4. Consider adding retry logic in test config

### Screenshot Failures

If screenshots fail:
1. Review the diff carefully
2. If change is intentional, update baseline: `--update-snapshots`
3. Check for timing issues (wait for animations to complete)

## Best Practices

1. **Use shared helpers** - Don't duplicate code
2. **Use test tags** - Tag tests appropriately for selective execution
3. **Wait properly** - Use `waitForFunction` or `waitForSelector`, not fixed timeouts
4. **Keep tests focused** - One test, one concern
5. **Use constants** - Use `TEST_FLAGS` and other constants from helpers
6. **Clean up** - Tests should be independent and not rely on previous test state
7. **Document complex tests** - Add comments for non-obvious test logic

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
