# Scripts Directory

This directory contains utility scripts for managing the Beyond Borders application.

## Core Production Scripts

### `fetch-flags.js`

**Purpose:** Primary flag asset generation script - the heart of the flag
processing pipeline.

**What it does:**

- Reads `data/flag-data.yaml` (source of truth for flags)
- Downloads SVG files from Wikimedia Commons
- Rasterizes SVGs into PNGs using Playwright/resvg/sharp
- Generates full-size PNGs (standardized height: 1365px)
- Generates preview PNGs (512px width for UI thumbnails)
- Extracts colors from SVG files
- **Generates `src/flags/flags.ts` TypeScript file directly**
- Cleans up obsolete flag assets

**Usage:**

```bash
# Dry run (preview changes without making them)
node scripts/fetch-flags.js --dry-run

# Local execution (requires explicit --push flag to commit)
node scripts/fetch-flags.js --push

# CI execution (auto-commits and validates)
node scripts/fetch-flags.js --ci
```

**Requirements:** Playwright, sharp, @resvg/resvg-js

---

### `validate-flags.js`

**Purpose:** Validates flag data integrity and PNG quality.

**What it does:**

- Checks that all flags from `flag-data.yaml` exist in `flags.ts`
- Verifies all referenced PNG files exist in `public/flags/`
- Validates PNG canvas usage (ensures flags fill their canvas properly)
- Used in CI pipeline to catch broken flag assets

**Usage:**

```bash
node scripts/validate-flags.js
```

**Requirements:** Playwright (for PNG analysis), js-yaml

---

## Development & Debug Scripts

### `inspect-flag-raster.js`

**Purpose:** Analyzes PNG files to check canvas usage and transparency.

**What it does:**

- Loads a PNG file
- Computes the non-transparent bounding box
- Reports coverage percentages (width/height)
- Helps debug flags that don't fill their canvas properly

**Usage:**

```bash
node scripts/inspect-flag-raster.js public/flags/palestine.png
```

**Requirements:** Playwright

---

### `capture-cutout.js`

**Purpose:** Captures screenshots of the cutout mode for testing.

**What it does:**

- Launches the app in cutout mode
- Takes screenshots for visual regression testing
- Helps debug cutout mode rendering issues

**Usage:**

```bash
node scripts/capture-cutout.js
```

**Requirements:** Playwright

---

### `inspect-page.js`

**Purpose:** Inspects the app's page structure and state.

**What it does:**

- Opens the app in a browser
- Dumps DOM structure and state
- Helps debug UI issues

**Usage:**

```bash
node scripts/inspect-page.js
```

**Requirements:** Playwright

---

### `grab_bb_debug.js`

**Purpose:** Extracts debug information from the running app.

**What it does:**

- Opens the app with specific flags/modes
- Captures `__BB_DEBUG__` array from window object
- Reports canvas state and overlay information
- Helps debug rendering pipeline issues

**Usage:**

```bash
node scripts/grab_bb_debug.js
```

**Environment variables:**

- `APP_URL` - Override default localhost:5173

**Requirements:** Playwright

---

### `screenshot.js`

**Purpose:** Simple screenshot utility for documentation.

**What it does:**

- Takes screenshots of the app
- Used for generating documentation images

**Usage:**

```bash
node scripts/screenshot.js
```

**Requirements:** Playwright

---

## Directory Structure

```text
scripts/
├── README.md                    # This file
├── fetch-flags.js               # Flag asset + TypeScript generation (CORE)
├── validate-flags.js            # Flag validation (CORE)
# Note: Version calculation now uses GitVersion tool (see GitVersion.yml)
├── inspect-flag-raster.js       # PNG analysis tool
├── capture-cutout.js            # Cutout mode testing
├── inspect-page.js              # Page inspector
├── grab_bb_debug.js             # Debug data extractor
├── screenshot.js                # Screenshot utility
├── lib/
│   ├── helpers.js               # Shared utilities
│   ├── paths.js                 # Path resolution utilities
│   ├── logger.js                # Structured logging
│   ├── config.js                # Configuration
│   ├── deps.js                  # Optional dependency loader
│   ├── errors.js                # Custom error classes
│   ├── flag-parser.js           # Flag data parsing
│   ├── network.js               # Network utilities
│   ├── image-processor.js       # Image processing
│   └── typescript-generator.js  # TypeScript code generation
└── tests/
    ├── helpers.test.js          # Tests for helpers
    ├── unit-runner.cjs          # Test runner
    └── unit-runner.js           # Test runner (module)
```

---

## Workflow: Adding a New Flag

1. **Edit source:** Add flag entry to `data/flag-data.yaml`
2. **Generate assets:** Run `node scripts/fetch-flags.js --dry-run` to preview
3. **Commit assets:** Run `node scripts/fetch-flags.js --push` to generate
   and commit (this also updates `flags.ts`)
4. **Validate:** Run `node scripts/validate-flags.js` to verify
5. **Test:** Run unit tests with `pnpm test -- flags.test.ts`

**Note:** When using the GitHub Actions workflow, steps 4-5 happen automatically!

---

## Dependencies

Most scripts require **Playwright** for browser automation:

```bash
pnpm add -D playwright
```

For flag generation, also install:

```bash
pnpm add -D sharp @resvg/resvg-js js-yaml p-limit
```
