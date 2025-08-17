#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const path = require('path');
const child_process = require('child_process');

// CLI args
const argv = process.argv.slice(2);
const WANT_PUSH = argv.includes('--push'); // explicit flag to allow committing/pushing
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

// crude YAML parser for our well-formed input
function parseFlagsFromYaml(yaml) {
  // try to use js-yaml if available for robust parsing, otherwise fall back
  try {
    const jsyaml = require('js-yaml');
    const doc = jsyaml.load(yaml);
    if (Array.isArray(doc)) return doc;
    // allow manifest as { flags: [...] }
    if (doc && Array.isArray(doc.flags)) return doc.flags;
    // fallback: try to coerce object entries into array
    return Object.keys(doc || {}).map(k => doc[k]).filter(Boolean);
  } catch (e) {
    console.warn('js-yaml not available or parse failed; falling back to simple parser (install js-yaml for robust YAML).');
  }

  const blocks = yaml.split(/\n\s*-\s+/).map(s => s.trim()).filter(Boolean);
  const flags = [];
  for (const b of blocks) {
    // ensure starts with name or contains name:
    const nameMatch = b.match(/name:\s*"([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const svgMatch = b.match(/svg_url:\s*"([^"]+)"/);
    const descriptionMatch = b.match(/description:\s*"([^"]+)"/);
    const typeMatch = b.match(/type:\s*"([^"]+)"/);
    const reasonMatch = b.match(/reason:\s*"([^"]+)"/);
    const linkMatch = b.match(/link:\s*"([^"]+)"/);
    flags.push({ name, svg_url: svgMatch ? svgMatch[1] : null, description: descriptionMatch ? descriptionMatch[1] : null, type: typeMatch ? typeMatch[1] : null, reason: reasonMatch ? reasonMatch[1] : null, link: linkMatch ? linkMatch[1] : null });
  }
  return flags;
}

const flags = parseFlagsFromYaml(yamlText);
if (!flags.length) {
  console.error('No flags parsed from data/flag-data.yaml');
  process.exit(1);
}

const outDir = path.resolve(__dirname, '..', 'public', 'flags');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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
        // treat 403/429/5xx as potentially transient; backoff and retry
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

function bufferToStringMaybeHtml(buf) {
  try {
    const s = buf.toString('utf8');
    if (s.indexOf('<html') !== -1 || s.indexOf('<!doctype html') !== -1) return s;
    return null;
  } catch (e) { return null; }
}

// use helpers.sanitizeFilename

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Stream download helper: saves url contents to dst and returns size in bytes.
// Handles simple redirects up to maxRedirects.
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
        // follow redirect
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
      // socket timeout
      res.setTimeout(timeoutMs, () => onError(new Error('Timeout downloading ' + url)));
    }).on('error', (err) => reject(err));
  });
}

async function getMediaUrlFromCommons(filePageUrl) {
  try {
    // extract the File:Name part
    const parts = filePageUrl.split('/');
    const last = parts[parts.length - 1] || '';
    const title = decodeURIComponent(last);
    const apiUrl = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=' + encodeURIComponent(title);
    // fetch JSON via https
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

// use helpers.extractColorsFromSvgText

async function workerForFlag(f) {
  console.log('Processing', f.name, f.svg_url);
  try {
    // resolve media URL via Commons API (more reliable)
    let mediaUrl = await getMediaUrlFromCommons(f.svg_url);
      // fallback to Special:FilePath if API failed
      if (!mediaUrl) {
        const parts = f.svg_url.split('/');
        const last = parts[parts.length - 1];
        mediaUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(last);
      }

      if (!mediaUrl) throw new Error('Could not locate media URL');

      // get filename and fetch bytes
      const parsed = new URL(mediaUrl);
  const filename = helpers.sanitizeFilename(parsed.pathname.split('/').pop() || parsed.pathname.split('/').slice(-2).join('_'));
      const dst = path.join(outDir, filename);
      // Throttle a bit between media downloads to avoid triggering rate limits
      await sleep(400);
      if (WANT_DRY) {
        console.log('Dry-run: would download', mediaUrl, 'to', dst);
        // skip metadata writes in dry-run
        return { success: true, name: f.name, dry: true };
      } else {
        // stream to file with timeout and retry/backoff
        await retryWithBackoff(() => fetchToFile(mediaUrl, dst, 30000), 3, 500);
      }

      // attempt to extract colors by reading file as utf8 (many svg files are text)
      let svgText = null;
      try { svgText = fs.readFileSync(dst, 'utf8'); } catch (e) { svgText = null; }
  const colors = svgText ? helpers.extractColorsFromSvgText(svgText) : [];
      const size = (() => {
        try { return fs.statSync(dst).size; } catch (e) { return 0; }
      })();
      const metadata = {
        name: f.name,
        filename,
        source_page: f.svg_url,
        media_url: mediaUrl,
        size,
        description: f.description,
        type: f.type,
        reason: f.reason,
        link: f.link,
        colors,
        stripe_order: colors // provisional: use colors as stripe order proxy
      };
  // write per-flag metadata next to svg
  const metaDst = path.join(outDir, filename + '.json');
  fs.writeFileSync(metaDst, JSON.stringify(metadata, null, 2));
  console.log('Wrote', dst, size, 'and', metaDst);
    return { success: true, metadata };
  } catch (err) {
    console.error('Failed for', f.name, err && err.message);
    return { success: false, name: f.name, error: String(err) };
  }
}

let pLimit = require('p-limit');
if (pLimit && pLimit.default) pLimit = pLimit.default;

async function retryWithBackoff(fn, attempts = 3, baseDelay = 500) {
  let i = 0;
  while (i < attempts) {
    try {
      return await fn();
    } catch (e) {
      i++;
      if (i >= attempts) throw e;
      const delay = baseDelay * Math.pow(2, i - 1);
      console.log('Retrying after error:', e && e.message, 'delay', delay);
      await sleep(delay);
    }
  }
}

// run
(async () => {
  const limit = pLimit(3);
  const tasks = flags.map(f => limit(() => workerForFlag(f)));
  const results = await Promise.all(tasks.map(p => p.catch(e => ({ success: false, error: String(e) }))));
  
  // try to commit changes (only when explicitly allowed)
  try {
    if (WANT_DRY) {
      console.log('Dry-run: skipping git commit/push.');
    } else if (WANT_CI || WANT_PUSH) {
      // Run flag validation to ensure we have matching SVGs before committing
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
      // Commit only the fetched flag assets and their sidecar metadata in public/flags.
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
