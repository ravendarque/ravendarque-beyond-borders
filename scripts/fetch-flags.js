#!/usr/bin/env node
/**
 * Primary flag asset generation script
 * Downloads SVG flags, rasterizes them to PNGs, extracts colors, and generates TypeScript
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { resolveFromRepo } from './lib/paths.js';
import { getConfig } from './lib/config.js';
import { logger } from './lib/logger.js';
import { loadOptionalDep } from './lib/deps.js';
import { exitWithError, FlagDataError, ValidationError, FileError } from './lib/errors.js';
import { canonicalizeId, parseFlagsFromDoc } from './lib/flag-parser.js';
import { fetchToFile, retryWithBackoff, getMediaUrlFromCommons, sleep } from './lib/network.js';
import { renderSvgWithResvgSharp, analyzePngUsage } from './lib/image-processor.js';
import { generateTypeScriptSource } from './lib/typescript-generator.js';
import { sanitizeFilename, extractColorsFromSvgText, extractColorsFromPng } from './lib/helpers.js';

// CLI args
const argv = process.argv.slice(2);
const WANT_PUSH = argv.includes('--push');
const WANT_CI = argv.includes('--ci') || process.env.CI === 'true';
const WANT_DRY = argv.includes('--dry-run');
const WANT_FORCE = argv.includes('--force');

if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Usage: node scripts/fetch-flags.js [--push] [--ci] [--dry-run] [--force]\n  --push   allow git add/commit/push (local override)\n  --ci     treat run as CI (also allows commit)\n  --dry-run  only simulate actions (no network writes)\n  --force  delete existing PNG files before regenerating');
  process.exit(0);
}

const config = getConfig(import.meta.url);
const dataYamlPath = config.paths.dataYaml;
const schemaPath = config.paths.schema;
const outDir = config.paths.flagsDir;
const flagsTsPath = config.paths.flagsTs;

// Validate YAML file exists
if (!fs.existsSync(dataYamlPath)) {
  exitWithError(new FileError('data/flag-data.yaml not found. Please add it.', dataYamlPath), 1);
}

const yamlText = fs.readFileSync(dataYamlPath, 'utf8');

// Validate schema file exists
if (!fs.existsSync(schemaPath)) {
  exitWithError(new FileError('data/flag-data.schema.json not found. Please add it.', schemaPath), 1);
}

// Load dependencies
const Ajv = await loadOptionalDep('ajv');
if (!Ajv) {
  exitWithError(new ValidationError('ajv is required. Install with: pnpm add -D ajv'), 1);
}

const jsyaml = await loadOptionalDep('js-yaml');
if (!jsyaml) {
  exitWithError(new ValidationError('js-yaml is required. Install with: pnpm add -D js-yaml'), 1);
}

// Validate YAML against schema
const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

let yamlData;
try {
  yamlData = jsyaml.load(yamlText);
} catch (e) {
  exitWithError(new FlagDataError('Failed to parse YAML file', e), 1);
}

const validate = ajv.compile(schema);
const valid = validate(yamlData);

if (!valid) {
  logger.error('Error: flag-data.yaml does not match the schema:');
  logger.error(JSON.stringify(validate.errors, null, 2));
  exitWithError(new ValidationError('Schema validation failed', validate.errors), 1);
}

logger.success('Schema validation passed');

// Parse flags from YAML
let flags;
try {
  flags = parseFlagsFromDoc(yamlData);
} catch (e) {
  exitWithError(e, 1);
}

if (!flags.length) {
  exitWithError(new FlagDataError('No flags parsed from data/flag-data.yaml'), 1);
}

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Cleanup obsolete flag assets
try {
  const allowed = new Set();
  for (const f of flags) {
    try {
      const parts = (f.svg_url || '').split('/');
      const last = parts[parts.length - 1] || '';
      if (!last) continue;
      const base = sanitizeFilename(last).replace(/\.svg$/i, '');
      const id = canonicalizeId(base.replace(/\.svg$/i, ''));
      allowed.add(id + '.png');
      allowed.add(id + '.preview.png');
    } catch (e) {
      // Skip invalid entries
    }
  }
  const existing = fs.readdirSync(outDir);
  for (const fname of existing) {
    if (!allowed.has(fname)) {
      const full = join(outDir, fname);
      if (WANT_DRY) {
        logger.info(`Dry-run: would remove obsolete flag asset ${full}`);
      } else {
        try {
          fs.unlinkSync(full);
          logger.info(`Removed obsolete flag asset ${full}`);
        } catch (e) {
          logger.warn(`Failed to remove ${full}: ${e?.message}`);
        }
      }
    }
  }
} catch (e) {
  logger.warn(`Flag cleanup step failed: ${e?.message}`);
}

// Load optional dependencies
const playwright = await loadOptionalDep('playwright');

/**
 * Get media URL from Commons file page URL (improved version)
 * @param {string} filePageUrl - File page URL
 * @returns {Promise<string|null>} - Direct media URL or null
 */
async function getMediaUrlFromCommonsImproved(filePageUrl) {
  try {
    const parts = filePageUrl.split('/');
    const last = parts[parts.length - 1] || '';
    const title = decodeURIComponent(last);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=${encodeURIComponent(title)}`;
    
    const { fetchUrl } = await import('./lib/network.js');
    const body = await fetchUrl(apiUrl, 0);
    let obj = null;
    try {
      obj = JSON.parse(body.toString('utf8'));
    } catch (e) {
      return null;
    }
    if (!obj.query || !obj.query.pages) return null;
    const pages = obj.query.pages;
    const pageKeys = Object.keys(pages);
    if (!pageKeys.length) return null;
    const page = pages[pageKeys[0]];
    if (!page.imageinfo || !page.imageinfo.length) return null;
    const info = page.imageinfo[0];
    return info.url || null;
  } catch (e) {
    return null;
  }
}

/**
 * Process a single flag
 * @param {object} f - Flag data from YAML
 * @returns {Promise<object>} - Result with success flag and metadata
 */
async function workerForFlag(f) {
  logger.info(`Processing ${f.flagName || f.name} ${f.svg_url}`);
  try {
    let mediaUrl = await getMediaUrlFromCommonsImproved(f.svg_url);
    if (!mediaUrl) {
      const parts = f.svg_url.split('/');
      const last = parts[parts.length - 1];
      mediaUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(last)}`;
    }

    if (!mediaUrl) {
      throw new Error('Could not locate media URL');
    }

    const parsed = new URL(mediaUrl);
    const remoteBase = parsed.pathname.split('/').pop() || parsed.pathname.split('/').slice(-2).join('_');
    const sane = sanitizeFilename(remoteBase);
    const id = canonicalizeId(sane.replace(/\.svg$/i, ''));
    const filename = id + '.svg';
    const dst = join(outDir, filename);

    await sleep(400);
    if (WANT_DRY) {
      logger.info(`Dry-run: would download ${mediaUrl} to ${dst}`);
      return { success: true, name: f.flagName || f.name, dry: true };
    } else {
      await retryWithBackoff(() => fetchToFile(mediaUrl, dst, 30000), 3, 500);
    }

    let svgText = null;
    try {
      svgText = fs.readFileSync(dst, 'utf8');
    } catch (e) {
      svgText = null;
    }
    const colors = svgText ? extractColorsFromSvgText(svgText) : [];
    const size = (() => {
      try {
        return fs.statSync(dst).size;
      } catch (e) {
        return 0;
      }
    })();

    const metadata = {
      name: f.flagName || f.name,
      displayName: f.displayName,
      filename,
      source_page: f.svg_url,
      media_url: mediaUrl,
      size,
      description: f.description,
      category: f.category || null,
      categoryDisplayName: f.categoryDisplayName || null,
      categoryDisplayOrder: f.categoryDisplayOrder || null,
      reason: f.reason,
      references: f.references || null,
      colors,
      stripe_order: colors,
      cutoutMode: f.cutoutMode || null
    };

    if (svgText) {
      try {
        logger.info(`Rasterizing ${filename} to PNGs`);
        const base = filename.replace(/\.svg$/i, '');
        const pngFull = base + '.png';
        const pngPreview = base + '.preview.png';
        const tmpHtml = join(outDir, base + '.raster.tmp.html');

        let safeSvg = svgText.replace(/<\/?script[\s\S]*?>/gi, '');
        try {
          if (!/viewBox\s*=\s*"[^"]+"/i.test(safeSvg)) {
            const svgTagMatch = safeSvg.match(/<svg([^>]*)>/i);
            if (svgTagMatch) {
              const attrs = svgTagMatch[1];
              const wMatch = attrs.match(/width\s*=\s*"([0-9\.]+)(px)?"/i) || attrs.match(/width\s*=\s*'([0-9\.]+)(px)?'/i);
              const hMatch = attrs.match(/height\s*=\s*"([0-9\.]+)(px)?"/i) || attrs.match(/height\s*=\s*'([0-9\.]+)(px)?'/i);
              if (wMatch && hMatch) {
                const iw = parseFloat(wMatch[1]) || 0;
                const ih = parseFloat(hMatch[1]) || 0;
                if (iw > 0 && ih > 0) {
                  const newTag = svgTagMatch[0].replace(/<svg/i, `<svg viewBox="0 0 ${iw} ${ih}"`);
                  safeSvg = safeSvg.replace(svgTagMatch[0], newTag);
                }
              }
            }
          }
        } catch (e) {
          // Ignore viewBox fix errors
        }

        const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;}svg{display:block;width:100%;height:100%;}</style></head><body>${safeSvg}</body></html>`;
        fs.writeFileSync(tmpHtml, html, 'utf8');

        let aspect = 3 / 2;
        const vbMatch = svgText.match(/viewBox\s*=\s*"([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)"/i);
        if (vbMatch) {
          const w = parseFloat(vbMatch[3]);
          const h = parseFloat(vbMatch[4]);
          if (w > 0 && h > 0) aspect = w / h;
        }

        // Detect content bounds early to get accurate aspect ratio for preview height calculation
        let detectedAspectForPreview = aspect;
        if (playwright) {
          try {
            const { chromium } = playwright;
            const browser = await chromium.launch({ args: ['--no-sandbox'] });
            try {
              const context = await browser.newContext({ viewport: { width: 512, height: 512 } });
              const page = await context.newPage();
              await page.goto('file://' + tmpHtml);
              try {
                await page.waitForSelector('svg', { timeout: 3000 });
              } catch (e) {
                // Ignore timeout
              }
              const detected = await page.evaluate(() => {
                try {
                  const svg = document.querySelector('svg');
                  if (!svg) return null;
                  const s = new XMLSerializer().serializeToString(svg);
                  const img = new Image();
                  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
                  return new Promise(resolve => {
                    img.onload = function() {
                      try {
                        const iw = img.naturalWidth || 1;
                        const ih = img.naturalHeight || 1;
                        const tmp = document.createElement('canvas');
                        tmp.width = iw;
                        tmp.height = ih;
                        const tctx = tmp.getContext('2d');
                        tctx.clearRect(0, 0, iw, ih);
                        tctx.drawImage(img, 0, 0, iw, ih);
                        const imgd = tctx.getImageData(0, 0, iw, ih).data;
                        let minX = iw, minY = ih, maxX = 0, maxY = 0, any = false;
                        for (let y = 0; y < ih; y++) {
                          for (let x = 0; x < iw; x++) {
                            const i = (y * iw + x) * 4;
                            const a = imgd[i + 3];
                            const r = imgd[i];
                            const g = imgd[i + 1];
                            const b = imgd[i + 2];
                            if (a > 8 && !(r > 240 && g > 240 && b > 240)) {
                              any = true;
                              if (x < minX) minX = x;
                              if (x > maxX) maxX = x;
                              if (y < minY) minY = y;
                              if (y > maxY) maxY = y;
                            }
                          }
                        }
                        const srcW = any ? (maxX - minX + 1) : iw;
                        const srcH = any ? (maxY - minY + 1) : ih;
                        resolve(srcW / srcH);
                      } catch (e) {
                        resolve(null);
                      }
                    };
                    img.onerror = function() {
                      resolve(null);
                    };
                  });
                } catch (e) {
                  return null;
                }
              });
              if (detected) {
                detectedAspectForPreview = detected;
                aspect = detected;
              }
              await context.close();
            } finally {
              try {
                await browser.close();
              } catch (e) {
                // Ignore close errors
              }
            }
          } catch (e) {
            // Fall back to viewBox aspect ratio if detection fails
          }
        }

        const FULL_HEIGHT = config.image.fullHeight;
        const PREVIEW_WIDTH = config.image.previewWidth;
        const fullWidth = Math.max(64, Math.round(FULL_HEIGHT * aspect));
        const previewHeight = Math.max(64, Math.round(PREVIEW_WIDTH / detectedAspectForPreview));
        const targets = [
          { name: pngFull, width: fullWidth, height: FULL_HEIGHT, mode: 'slice' },
          { name: pngPreview, width: PREVIEW_WIDTH, height: previewHeight, mode: 'contain' }
        ];

        const MIN_PCT_PREVIEW = 1.0;
        const MIN_PCT_FULL = 1.0;

        for (const t of targets) {
          const outP = join(outDir, t.name);
          // Delete existing file if --force flag is set
          if (WANT_FORCE && fs.existsSync(outP)) {
            try {
              fs.unlinkSync(outP);
              logger.info(`Deleted existing ${outP} (--force flag)`);
            } catch (e) {
              logger.warn(`Failed to delete ${outP}: ${e?.message}`);
            }
          }
          let usedFast = false;

          try {
            await renderSvgWithResvgSharp(svgText, outP, t.width, t.height, t.mode);
            const stats = await analyzePngUsage(outP);
            const thresh = t.mode === 'slice' ? MIN_PCT_FULL : MIN_PCT_PREVIEW;
            // For 'contain' mode (previews), require both dimensions to meet threshold to avoid letterboxing
            // For 'slice' mode (full), either dimension meeting threshold is acceptable
            const meetsThreshold = t.mode === 'slice' 
              ? (stats.pctW >= thresh || stats.pctH >= thresh)
              : (stats.pctW >= thresh && stats.pctH >= thresh);
            
            if (meetsThreshold) {
              usedFast = true;
              logger.debug(`Fast path succeeded for ${t.name}`);
            } else {
              logger.warn(`Fast path failed threshold for ${t.name}, falling back to Playwright`);
              try {
                fs.unlinkSync(outP);
              } catch (e) {
                // Ignore
              }
            }
          } catch (e) {
            logger.warn(`Fast path failed for ${t.name}: ${e?.message}`);
            try {
              fs.unlinkSync(outP);
            } catch (e) {
              // Ignore
            }
          }

          if (!usedFast && playwright) {
            try {
              const { chromium } = playwright;
              const browser = await chromium.launch({ args: ['--no-sandbox'] });
              try {
                const context = await browser.newContext({ viewport: { width: t.width, height: t.height } });
                const page = await context.newPage();
                await page.goto('file://' + tmpHtml);
                try {
                  await page.waitForSelector('svg', { timeout: 3000 });
                } catch (e) {
                  // Ignore timeout
                }
                
                let detectedAspectRatio = null;
                try {
                  const svgHandle = await page.$('svg');
                  if (svgHandle) {
                    const result = await page.evaluate(() => {
                      try {
                        const svg = document.querySelector('svg');
                        if (!svg) return null;
                        const s = new XMLSerializer().serializeToString(svg);
                        const img = new Image();
                        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
                        return new Promise(resolve => {
                          img.onload = function() {
                            try {
                              const iw = img.naturalWidth || 1;
                              const ih = img.naturalHeight || 1;
                              const tmp = document.createElement('canvas');
                              tmp.width = iw;
                              tmp.height = ih;
                              const tctx = tmp.getContext('2d');
                              tctx.clearRect(0, 0, iw, ih);
                              tctx.drawImage(img, 0, 0, iw, ih);
                              const imgd = tctx.getImageData(0, 0, iw, ih).data;
                              let minX = iw, minY = ih, maxX = 0, maxY = 0, any = false;
                              for (let y = 0; y < ih; y++) {
                                for (let x = 0; x < iw; x++) {
                                  const i = (y * iw + x) * 4;
                                  const a = imgd[i + 3];
                                  const r = imgd[i];
                                  const g = imgd[i + 1];
                                  const b = imgd[i + 2];
                                  if (a > 8 && !(r > 240 && g > 240 && b > 240)) {
                                    any = true;
                                    if (x < minX) minX = x;
                                    if (x > maxX) maxX = x;
                                    if (y < minY) minY = y;
                                    if (y > maxY) maxY = y;
                                  }
                                }
                              }
                              const srcW = any ? (maxX - minX + 1) : iw;
                              const srcH = any ? (maxY - minY + 1) : ih;
                              return { aspectRatio: srcW / srcH, dataUrl: tmp.toDataURL('image/png') };
                            } catch (e) {
                              return null;
                            }
                          };
                          img.onerror = function() {
                            resolve(null);
                          };
                        });
                      } catch (e) {
                        return null;
                      }
                    });
                    if (result && result.dataUrl) {
                      const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, '');
                      fs.writeFileSync(outP, Buffer.from(base64, 'base64'));
                      if (result.aspectRatio) {
                        detectedAspectRatio = result.aspectRatio;
                      }
                    } else {
                      await svgHandle.screenshot({ path: outP, omitBackground: true });
                    }
                  } else {
                    await page.screenshot({ path: outP, omitBackground: true, fullPage: true });
                  }
                } catch (e) {
                  await page.screenshot({ path: outP, omitBackground: true, fullPage: true });
                }
                
                // Update aspect ratio if we detected content bounds
                if (detectedAspectRatio !== null) {
                  aspect = detectedAspectRatio;
                }

                await context.close();
                logger.info(`Wrote raster ${outP} (playwright)`);
              } finally {
                try {
                  await browser.close();
                } catch (e) {
                  // Ignore close errors
                }
              }
            } catch (e) {
              logger.warn(`Playwright rendering failed for ${outP}: ${e?.message}`);
            }
          } else if (!usedFast) {
            logger.warn(`No Playwright available to render ${outP} and fast-path failed; skipping.`);
          }
        }
        
        try {
          fs.unlinkSync(tmpHtml);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        metadata.png_full = id + '.png';
        metadata.png_preview = id + '.preview.png';
        metadata.aspectRatio = aspect;
        metadata.filename = filename;
        
        const pngFullPath = join(outDir, pngFull);
        if (fs.existsSync(pngFullPath)) {
          try {
            logger.info(`Extracting colors from PNG: ${pngFullPath}`);
            const pngColors = await extractColorsFromPng(pngFullPath);
            if (pngColors && pngColors.length > 0) {
              logger.info(`Extracted colors from PNG: ${pngColors.join(', ')}`);
              metadata.colors = pngColors;
              metadata.stripe_order = pngColors;
            }
          } catch (e) {
            logger.warn(`Failed to extract colors or analyze PNG: ${e?.message}`);
          }
        }
        
        if (!WANT_DRY) {
          try {
            fs.unlinkSync(dst);
            logger.info(`Removed source SVG ${dst}`);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } catch (e) {
        logger.warn(`Rasterization failed for ${filename}: ${e?.message}`);
      }
    }
    logger.info(`Wrote ${dst}`);
    return { success: true, metadata };
  } catch (err) {
    logger.error(`Failed for ${f.flagName || f.name}: ${err?.message}`);
    return { success: false, name: f.flagName || f.name, error: String(err) };
  }
}

// Use dynamic import for p-limit (ESM-only module)
let pLimit;
try {
  const pLimitModule = await import('p-limit');
  pLimit = pLimitModule.default || pLimitModule.pLimit;
} catch (e) {
  exitWithError(new ValidationError(`Failed to import p-limit: ${e.message}`), 1);
}

const limit = pLimit(3);
const tasks = flags.map(f => limit(() => workerForFlag(f)));
const results = await Promise.all(tasks.map(p => p.catch(e => ({ success: false, error: String(e) }))));

// Build runtime manifest from processing results
try {
  const manifest = [];
  for (const r of results) {
    if (!r || !r.success) continue;
    const m = r.metadata;
    if (!m || !m.filename) continue;
    const svg = m.filename;
    const id = svg.replace(/\.svg$/i, '');
    const png_full = m.png_full || (fs.existsSync(join(outDir, id + '.png')) ? id + '.png' : null);
    const png_preview = m.png_preview || (fs.existsSync(join(outDir, id + '.preview.png')) ? id + '.preview.png' : null);
    const layouts = [];
    if (Array.isArray(m.colors) && m.colors.length) {
      layouts.push({ type: 'ring', colors: m.colors });
    } else {
      layouts.push({ type: 'ring', colors: [] });
    }
    const entry = {
      id,
      name: m.name || id.replace(/_/g, ' '),
      displayName: m.displayName || m.name || id.replace(/_/g, ' '),
      svgFilename: svg,
      png_full,
      png_preview,
      aspectRatio: m.aspectRatio || null,
      source_page: m.source_page || null,
      media_url: m.media_url || null,
      description: m.description || null,
      category: m.category || null,
      categoryDisplayName: m.categoryDisplayName || null,
      categoryDisplayOrder: m.categoryDisplayOrder || null,
      reason: m.reason || null,
      references: m.references || null,
      layouts,
      size: m.size || null,
      cutoutMode: m.cutoutMode || null,
    };
    manifest.push(entry);
  }
  
  // Write TypeScript file instead of JSON
  const tsSource = generateTypeScriptSource(manifest);
  
  if (WANT_DRY) {
    logger.info(`Dry-run: would write flags.ts to ${flagsTsPath} with ${manifest.length} entries`);
  } else {
    fs.writeFileSync(flagsTsPath, tsSource, 'utf8');
    logger.success(`Successfully updated ${flagsTsPath}`);
    logger.info(`   Generated ${manifest.length} flag entries`);
  }
  
  // Post-run cleanup - only run if we have a valid manifest and not in dry-run
  if (!WANT_DRY && manifest.length > 0) {
    try {
      const allowed = new Set();
      for (const e of manifest) {
        if (e.png_full) allowed.add(e.png_full);
        if (e.png_preview) allowed.add(e.png_preview);
      }
      const existingFiles = fs.readdirSync(outDir);
      for (const fn of existingFiles) {
        const full = join(outDir, fn);
        try {
          const st = fs.statSync(full);
          if (st.isDirectory()) continue;
        } catch (e) {
          continue;
        }
        if (!allowed.has(fn)) {
          try {
            fs.unlinkSync(full);
            logger.info(`Removed stray flag asset ${full}`);
          } catch (e) {
            logger.warn(`Failed to remove stray asset ${full}: ${e?.message}`);
          }
        }
      }
    } catch (e) {
      logger.warn(`Post-run cleanup failed: ${e?.message}`);
    }
  } else if (WANT_DRY) {
    logger.info('Dry-run: skipping cleanup (would only run with valid manifest)');
  }
  
  // Report failures
  for (const r of results) {
    if (!r || r.success) continue;
    logger.warn(`Failed to fetch or process: ${r.name || '(unknown)'} ${r.error || 'unknown reason'}`);
  }
} catch (e) {
  logger.warn(`Failed to write runtime manifest: ${e?.message}`);
}

// Commit changes
try {
  if (WANT_DRY) {
    logger.info('Dry-run: skipping git commit/push.');
  } else if (WANT_CI || WANT_PUSH) {
    try {
      logger.info('Running flag SVG validation...');
      execSync('node scripts/validate-flags.js', { stdio: 'inherit' });
    } catch (err) {
      logger.error('Flag validation failed — aborting commit/push.');
      throw err;
    }
    logger.info('Staging public/flags and committing changes...');
    execSync('git config user.email "actions@github.com"');
    execSync('git config user.name "github-actions[bot]"');
    execSync('git add public/flags');
    execSync('git commit -m "chore: update flags (automated)"', { stdio: 'inherit' });
    execSync('git push');
    logger.success('Committed and pushed changes.');
  } else {
    logger.info('Not in CI and --push not supplied; skipping git commit/push. Use --push or --ci to enable.');
  }
} catch (e) {
  logger.warn(`Commit/push skipped or failed: ${e?.message}`);
}
