#!/usr/bin/env node
/**
 * Validates flag data integrity and PNG quality
 * Checks that all flags from flag-data.yaml exist in flags.ts,
 * verifies all referenced PNG files exist, and validates PNG canvas usage
 */

import fs from 'fs';
import { join } from 'path';
import { resolveFromRepo } from './lib/paths.js';
import { getConfig } from './lib/config.js';
import { logger } from './lib/logger.js';
import { loadOptionalDep } from './lib/deps.js';
import { exitWithError, FlagDataError, FileError, ValidationError } from './lib/errors.js';

const config = getConfig(import.meta.url);
const repoRoot = config.paths.repoRoot;
const dataYaml = config.paths.dataYaml;
const publicFlagsDir = config.paths.flagsDir;
const manifestPath = config.paths.flagsTs;

// Validate that TypeScript manifest exists
if (!fs.existsSync(manifestPath)) {
  exitWithError(
    new FileError(
      'TypeScript manifest src/flags/flags.ts not found — run fetch-flags.js',
      manifestPath,
    ),
    2,
  );
}

let manifest = null;
try {
  // Parse the TypeScript file to extract the flags array
  const tsContent = fs.readFileSync(manifestPath, 'utf8');
  // Extract the flags array from the TypeScript file using a regex
  const match = tsContent.match(/export const flags: FlagSpec\[\] = (\[[\s\S]*?\n\]);/);
  if (!match) {
    exitWithError(new ValidationError('Failed to parse flags array from flags.ts'), 2);
  }
  // Use eval to parse the JavaScript array literal (safe since this is our own generated code)
  manifest = eval(match[1]);
} catch (e) {
  exitWithError(new ValidationError('Failed to read flags.ts', null, e), 2);
}

/**
 * Canonicalize a flag ID from a name or URL
 * @param {string} name - Original name or URL
 * @returns {string} - Canonicalized ID
 */
function canonicalizeId(name) {
  if (!name) return '';
  name = name.replace(/\.[a-z0-9]+$/i, '');
  name = name.toLowerCase();
  name = name.replace(/[_\s]+/g, '-');
  name = name.replace(/flags?/g, '');
  name = name.replace(/[^a-z0-9-]/g, '');
  name = name.replace(/-+/g, '-');
  // Remove occurrences of 'of-' (leading or internal)
  name = name.replace(/(^|-)of-/g, '$1');
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  if (!name) name = 'unknown';
  return name;
}

// Validate YAML file exists
if (!fs.existsSync(dataYaml)) {
  exitWithError(
    new FileError('Could not find data/flag-data.yaml — aborting validation', dataYaml),
    1,
  );
}

let yaml = null;
try {
  yaml = fs.readFileSync(dataYaml, 'utf8');
} catch (e) {
  exitWithError(new FileError('Failed to read data/flag-data.yaml', dataYaml, e), 1);
}

let expected = [];
try {
  const jsyaml = await loadOptionalDep('js-yaml');
  if (!jsyaml) {
    exitWithError(
      new ValidationError('js-yaml is required for validation. Install with: pnpm add -D js-yaml'),
      1,
    );
  }

  const doc = jsyaml.load(yaml);

  if (!doc || !Array.isArray(doc.categories)) {
    exitWithError(
      new FlagDataError(
        'YAML structure is invalid. Expected { categories: [{ categoryName: "...", displayOrder: n, flags: [...] }] }',
      ),
      1,
    );
  }

  // Flatten nested structure
  for (const category of doc.categories) {
    if (!category.categoryName || !Array.isArray(category.flags)) {
      exitWithError(
        new FlagDataError(
          `Invalid category structure. Expected { categoryName: "...", displayOrder: n, flags: [...] }`,
        ),
        1,
      );
    }

    expected.push(...category.flags.map((flag) => ({ ...flag, category: category.categoryName })));
  }
} catch (e) {
  exitWithError(new FlagDataError('Failed to parse YAML', e), 1);
}

// Build expected set from the YAML source (ids or media filenames) and cross-check against manifest entries
const expectedIds = new Set();
for (const e of expected) {
  // `svg_url` ends with the filename or a special media path. Use the basename as a fallback id.
  const url = e.svg_url || e.svg || e.media_url || '';
  const parts = url.split('/');
  const basename = parts[parts.length - 1] || null;
  if (basename) {
    // Strip query/hash and extension to produce an id comparable to manifest.id
    // URL-decode the basename first to handle encoded characters like %22
    let decodedBasename = basename.replace(/[#?].*$/, '');
    try {
      decodedBasename = decodeURIComponent(decodedBasename);
    } catch (e) {
      // If decoding fails, use the original (might already be decoded)
    }
    const cleanRaw = decodedBasename
      .replace(/\.svg$/i, '')
      .replace(/^File:/i, '')
      .replace(/^file:/i, '');
    const clean = canonicalizeId(cleanRaw);
    expectedIds.add(clean);
  }
}

const manifestIds = new Set((manifest || []).map((m) => m.id));
const missingIds = [];
for (const id of expectedIds) {
  if (!manifestIds.has(id)) missingIds.push(id);
}

if (missingIds.length) {
  logger.error(
    'Flag manifest validation failed — the following flags from data/flag-data.yaml are missing in src/flags/flags.ts:',
  );
  for (const n of missingIds) logger.error(`  - ${n}`);
  logger.error('\nRun scripts/fetch-flags.js --ci to regenerate the manifest and assets.');
  exitWithError(new ValidationError('Flags missing from manifest', { missingIds }), 2);
}

// Check that each manifest entry references existing png_full and png_preview files
const missingFiles = [];
for (const m of manifest) {
  if (m.png_full && !fs.existsSync(join(publicFlagsDir, m.png_full))) {
    missingFiles.push(m.png_full);
  }
  if (m.png_preview && !fs.existsSync(join(publicFlagsDir, m.png_preview))) {
    missingFiles.push(m.png_preview);
  }
}

if (missingFiles.length) {
  logger.error(
    'Flag asset validation failed — the following PNGs referenced in flags.ts are missing from public/flags:',
  );
  for (const f of missingFiles) logger.error(`  - ${f}`);
  exitWithError(new ValidationError('Missing PNG files', { missingFiles }), 2);
}

// Now perform a pixel-usage check on each full-size PNG to ensure the raster
// actually fills the canvas (no large transparent margins). This uses
// Playwright to rasterize the PNG into a canvas and compute the non-transparent
// bounding box (same logic as scripts/inspect-flag-raster.js)
const playwright = await loadOptionalDep('playwright');
if (!playwright) {
  logger.error(
    'Playwright is required for PNG usage validation. Install with: pnpm add -D playwright',
  );
  process.exit(1);
}

const { chromium } = playwright;
const browser = await chromium.launch();
const page = await browser.newPage();
const usageErrors = [];

for (const m of manifest) {
  if (!m.png_full) continue;
  const pngPath = join(publicFlagsDir, m.png_full);
  try {
    const buf = fs.readFileSync(pngPath);
    const dataUrl = 'data:image/png;base64,' + buf.toString('base64');
    const html = `<!doctype html><html><body style="margin:0"><img id=img src="${dataUrl}"></body></html>`;
    await page.setContent(html);
    await page.waitForSelector('#img');
    const res = await page.evaluate(() => {
      const img = document.getElementById('img');
      return new Promise((resolve) => {
        if (img.complete) resolve(true);
        else img.onload = () => resolve(true);
        setTimeout(() => resolve(true), 2000);
      }).then(() => {
        const w = img.naturalWidth,
          h = img.naturalHeight;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h).data;
        let minX = w,
          minY = h,
          maxX = 0,
          maxY = 0,
          any = false;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a > 8) {
              any = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (!any) return { w, h, any: false };
        const usedW = maxX - minX + 1;
        const usedH = maxY - minY + 1;
        return {
          w,
          h,
          any: true,
          minX,
          minY,
          maxX,
          maxY,
          usedW,
          usedH,
          pctW: usedW / w,
          pctH: usedH / h,
        };
      });
    });

    if (!res.any) {
      usageErrors.push({ id: m.id, file: m.png_full, reason: 'no non-transparent pixels' });
    } else {
      // Different rules depending on whether this is a full-size PNG or a preview.
      // - full-size PNGs: must fill the canvas vertically (height) because we
      //   standardize the full canvas height and let width vary by aspect.
      // - preview PNGs: must fill both dimensions (they are intended for UI list).
      // Coverage thresholds. Some flags have content that won't perfectly
      // fill the canvas due to intrinsic whitespace in the SVG; allow a
      // configurable tolerance rather than requiring exact 100%.
      const MIN_PCT = 1.0; // require 100% coverage
      if (m.png_full && pngPath.endsWith(m.png_full)) {
        if ((res.pctH || 0) < MIN_PCT) {
          usageErrors.push({
            id: m.id,
            file: m.png_full,
            usedW: res.usedW,
            usedH: res.usedH,
            w: res.w,
            h: res.h,
            pctW: res.pctW,
            pctH: res.pctH,
          });
        }
      } else {
        // For other images (fallback) require both dimensions meet MIN_PCT
        if ((res.pctW || 0) < MIN_PCT || (res.pctH || 0) < MIN_PCT) {
          usageErrors.push({
            id: m.id,
            file: m.png_full,
            usedW: res.usedW,
            usedH: res.usedH,
            w: res.w,
            h: res.h,
            pctW: res.pctW,
            pctH: res.pctH,
          });
        }
      }
    }
  } catch (e) {
    usageErrors.push({
      id: m.id,
      file: m.png_full,
      reason: 'read/eval failed',
      error: String(e?.message),
    });
  }
}

try {
  await browser.close();
} catch (e) {
  // Ignore close errors
}

if (usageErrors.length) {
  logger.error(
    'Flag asset usage validation failed — the following png_full files do not fill their canvas:',
  );
  for (const x of usageErrors) {
    const details =
      x.reason ||
      `used ${x.usedW}x${x.usedH} of ${x.w}x${x.h} (${Math.round((x.pctW || 0) * 100)}% x ${Math.round((x.pctH || 0) * 100)}%)`;
    logger.error(`  - ${x.id || x.file}: ${details}${x.error ? ' error=' + x.error : ''}`);
  }
  logger.error(
    '\nRegenerate assets with scripts/fetch-flags.js --ci and inspect with scripts/inspect-flag-raster.js.',
  );
  exitWithError(new ValidationError('PNG canvas usage validation failed', { usageErrors }), 3);
}

logger.success(
  'Flag validation passed — flags.ts present, category keys valid, referenced PNGs exist, and all png_full images fully use their canvas.',
);
process.exit(0);
