# Scripts Directory

This directory contains utility scripts for managing the Beyond Borders application.

## Core Production Scripts

### `fetch-and-extract.cjs`
**Purpose:** Primary flag asset generation script - the heart of the flag processing pipeline.

**What it does:**
- Reads `data/flag-data.yaml` (source of truth for flags)
- Downloads SVG files from Wikimedia Commons
- Rasterizes SVGs into PNGs using Playwright/resvg/sharp
- Generates full-size PNGs (standardized height: 1365px)
- Generates preview PNGs (200×100px for UI thumbnails)
- Extracts colors from SVG files
- Creates `public/flags/flags.json` runtime manifest
- Cleans up obsolete flag assets

**Usage:**
```bash
# Dry run (preview changes without making them)
node scripts/fetch-and-extract.cjs --dry-run

# Local execution (requires explicit --push flag to commit)
node scripts/fetch-and-extract.cjs --push

# CI execution (auto-commits and validates)
node scripts/fetch-and-extract.cjs --ci
```

**Requirements:** Playwright, sharp, @resvg/resvg-js

---

### `sync-flags-ts.cjs`
**Purpose:** Syncs `src/flags/flags.ts` from `public/flags/flags.json`.

**What it does:**
- Reads the generated `flags.json` manifest
- Converts manifest entries to TypeScript flag objects
- Applies ID mappings for human-friendly short names
- Determines category based on flag type
- Extracts stripe colors and generates pattern data
- Writes updated `flags.ts` with proper formatting

**Usage:**
```bash
# Preview changes without writing
node scripts/sync-flags-ts.cjs --dry-run

# Update flags.ts
node scripts/sync-flags-ts.cjs
```

**Requirements:** None (pure Node.js)

---

### `validate-flags.cjs`
**Purpose:** Validates flag data integrity and PNG quality.

**What it does:**
- Checks that all flags from `flag-data.yaml` exist in `flags.json`
- Verifies all referenced PNG files exist in `public/flags/`
- Validates PNG canvas usage (ensures flags fill their canvas properly)
- Used in CI pipeline to catch broken flag assets

**Usage:**
```bash
node scripts/validate-flags.cjs
```

**Requirements:** Playwright (for PNG analysis), js-yaml

---

## Development & Debug Scripts

### `inspect-flag-raster.cjs`
**Purpose:** Analyzes PNG files to check canvas usage and transparency.

**What it does:**
- Loads a PNG file
- Computes the non-transparent bounding box
- Reports coverage percentages (width/height)
- Helps debug flags that don't fill their canvas properly

**Usage:**
```bash
node scripts/inspect-flag-raster.cjs public/flags/palestine.png
```

**Requirements:** Playwright

---

### `capture-cutout.cjs`
**Purpose:** Captures screenshots of the cutout mode for testing.

**What it does:**
- Launches the app in cutout mode
- Takes screenshots for visual regression testing
- Helps debug cutout mode rendering issues

**Usage:**
```bash
node scripts/capture-cutout.cjs
```

**Requirements:** Playwright

---

### `inspect-page.cjs`
**Purpose:** Inspects the app's page structure and state.

**What it does:**
- Opens the app in a browser
- Dumps DOM structure and state
- Helps debug UI issues

**Usage:**
```bash
node scripts/inspect-page.cjs
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

```
scripts/
├── README.md                    # This file
├── fetch-and-extract.cjs        # Flag asset generation (CORE)
├── sync-flags-ts.cjs            # Sync flags.ts from flags.json (CORE)
├── validate-flags.cjs           # Flag validation (CORE)
├── inspect-flag-raster.cjs      # PNG analysis tool
├── capture-cutout.cjs           # Cutout mode testing
├── inspect-page.cjs             # Page inspector
├── grab_bb_debug.js             # Debug data extractor
├── screenshot.js                # Screenshot utility
├── lib/
│   └── helpers.cjs              # Shared utilities
└── tests/
    ├── helpers.test.js          # Tests for helpers
    ├── unit-runner.cjs          # Test runner
    └── unit-runner.js           # Test runner (module)
```

---

## Workflow: Adding a New Flag

1. **Edit source:** Add flag entry to `data/flag-data.yaml`
2. **Generate assets:** Run `node scripts/fetch-and-extract.cjs --dry-run` to preview
3. **Commit assets:** Run `node scripts/fetch-and-extract.cjs --push` to generate and commit
4. **Sync TypeScript:** Run `node scripts/sync-flags-ts.cjs` to update `flags.ts` automatically
5. **Validate:** Run `node scripts/validate-flags.cjs` to verify
6. **Test:** Run unit tests with `pnpm test -- flags.test.ts`

**Note:** When using the GitHub Actions workflow, steps 4-6 happen automatically!

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
