#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function err(msg) {
  console.error(msg);
}

const repoRoot = path.resolve(__dirname, '..');
const dataYaml = path.join(repoRoot, 'data', 'flag-data.yaml');
const publicFlagsDir = path.join(repoRoot, 'public', 'flags');

// We validate that TypeScript manifest exists and that referenced PNGs are present.
const manifestPath = path.join(repoRoot, 'src', 'flags', 'flags.ts');
if (!fs.existsSync(manifestPath)) { err('TypeScript manifest src/flags/flags.ts not found — run fetch-flags.cjs'); process.exit(2); }
let manifest = null;
try {
  // Parse the TypeScript file to extract the flags array
  const tsContent = fs.readFileSync(manifestPath, 'utf8');
  // Extract the flags array from the TypeScript file using a regex
  const match = tsContent.match(/export const flags: FlagSpec\[\] = (\[[\s\S]*?\n\]);/);
  if (!match) { err('Failed to parse flags array from flags.ts'); process.exit(2); }
  // Use eval to parse the JavaScript array literal (safe since this is our own generated code)
  manifest = eval(match[1]);
} catch (e) { err('Failed to read flags.ts — ' + (e && e.message)); process.exit(2); }

function canonicalizeId(name) {
  if (!name) return '';
  name = name.replace(/\.[a-z0-9]+$/i, '');
  name = name.toLowerCase();
  name = name.replace(/[_\s]+/g, '-');
  name = name.replace(/flags?/g, '');
  name = name.replace(/[^a-z0-9-]/g, '');
  name = name.replace(/-+/g, '-');
  // remove occurrences of 'of-' (leading or internal)
  name = name.replace(/(^|-)of-/g, '$1');
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  if (!name) name = 'unknown';
  return name;
}


  if (!fs.existsSync(dataYaml)) {
    err('Could not find data/flag-data.yaml  aborting validation');
    process.exit(1);
  }

  let yaml = null;
  try {
    yaml = fs.readFileSync(dataYaml, 'utf8');
  } catch (e) { err('Failed to read data/flag-data.yaml'); process.exit(1); }

  let expected = [];
  try {
    const jsyaml = require('js-yaml');
    const doc = jsyaml.load(yaml);
    
    if (!doc || !Array.isArray(doc.categories)) {
      err('Error: YAML structure is invalid. Expected { categories: [{ categoryName: "...", displayOrder: n, flags: [...] }] }');
      process.exit(1);
    }
    
    // Flatten nested structure
    for (const category of doc.categories) {
      if (!category.categoryName || !Array.isArray(category.flags)) {
        err(`Error: Invalid category structure. Expected { categoryName: "...", displayOrder: n, flags: [...] }`);
        process.exit(1);
      }
      
      expected.push(...category.flags.map(flag => ({ ...flag, category: category.categoryName })));
    }
  } catch (e) {
    err('Failed to parse YAML: ' + (e && e.message));
    process.exit(1);
  }

  // Build expected set from the YAML source (ids or media filenames) and cross-check against manifest entries.
  const expectedIds = new Set();
  for (const e of expected) {
    // `svg_url` ends with the filename or a special media path. Use the basename as a fallback id.
    const url = e.svg_url || e.svg || e.media_url || '';
    const parts = url.split('/');
    const basename = parts[parts.length - 1] || null;
    if (basename) {
      // Strip query/hash and extension to produce an id comparable to manifest.id
      const cleanRaw = basename.replace(/[#?].*$/, '')
          .replace(/\.svg$/i, '')
          .replace(/^File:/i, '')
          .replace(/^file:/i, '');
        const clean = canonicalizeId(cleanRaw);
        expectedIds.add(clean);
    }
  }

  const manifestIds = new Set((manifest || []).map(m => m.id));
  const missingIds = [];
  for (const id of expectedIds) if (!manifestIds.has(id)) missingIds.push(id);

  if (missingIds.length) {
    err('Flag manifest validation failed — the following flags from data/flag-data.yaml are missing in src/flags/flags.ts:');
    for (const n of missingIds) err('  - ' + n);
    err('\nRun scripts/fetch-flags.cjs --ci to regenerate the manifest and assets.');
    process.exit(2);
  }

  // Check that each manifest entry references existing png_full and png_preview files.
  const missingFiles = [];
  for (const m of manifest) {
    if (m.png_full && !fs.existsSync(path.join(publicFlagsDir, m.png_full))) missingFiles.push(m.png_full);
    if (m.png_preview && !fs.existsSync(path.join(publicFlagsDir, m.png_preview))) missingFiles.push(m.png_preview);
  }

  if (missingFiles.length) {
    err('Flag asset validation failed — the following PNGs referenced in flags.ts are missing from public/flags:');
    for (const f of missingFiles) err('  - ' + f);
    process.exit(2);
  }

  // Now perform a pixel-usage check on each full-size PNG to ensure the raster
  // actually fills the canvas (no large transparent margins). This uses
  // Playwright to rasterize the PNG into a canvas and compute the non-transparent
  // bounding box (same logic as scripts/inspect-flag-raster.cjs). If Playwright
  // is not installed we bail with an explanatory message.
  (async () => {
    let playwright = null;
    try { playwright = require('playwright'); } catch (e) {
    console.error('Playwright is required for PNG usage validation. Install with: pnpm add -D playwright');
      process.exit(1);
    }
    const chromium = playwright.chromium;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const usageErrors = [];
    for (const m of manifest) {
      if (!m.png_full) continue;
      const pngPath = path.join(publicFlagsDir, m.png_full);
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
            const w = img.naturalWidth, h = img.naturalHeight;
            const c = document.createElement('canvas'); c.width = w; c.height = h;
            const ctx = c.getContext('2d'); ctx.clearRect(0,0,w,h); ctx.drawImage(img,0,0);
            const data = ctx.getImageData(0,0,w,h).data;
            let minX = w, minY = h, maxX = 0, maxY = 0, any = false;
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
            const usedW = maxX - minX + 1; const usedH = maxY - minY + 1;
            return { w, h, any: true, minX, minY, maxX, maxY, usedW, usedH, pctW: usedW / w, pctH: usedH / h };
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
              usageErrors.push({ id: m.id, file: m.png_full, usedW: res.usedW, usedH: res.usedH, w: res.w, h: res.h, pctW: res.pctW, pctH: res.pctH });
            }
          } else {
            // For other images (fallback) require both dimensions meet MIN_PCT
            if ((res.pctW || 0) < MIN_PCT || (res.pctH || 0) < MIN_PCT) {
              usageErrors.push({ id: m.id, file: m.png_full, usedW: res.usedW, usedH: res.usedH, w: res.w, h: res.h, pctW: res.pctW, pctH: res.pctH });
            }
          }
        }
      } catch (e) {
        usageErrors.push({ id: m.id, file: m.png_full, reason: 'read/eval failed', error: String(e && e.message) });
      }
    }
    try { await browser.close(); } catch (e) {}
    if (usageErrors.length) {
      err('Flag asset usage validation failed — the following png_full files do not fill their canvas:');
      for (const x of usageErrors) err('  - ' + (x.id || x.file) + ': ' + (x.reason || (`used ${x.usedW}x${x.usedH} of ${x.w}x${x.h} (${Math.round((x.pctW||0)*100)}% x ${Math.round((x.pctH||0)*100)}%)`)) + (x.error ? ' error=' + x.error : ''));
      err('\nRegenerate assets with scripts/fetch-flags.cjs --ci and inspect with scripts/inspect-flag-raster.cjs.');
      process.exit(3);
    }
    console.log('Flag validation passed — flags.ts present, category keys valid, referenced PNGs exist, and all png_full images fully use their canvas.');
    process.exit(0);
  })();
