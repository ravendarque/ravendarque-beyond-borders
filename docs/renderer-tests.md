# Renderer Test Coverage

## Overview
Comprehensive test suite for the renderer module, covering geometry calculations, flag validation, canvas utilities, and rendering functionality.

## Test Statistics
- **Total Tests**: 54
- **Test Files**: 3
- **Coverage Areas**: Canvas utilities, flag validation, rendering

## Test Suites

### 1. Canvas Utilities (`test/unit/renderer/canvas-utils.test.ts`)
**Tests**: 24 tests covering canvas creation, validation, and color utilities

#### Canvas Size Validation
- ✅ Validates correct canvas sizes (512x512, 1024x1024, 2048x2048)
- ✅ Throws error for oversized canvas (>browser limits)
- ✅ Includes browser type in error messages
- ✅ Includes requested dimensions in error messages

#### Canvas Creation
- ✅ Creates canvas with correct dimensions
- ✅ Returns both canvas and 2D context
- ✅ Rejects dimensions exceeding browser limits
- ✅ Handles different aspect ratios (800x600, 600x800)

#### OffscreenCanvas Support
- ✅ Returns boolean for support detection
- ✅ Returns true in test environment with mocks

#### Color Validation
- ✅ Validates 6-digit hex colors (#FF0000, #ABCDEF)
- ✅ Validates 3-digit hex colors (#F00, #ABC)
- ✅ Accepts lowercase hex colors
- ✅ Rejects invalid formats (missing #, wrong length, invalid chars)
- ✅ Rejects named colors (red, blue, green)

#### Color Normalization
- ✅ Expands 3-digit to 6-digit (#F00 → #FF0000)
- ✅ Preserves 6-digit hex colors
- ✅ Converts all colors to uppercase
- ✅ Handles mixed case colors

#### Browser Limits
- ✅ Verifies expected browser-specific limits
- ✅ Confirms Safari has most restrictive limit (4096x4096)

### 2. Flag Validation (`test/unit/renderer/flag-validation.test.ts`)
**Tests**: 15 tests covering flag pattern validation

#### Pattern Validation
- ✅ Validates correct flag patterns with multiple stripes
- ✅ Throws if pattern is missing
- ✅ Throws if stripes array is missing
- ✅ Throws if stripes array is empty

#### Stripe Validation
- ✅ Throws if stripe has invalid hex color
- ✅ Throws if stripe is missing color property
- ✅ Throws if stripe has invalid weight (≤0)
- ✅ Throws if too many stripes (>50)

#### Color Format Support
- ✅ Validates 3-digit hex colors in stripes
- ✅ Validates 6-digit hex colors in stripes
- ✅ Validates flags with different weight distributions

#### Error Handling
- ✅ Includes field name in error messages
- ✅ FlagValidationError has correct properties
- ✅ FlagValidationError instanceof Error
- ✅ Works with optional field parameter

### 3. Renderer Core (`test/unit/renderer.test.ts`)
**Tests**: 15 tests covering avatar rendering functionality

#### Basic Rendering
- ✅ Renders PNG blob from image and flag
- ✅ Returns correct blob type (image/png)
- ✅ Returns file size information (sizeBytes, sizeKB)
- ✅ Respects custom PNG quality settings (0-1 range)
- ✅ Uses default PNG quality when not specified (0.92)

#### Presentation Modes
- ✅ Renders ring mode (flag border around user image)
- ✅ Renders segment mode (flag border at bottom)
- ✅ Renders cutout mode (full-size flag with centered user)

#### Size Validation
- ✅ Handles different canvas sizes (512, 1024)
- ✅ Rejects oversized canvas dimensions
- ✅ Validates against browser-specific limits

#### Background Options
- ✅ Renders with solid background color (#FFFFFF)
- ✅ Renders with transparent background (null)

#### Image Positioning
- ✅ Applies imageOffsetPx in ring mode (user image offset)
- ✅ Applies flagOffsetPx in cutout mode (flag pattern offset)

#### Performance Features
- ✅ Includes metrics when enablePerformanceTracking=true
- ✅ Omits metrics when enablePerformanceTracking=false
- ✅ Calls onProgress callback during render
- ✅ Progress values between 0 and 1

## Test Execution

### Run All Renderer Tests
```bash
pnpm test -- test/unit/renderer
```

### Run Specific Test File
```bash
pnpm test -- test/unit/renderer/canvas-utils.test.ts
pnpm test -- test/unit/renderer/flag-validation.test.ts
pnpm test -- test/unit/renderer.test.ts
```

### Watch Mode
```bash
pnpm test -- test/unit/renderer --watch
```

## Test Data

### Mock Image Bitmap
- Uses 1x1 transparent PNG data URL
- Minimal size for fast test execution
- Provided by test setup (`createImageBitmap` mock)

### Mock Canvas
- `MockOffscreenCanvas` in test setup
- Supports width/height properties
- Mock `convertToBlob` returns blob with realistic size
- Mock context for 2D operations

### Flag Data
- Uses actual flags from `@/flags/flags`
- Tests with first flag in array (flags[0])
- Validates against real flag schema

## Coverage Goals

### ✅ Achieved
- Canvas creation and validation
- Color validation and normalization
- Flag pattern validation
- Basic rendering functionality
- Presentation modes
- File size estimation
- PNG quality control
- Performance tracking
- Progress callbacks

### 🎯 Future Additions
- Visual regression tests (requires Playwright + screenshots)
- Cross-browser tests (Chrome, Firefox, Safari)
- Mobile device tests (iOS, Android)
- Performance benchmarks
- Memory leak tests
- Stress tests (many renders in succession)

## Known Limitations

### Test Environment
- Uses mock canvas (not real browser canvas)
- Cannot test actual pixel rendering
- Cannot test actual file size optimization
- Cannot test browser-specific rendering differences

### Visual Testing
- No visual regression tests yet
- No snapshot comparisons
- No actual rendered image validation

These limitations are acceptable for unit tests. Visual and cross-browser testing should be done with E2E tests.

## Related Documentation
- [Renderer API Documentation](./renderer-api.md)
- [Flag Validation Documentation](../src/renderer/flag-validation.ts)
- [Canvas Utilities Documentation](../src/renderer/canvas-utils.ts)
