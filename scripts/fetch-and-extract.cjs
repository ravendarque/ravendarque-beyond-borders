#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const path = require('path');
const child_process = require('child_process');

// CLI args
const argv = process.argv.slice(2);
const WANT_PUSH = argv.includes('--push');
const WANT_CI = argv.includes('--ci') || process.env.CI === 'true';
const WANT_DRY = argv.includes('--dry-run');
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Usage: node scripts/fetch-and-extract.cjs [--push] [--ci] [--dry-run]\n  --push   allow git add/commit/push (local override)\n  --ci     treat run as CI (also allows commit)\n  --dry-run  only simulate actions (no network writes)');
  process.exit(0);
}

const dataYamlPath = path.resolve(__dirname, '..', 'data', 'flag-data.yaml');
if (!fs.existsSync(dataYamlPath)) {
  console.error('data/flag-data.yaml not found. Please add it.');
  process.exit(1);
}
const yamlText = fs.readFileSync(dataYamlPath, 'utf8');

const helpers = require('./lib/helpers.cjs');

function canonicalizeId(name) {
  if (!name) return '';
  name = name.replace(/\.[a-z0-9]+$/i, '');
  name = name.toLowerCase();
  name = name.replace(/[_\s]+/g, '-');
  name = name.replace(/flags?/g, '');
  name = name.replace(/[^a-z0-9-]/g, '');
  name = name.replace(/-+/g, '-');
  name = name.replace(/(^|-)of-/g, '$1');
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  if (!name) name = 'unknown';
  return name;
}

let playwright = null;
try {
  playwright = require('playwright');
} catch (e) {
  playwright = null;
}

function mapCategoryToCode(category) {
  const mapping = {
    'Authoritarian State': 'authoritarian',
    'Occupied / Disputed Territory': 'occupied',
    'Stateless People': 'stateless',
    'Oppressed Groups': 'oppressed',
  };
  return mapping[category] || null;
}

function parseFlagsFromYaml(yaml) {
  const jsyaml = require('js-yaml');
  const doc = jsyaml.load(yaml);
  
  if (Array.isArray(doc)) return doc;
  if (doc && Array.isArray(doc.flags)) return doc.flags;
  
  console.error('Error: YAML structure is invalid. Expected { flags: [...] } or an array.');
  process.exit(1);
}

const flags = parseFlagsFromYaml(yamlText);
if (!flags.length) {
  console.error('No flags parsed from data/flag-data.yaml');
  process.exit(1);
}

const outDir = path.resolve(__dirname, '..', 'public', 'flags');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Cleanup obsolete flag assets
try {
  const allowed = new Set();
  for (const f of flags) {
    try {
      const parts = (f.svg_url || '').split('/');
      const last = parts[parts.length - 1] || '';
      if (!last) continue;
      const base = helpers.sanitizeFilename(last).replace(/\.svg$/i, '');
      const id = canonicalizeId(base.replace(/\.svg$/i, ''));
      allowed.add(id + '.png');
      allowed.add(id + '.preview.png');
      // No longer generating flags.json - using flags.ts instead
    } catch {}
  }
  const existing = fs.readdirSync(outDir);
  for (const fname of existing) {
    if (!allowed.has(fname)) {
      const full = path.join(outDir, fname);
      if (WANT_DRY) {
        console.log('Dry-run: would remove obsolete flag asset', full);
      } else {
        try {
          fs.unlinkSync(full);
          console.log('Removed obsolete flag asset', full);
        } catch (e) {
          console.warn('Failed to remove', full, e && e.message);
        }
      }
    }
  }
} catch (e) {
  console.warn('Flag cleanup step failed', e && e.message);
}

function fetchUrl(url, attempts = 0) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    opts.headers = {
      'User-Agent': 'beyond-borders-fetcher/1.0 (+https://github.com/ravendarque/beyond-borders)',
      'Referer': 'https://commons.wikimedia.org/',
      'Accept': '*/*'
    };
    https.get(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, 0));
      }
      if ((res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600) || res.statusCode === 403) && attempts < 5) {
        const backoff = 800 * Math.pow(2, attempts);
        console.log('Retryable status', res.statusCode, 'for', url, '-> retry in', backoff, 'ms');
        setTimeout(() => resolve(fetchUrl(url, attempts + 1)), backoff);
        return;
      }
      if (res.statusCode !== 200) return reject(new Error('Bad status ' + res.statusCode + ' for ' + url));
      const bufs = [];
      res.on('data', (d) => bufs.push(d));
      res.on('end', () => resolve(Buffer.concat(bufs)));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

let Sharp = null;
let Resvg = null;
try {
  Sharp = require('sharp');
} catch (e) {
  Sharp = null;
}
try {
  Resvg = require('@resvg/resvg-js').Resvg;
} catch (e) {
  Resvg = null;
}

async function renderSvgWithResvgSharp(svgText, dstPath, width, height, mode = 'slice') {
  if (!Sharp) throw new Error('sharp not available');
  let srcPngBuf = null;
  try {
    if (Resvg) {
      try {
        const inst = new Resvg(svgText);
        const pngData = inst.render();
        srcPngBuf = Buffer.from(pngData.asPng());
      } catch (e) {
        srcPngBuf = null;
      }
    }
  } catch (e) {
    srcPngBuf = null;
  }

  try {
    const fit = mode === 'slice' ? 'cover' : 'contain';
    if (srcPngBuf) {
      await Sharp(srcPngBuf).resize(width, height, { fit, position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(dstPath);
    } else {
      await Sharp(Buffer.from(svgText)).resize(width, height, { fit, position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(dstPath);
    }
    return true;
  } catch (e) {
    throw e;
  }
}

async function analyzePngUsage(pngPath) {
  if (!Sharp) return { pctW: 1, pctH: 1, usedW: null, usedH: null };
  try {
    const { data, info } = await Sharp(pngPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;
    const bytes = data;
    let minX = w, minY = h, maxX = 0, maxY = 0, any = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * info.channels;
        const a = bytes[i + (info.channels - 1)];
        const r = bytes[i]; const g = bytes[i + 1]; const b = bytes[i + 2];
        if (a > 8 && !(r > 240 && g > 240 && b > 240)) {
          any = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!any) return { pctW: 0, pctH: 0, usedW: 0, usedH: 0 };
    const usedW = maxX - minX + 1;
    const usedH = maxY - minY + 1;
    return { pctW: usedW / w, pctH: usedH / h, usedW, usedH };
  } catch (e) {
    return { pctW: 1, pctH: 1, usedW: null, usedH: null };
  }
}

function fetchToFile(url, dst, timeoutMs = 30000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const opts = new URL(url);
    opts.headers = {
      'User-Agent': 'beyond-borders-fetcher/1.0 (+https://github.com/ravendarque/beyond-borders)',
      'Referer': 'https://commons.wikimedia.org/',
      'Accept': '*/*'
    };
    const req = https.get(opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        return resolve(fetchToFile(res.headers.location, dst, timeoutMs, maxRedirects - 1));
      }
      if ((res.statusCode === 429 || (res.statusCode >= 500 && res.statusCode < 600) || res.statusCode === 403)) {
        return reject(new Error('Retryable status ' + res.statusCode + ' for ' + url));
      }
      if (res.statusCode !== 200) return reject(new Error('Bad status ' + res.statusCode + ' for ' + url));
      const ws = fs.createWriteStream(dst);
      let finished = false;
      const onDone = () => {
        if (finished) return;
        finished = true;
        ws.close();
        try {
          const st = fs.statSync(dst);
          resolve(st.size);
        } catch (e) { resolve(0); }
      };
      const onError = (err) => {
        if (finished) return;
        finished = true;
        try { ws.destroy(); } catch (e) {}
        reject(err);
      };
      res.pipe(ws);
      res.on('error', onError);
      ws.on('finish', onDone);
      ws.on('error', onError);
      res.setTimeout(timeoutMs, () => onError(new Error('Timeout downloading ' + url)));
    }).on('error', (err) => reject(err));
  });
}

async function retryWithBackoff(fn, attempts = 3, initialDelay = 500) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        const backoff = initialDelay * Math.pow(2, i);
        await new Promise((res) => setTimeout(res, backoff));
      }
    }
  }
  throw lastErr;
}

// Simple color name guesser for TypeScript generation
function getColorLabel(hex) {
  if (!hex || hex === 'none') return '';
  const h = hex.toLowerCase();
  
  const colorMap = {
    '#ffffff': 'white',
    '#000000': 'black',
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#00ffff': 'cyan',
    '#ffa500': 'orange',
    '#800080': 'purple',
    '#ffc0cb': 'pink',
    '#a52a2a': 'brown',
    '#808080': 'gray',
    '#ffd700': 'gold',
  };

  if (colorMap[h]) return colorMap[h];

  const r = parseInt(h.slice(1, 3), 16) || 0;
  const g = parseInt(h.slice(3, 5), 16) || 0;
  const b = parseInt(h.slice(5, 7), 16) || 0;

  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
    if (r > 200) return 'white';
    if (r < 50) return 'black';
    return 'gray';
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 30) return 'gray';

  if (r === max && g > 100 && b < 100) return 'orange';
  if (r === max && g > 150) return 'yellow';
  if (r === max) return 'red';
  if (g === max && b > 100) return 'cyan';
  if (g === max) return 'green';
  if (b === max && r > 100) return 'purple';
  if (b === max) return 'blue';

  return 'color';
}

// Generate TypeScript source code for flags.ts
function generateTypeScriptSource(manifest) {
  const lines = [
    "import { FlagSpec } from './schema';",
    '',
    '/**',
    ' * Flag definitions generated from flag-data.yaml',
    ' * Do not edit manually - run scripts/fetch-and-extract.cjs to regenerate',
    ' */',
    'export const flags: FlagSpec[] = [',
  ];

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const isLast = i === manifest.length - 1;

    lines.push('  {');
    lines.push(`    id: '${entry.id}',`);
    lines.push(`    name: '${(entry.name || entry.displayName).replace(/'/g, "\\'")}',`);
    
    if (entry.displayName) {
      lines.push(`    displayName: '${entry.displayName.replace(/'/g, "\\'")}',`);
    }
    
    if (entry.png_full) {
      lines.push(`    png_full: '${entry.png_full}',`);
    }
    
    if (entry.png_preview) {
      lines.push(`    png_preview: '${entry.png_preview}',`);
    }
    
    if (entry.svgFilename) {
      lines.push(`    svgFilename: '${entry.svgFilename}',`);
    }
    
    if (entry.category) {
      lines.push(`    category: '${entry.category}',`);
    }
    
    // Generate layouts array from colors
    if (entry.layouts && entry.layouts.length > 0) {
      lines.push('    layouts: [');
      for (let j = 0; j < entry.layouts.length; j++) {
        const layout = entry.layouts[j];
        const isLastLayout = j === entry.layouts.length - 1;
        lines.push('      {');
        lines.push(`        type: '${layout.type}',`);
        if (layout.colors && layout.colors.length > 0) {
          lines.push('        colors: [');
          for (let k = 0; k < layout.colors.length; k++) {
            const color = layout.colors[k];
            const isLastColor = k === layout.colors.length - 1;
            lines.push(`          '${color}'${isLastColor ? '' : ','}`);
          }
          lines.push('        ],');
        } else {
          lines.push('        colors: [],');
        }
        lines.push(`      }${isLastLayout ? '' : ','}`);
      }
      lines.push('    ],');
    }
    
    if (entry.source_page || entry.link) {
      const refUrl = entry.link || entry.source_page || 'https://en.wikipedia.org';
      lines.push(`    sources: { referenceUrl: '${refUrl.replace(/'/g, "\\'")}' },`);
    }
    
    if (entry.focalPoint) {
      lines.push(`    focalPoint: { x: ${entry.focalPoint.x}, y: ${entry.focalPoint.y} },`);
    }
    
    lines.push(`  }${isLast ? '' : ','}`);
  }

  lines.push('];');
  lines.push('');

  return lines.join('\n');
}

async function getMediaUrlFromCommons(filePageUrl) {
  try {
    const parts = filePageUrl.split('/');
    const last = parts[parts.length - 1] || '';
    const title = decodeURIComponent(last);
    const apiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=' + encodeURIComponent(title);
    const body = await fetchUrl(apiUrl);
    let obj = null;
    try { obj = JSON.parse(body.toString('utf8')); } catch (e) { return null; }
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

async function workerForFlag(f) {
  console.log('Processing', f.name, f.svg_url);
  try {
    let mediaUrl = await getMediaUrlFromCommons(f.svg_url);
    if (!mediaUrl) {
      const parts = f.svg_url.split('/');
      const last = parts[parts.length - 1];
      mediaUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(last);
    }

    if (!mediaUrl) throw new Error('Could not locate media URL');

    const parsed = new URL(mediaUrl);
    const remoteBase = parsed.pathname.split('/').pop() || parsed.pathname.split('/').slice(-2).join('_');
    const sane = helpers.sanitizeFilename(remoteBase);
    const id = canonicalizeId(sane.replace(/\.svg$/i, ''));
    const filename = id + '.svg';
    const dst = path.join(outDir, filename);

    await sleep(400);
    if (WANT_DRY) {
      console.log('Dry-run: would download', mediaUrl, 'to', dst);
      return { success: true, name: f.name, dry: true };
    } else {
      await retryWithBackoff(() => fetchToFile(mediaUrl, dst, 30000), 3, 500);
    }

    let svgText = null;
    try { svgText = fs.readFileSync(dst, 'utf8'); } catch (e) { svgText = null; }
    const colors = svgText ? helpers.extractColorsFromSvgText(svgText) : [];
    const size = (() => {
      try { return fs.statSync(dst).size; } catch (e) { return 0; }
    })();

    const metadata = {
      name: f.name,
      displayName: f.displayName,
      filename,
      source_page: f.svg_url,
      media_url: mediaUrl,
      size,
      description: f.description,
      category: mapCategoryToCode(f.category),
      reason: f.reason,
      link: f.link,
      colors,
      stripe_order: colors
    };

    if (svgText) {
      try {
        console.log('Rasterizing', filename, 'to PNGs');
        const base = filename.replace(/\.svg$/i, '');
        const pngFull = base + '.png';
        const pngPreview = base + '.preview.png';
        const tmpHtml = path.join(outDir, base + '.raster.tmp.html');

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
                  const newTag = svgTagMatch[0].replace(/<svg/i, `<svg viewBox=\"0 0 ${iw} ${ih}\"`);
                  safeSvg = safeSvg.replace(svgTagMatch[0], newTag);
                }
              }
            }
          }
        } catch (e) {}

        const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;}svg{display:block;width:100%;height:100%;}</style></head><body>${safeSvg}</body></html>`;
        fs.writeFileSync(tmpHtml, html, 'utf8');

        let aspect = 3 / 2;
        const vbMatch = svgText.match(/viewBox\s*=\s*"([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)"/i);
        if (vbMatch) {
          const w = parseFloat(vbMatch[3]);
          const h = parseFloat(vbMatch[4]);
          if (w > 0 && h > 0) aspect = w / h;
        }

        const FULL_HEIGHT = 1365;
        const PREVIEW_WIDTH = 200;
        const PREVIEW_HEIGHT = 100;
        const fullWidth = Math.max(64, Math.round(FULL_HEIGHT * aspect));
        const targets = [
          { name: pngFull, width: fullWidth, height: FULL_HEIGHT, mode: 'slice' },
          { name: pngPreview, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, mode: 'slice' }
        ];

        const MIN_PCT_PREVIEW = 1.0;
        const MIN_PCT_FULL = 1.0;
        let computedFocal = null;

        for (const t of targets) {
          const outP = path.join(outDir, t.name);
          let usedFast = false;

          if (Resvg && Sharp) {
            try {
              await renderSvgWithResvgSharp(svgText, outP, t.width, t.height, t.mode);
              const stats = await analyzePngUsage(outP);
              const thresh = t.mode === 'slice' ? MIN_PCT_FULL : MIN_PCT_PREVIEW;
              if ((stats.pctW || 0) >= thresh || (stats.pctH || 0) >= thresh) {
                usedFast = true;
                console.log('Fast-path wrote raster', outP, 'coverage=', stats);
                if (!computedFocal) computedFocal = { x: 0.5, y: 0.5 };
              } else {
                console.log('Fast-path produced low coverage for', outP, 'coverage=', stats);
                try { fs.unlinkSync(outP); } catch (e) {}
              }
            } catch (e) {
              console.log('Fast-path failed for', outP, e && e.message);
              try { fs.unlinkSync(outP); } catch (e) {}
            }
          }

          if (!usedFast && playwright) {
            const chromium = playwright.chromium;
            const browser = await chromium.launch({ args: ['--no-sandbox'] });
            try {
              const context = await browser.newContext({ viewport: { width: t.width, height: t.height } });
              const page = await context.newPage();
              await page.goto('file://' + tmpHtml);
              try { await page.waitForSelector('svg', { timeout: 3000 }); } catch {}
              try {
                await page.evaluate((w, h, mode) => {
                  const svg = document.querySelector('svg');
                  if (!svg) return;
                  try {
                    svg.setAttribute('width', String(w));
                    svg.setAttribute('height', String(h));
                    svg.setAttribute('preserveAspectRatio', mode === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet');
                    if (svg.style) { svg.style.setProperty('width', w + 'px'); svg.style.setProperty('height', h + 'px'); }
                  } catch (e) {}
                }, t.width, t.height, t.mode);
              } catch (e) {}

              if (!computedFocal) {
                try {
                  computedFocal = await page.evaluate(() => {
                    try {
                      const svg = document.querySelector('svg');
                      if (!svg) return { x: 0.5, y: 0.5 };
                      const rect = svg.getBoundingClientRect();
                      const cw = Math.max(1, Math.round(rect.width));
                      const ch = Math.max(1, Math.round(rect.height));
                      const canvas = document.createElement('canvas');
                      canvas.width = cw; canvas.height = ch;
                      const ctx = canvas.getContext('2d');
                      const s = new XMLSerializer().serializeToString(svg);
                      const img = new Image();
                      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
                      return new Promise(resolve => {
                        img.onload = function() {
                          try {
                            ctx.drawImage(img, 0, 0, cw, ch);
                            const imgd = ctx.getImageData(0, 0, cw, ch).data;
                            let sumx = 0, sumy = 0, count = 0;
                            for (let y = 0; y < ch; y++) {
                              for (let x = 0; x < cw; x++) {
                                const i = (y * cw + x) * 4;
                                const a = imgd[i + 3]; const r = imgd[i]; const g = imgd[i+1]; const b = imgd[i+2];
                                if (a < 16) continue;
                                if (r > 240 && g > 240 && b > 240) continue;
                                sumx += x; sumy += y; count++;
                              }
                            }
                            if (count === 0) return resolve({ x: 0.5, y: 0.5 });
                            resolve({ x: sumx / count / cw, y: sumy / count / ch });
                          } catch (e) { resolve({ x: 0.5, y: 0.5 }); }
                        };
                        img.onerror = function() { resolve({ x: 0.5, y: 0.5 }); };
                      });
                    } catch (e) { return { x: 0.5, y: 0.5 }; }
                  });
                } catch (e) { computedFocal = { x: 0.5, y: 0.5 }; }
              }

              try {
                const svgHandle = await page.$('svg');
                if (svgHandle) {
                  const dataUrl = await page.evaluate(async (w, h, mode, focal) => {
                    try {
                      const svg = document.querySelector('svg');
                      const s = new XMLSerializer().serializeToString(svg);
                      const img = new Image();
                      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
                      await new Promise((res) => { img.onload = res; img.onerror = res; setTimeout(res, 2000); });
                      const iw = img.naturalWidth || 1; const ih = img.naturalHeight || 1;
                      const tmp = document.createElement('canvas'); tmp.width = iw; tmp.height = ih;
                      const tctx = tmp.getContext('2d'); tctx.clearRect(0,0,iw,ih); tctx.drawImage(img,0,0,iw,ih);
                      const imgd = tctx.getImageData(0,0,iw,ih).data;
                      let minX = iw, minY = ih, maxX = 0, maxY = 0, any = false;
                      for (let y = 0; y < ih; y++) {
                        for (let x = 0; x < iw; x++) {
                          const i = (y * iw + x) * 4;
                          const a = imgd[i + 3]; const r = imgd[i]; const g = imgd[i+1]; const b = imgd[i+2];
                          if (a > 8 && !(r > 240 && g > 240 && b > 240)) { any = true; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
                        }
                      }
                      const srcX = any ? minX : 0; const srcY = any ? minY : 0; const srcW = any ? (maxX - minX + 1) : iw; const srcH = any ? (maxY - minY + 1) : ih;
                      const dst = { w: w, h: h };
                      const srcRatio = srcW / srcH; const dstRatio = dst.w / dst.h;
                      let dw, dh, dx, dy;
                      if (mode === 'slice') {
                        if (srcRatio > dstRatio) { dh = dst.h; dw = Math.round(dh * srcRatio); }
                        else { dw = dst.w; dh = Math.round(dw / srcRatio); }
                        let focalRelX = 0.5, focalRelY = 0.5;
                        try {
                          if (focal && typeof focal.x === 'number' && typeof focal.y === 'number') {
                            const svg = document.querySelector('svg');
                            const rect = svg.getBoundingClientRect();
                            const cw = Math.max(1, Math.round(rect.width));
                            const ch = Math.max(1, Math.round(rect.height));
                            const focalAbsX = Math.round(focal.x * cw);
                            const focalAbsY = Math.round(focal.y * ch);
                            focalRelX = Math.min(1, Math.max(0, (focalAbsX - srcX) / srcW));
                            focalRelY = Math.min(1, Math.max(0, (focalAbsY - srcY) / srcH));
                          }
                        } catch (e) {}
                        dx = Math.round(dst.w / 2 - focalRelX * dw);
                        dy = Math.round(dst.h / 2 - focalRelY * dh);
                        if (dx > 0) dx = 0;
                        if (dx < dst.w - dw) dx = dst.w - dw;
                        if (dy > 0) dy = 0;
                        if (dy < dst.h - dh) dy = dst.h - dh;
                        const c = document.createElement('canvas'); c.width = dst.w; c.height = dst.h; const ctx = c.getContext('2d'); ctx.clearRect(0,0,dst.w,dst.h);
                        ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
                        return c.toDataURL('image/png');
                      } else {
                        if (srcRatio > dstRatio) { dw = dst.w; dh = Math.round(dw / srcRatio); dx = Math.round((dst.w - dw) / 2); dy = Math.round((dst.h - dh) / 2); }
                        else { dh = dst.h; dw = Math.round(dh * srcRatio); dx = Math.round((dst.w - dw) / 2); dy = Math.round((dst.h - dh) / 2); }
                        const c = document.createElement('canvas'); c.width = dst.w; c.height = dst.h; const ctx = c.getContext('2d'); ctx.clearRect(0,0,dst.w,dst.h);
                        ctx.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
                        return c.toDataURL('image/png');
                      }
                    } catch (e) { return null; }
                  }, t.width, t.height, t.mode, (computedFocal || null));
                  if (dataUrl) {
                    const base64 = dataUrl.replace(/^data:image\/png;base64,/, ''); require('fs').writeFileSync(outP, Buffer.from(base64, 'base64'));
                  } else {
                    await svgHandle.screenshot({ path: outP, omitBackground: true });
                  }
                } else {
                  await page.screenshot({ path: outP, omitBackground: true, fullPage: true });
                }
              } catch (e) {
                await page.screenshot({ path: outP, omitBackground: true, fullPage: true });
              }

              await context.close();
              console.log('Wrote raster', outP, 'focal= (playwright)');
            } finally {
              try { await browser.close(); } catch (e) {}
            }
          } else if (!usedFast) {
            console.log('No Playwright available to render', outP, 'and fast-path failed; skipping.');
          }
        }
        try { fs.unlinkSync(tmpHtml); } catch (e) {}
        metadata.png_full = id + '.png';
        metadata.png_preview = id + '.preview.png';
        metadata.filename = filename;
        if (computedFocal) {
          metadata.focalPoint = computedFocal;
        }
        
        const pngFullPath = path.join(outDir, pngFull);
        if (fs.existsSync(pngFullPath)) {
          try {
            console.log('Extracting colors from PNG:', pngFullPath);
            const pngColors = await helpers.extractColorsFromPng(pngFullPath);
            if (pngColors && pngColors.length > 0) {
              console.log('Extracted colors from PNG:', pngColors);
              metadata.colors = pngColors;
              metadata.stripe_order = pngColors;
            }
          } catch (e) {
            console.warn('Failed to extract colors from PNG:', e.message);
          }
        }
        
        if (!WANT_DRY) {
          try { fs.unlinkSync(dst); console.log('Removed source SVG', dst); } catch (e) {}
        }
      } catch (e) {
        console.warn('Rasterization failed for', filename, e && e.message);
      }
    }
    console.log('Wrote', dst);
    return { success: true, metadata };
  } catch (err) {
    console.error('Failed for', f.name, err && err.message);
    return { success: false, name: f.name, error: String(err) };
  }
}

// Use dynamic import for p-limit (ESM-only module)
(async () => {
  // Import p-limit dynamically to handle ESM-only module
  let pLimit;
  try {
    const pLimitModule = await import('p-limit');
    pLimit = pLimitModule.default || pLimitModule.pLimit;
  } catch (e) {
    console.error('Failed to import p-limit:', e.message);
    process.exit(1);
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
      const png_full = m.png_full || (fs.existsSync(path.join(outDir, id + '.png')) ? id + '.png' : null);
      const png_preview = m.png_preview || (fs.existsSync(path.join(outDir, id + '.preview.png')) ? id + '.preview.png' : null);
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
        source_page: m.source_page || null,
        media_url: m.media_url || null,
        description: m.description || null,
        category: m.category || null,
        reason: m.reason || null,
        link: m.link || null,
        layouts,
        focalPoint: m.focalPoint || null,
        size: m.size || null,
      };
      manifest.push(entry);
    }
    // Write TypeScript file instead of JSON
    const flagsTsPath = path.resolve(__dirname, '..', 'src', 'flags', 'flags.ts');
    const tsSource = generateTypeScriptSource(manifest);
    
    if (WANT_DRY) {
      console.log('Dry-run: would write flags.ts to', flagsTsPath, 'with', manifest.length, 'entries');
    } else {
      fs.writeFileSync(flagsTsPath, tsSource, 'utf8');
      console.log('✅ Successfully updated', flagsTsPath);
      console.log(`   Generated ${manifest.length} flag entries`);
    }
    
    // Post-run cleanup
    try {
      const allowed = new Set();
      // No longer need flags.json in public/flags/ - now generating flags.ts in src/flags/
      for (const e of manifest) {
        if (e.png_full) allowed.add(e.png_full);
        if (e.png_preview) allowed.add(e.png_preview);
      }
      const existingFiles = fs.readdirSync(outDir);
      for (const fn of existingFiles) {
        const full = path.join(outDir, fn);
        try {
          const st = fs.statSync(full);
          if (st.isDirectory()) continue;
        } catch (e) { continue; }
        if (!allowed.has(fn)) {
          if (WANT_DRY) {
            console.log('Dry-run: would remove stray flag asset', full);
          } else {
            try {
              fs.unlinkSync(full);
              console.log('Removed stray flag asset', full);
            } catch (e) {
              console.warn('Failed to remove stray asset', full, e && e.message);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Post-run cleanup failed', e && e.message);
    }
    
    // Report failures
    for (const r of results) {
      if (!r || r.success) continue;
      console.warn('Failed to fetch or process:', r.name || '(unknown)', r.error || 'unknown reason');
    }
  } catch (e) {
    console.warn('Failed to write runtime manifest', e && e.message);
  }
  
  // Commit changes
  try {
    if (WANT_DRY) {
      console.log('Dry-run: skipping git commit/push.');
    } else if (WANT_CI || WANT_PUSH) {
      try {
        console.log('Running flag SVG validation...');
        child_process.execSync('node scripts/validate-flags.cjs', { stdio: 'inherit' });
      } catch (err) {
        console.error('Flag validation failed — aborting commit/push.');
        throw err;
      }
      console.log('Staging public/flags and committing changes...');
      child_process.execSync('git config user.email "actions@github.com"');
      child_process.execSync('git config user.name "github-actions[bot]"');
      child_process.execSync('git add public/flags');
      child_process.execSync('git commit -m "chore: update flags (automated)"', { stdio: 'inherit' });
      child_process.execSync('git push');
      console.log('Committed and pushed changes.');
    } else {
      console.log('Not in CI and --push not supplied; skipping git commit/push. Use --push or --ci to enable.');
    }
  } catch (e) {
    console.log('Commit/push skipped or failed:', e && e.message);
  }
})();