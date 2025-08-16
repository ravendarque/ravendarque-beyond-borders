#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const path = require('path');
const child_process = require('child_process');

const dataYamlPath = path.resolve(__dirname, '..', 'data', 'flag-data.yaml');
if (!fs.existsSync(dataYamlPath)) {
  console.error('data/flag-data.yaml not found. Please add it.');
  process.exit(1);
}
const yamlText = fs.readFileSync(dataYamlPath, 'utf8');

// crude YAML parser for our well-formed input
function parseFlagsFromYaml(yaml) {
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

function sanitizeFilename(name) {
  name = decodeURIComponent(name || 'flag.svg');
  name = name.replace(/^File:/i, '');
  name = name.replace(/[<>:\\"/\\|?*]/g, '_');
  name = name.replace(/^[._\-\s]+/, '').replace(/[._\-\s]+$/, '');
  if (!name.toLowerCase().endsWith('.svg')) name = name + '.svg';
  return name;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
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

function extractColorsFromSvgText(svgText) {
  const colors = [];
  // find hex colors
  const hexRe = /#([0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = hexRe.exec(svgText)) !== null) {
    const h = '#' + m[1].toLowerCase();
    if (!colors.includes(h)) colors.push(h);
  }
  // find rgb(...) occurrences
  const rgbRe = /rgb\([^\)]+\)/g;
  while ((m = rgbRe.exec(svgText)) !== null) {
    const v = m[0];
    if (!colors.includes(v)) colors.push(v);
  }
  // find named colors in fill="name"
  const fillRe = /fill:\s*([^;\"']+)/g;
  while ((m = fillRe.exec(svgText)) !== null) {
    const v = m[1].trim();
    if (!colors.includes(v)) colors.push(v);
  }
  return colors;
}

(async () => {
  const results = [];
  for (const f of flags) {
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
      const filename = sanitizeFilename(parsed.pathname.split('/').pop() || parsed.pathname.split('/').slice(-2).join('_'));
  // Throttle a bit between media downloads to avoid triggering rate limits
  await sleep(400);
  const bytes = await fetchUrl(mediaUrl);
      const dst = path.join(outDir, filename);
      fs.writeFileSync(dst, bytes);

      // attempt to extract colors by reading bytes as utf8 (many svg files are text)
      let svgText = null;
      try { svgText = bytes.toString('utf8'); } catch (e) { svgText = null; }
      const colors = svgText ? extractColorsFromSvgText(svgText) : [];
      const metadata = {
        name: f.name,
        filename,
        source_page: f.svg_url,
        media_url: mediaUrl,
        size: bytes.length,
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
      console.log('Wrote', dst, bytes.length, 'and', metaDst);
      results.push(metadata);
    } catch (err) {
      console.error('Failed for', f.name, err && err.message);
      results.push({ name: f.name, error: String(err) });
    }
  }
  // write aggregate metadata
  const outAggregate = path.resolve(__dirname, '..', 'data', 'flag-metadata.json');
  fs.writeFileSync(outAggregate, JSON.stringify(results, null, 2));
  console.log('Wrote', outAggregate);

  // try to commit changes (if running in CI with write access)
  try {
    child_process.execSync('git config user.email "actions@github.com"');
    child_process.execSync('git config user.name "github-actions[bot]"');
    child_process.execSync('git add public/flags');
    child_process.execSync('git add data/flag-metadata.json');
    child_process.execSync('git commit -m "chore: update flags and metadata (automated)"', { stdio: 'inherit' });
    child_process.execSync('git push');
    console.log('Committed and pushed changes.');
  } catch (e) {
    console.log('Commit/push skipped or failed (likely local run):', e && e.message);
  }
})();
