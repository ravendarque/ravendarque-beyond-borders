// archived: original extract-svg-stripes.cjs
const fs = require('fs');
const path = require('path');

function normalizeColor(c){
  if (!c) return null;
  c = c.trim();
  const urlMatch = c.match(/^url\((?:['"])?#([^)'"\s]+)(?:['"])?\)$/);
  if (urlMatch) return { type: 'url', id: urlMatch[1] };
  const rgb = c.match(/^rgb\s*\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (rgb) return ('#'+[rgb[1],rgb[2],rgb[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('')).toUpperCase();
  const rgba = c.match(/^rgba\s*\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)$/i);
  if (rgba) return ('#'+[rgba[1],rgba[2],rgba[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('')).toUpperCase();
  const hex = c.match(/^#([0-9a-f]{3,8})$/i);
  if (hex){
    let h = hex[1];
    if (h.length === 3) h = h.split('').map(x=>x+x).join('');
    return ('#'+h.slice(0,6)).toUpperCase();
  }
  return c;
}

function extractGradientStops(svgText){
  const grads = {};
  const lgRe = /<linearGradient\b([\s\S]*?)>([\s\S]*?)<\/linearGradient>/gi;
  let m;
  while ((m = lgRe.exec(svgText)) !== null){
    const attrText = m[1];
    const body = m[2];
    const idMatch = attrText.match(/id\s*=\s*['\"]([^'\"]+)['\"]/i);
    const id = idMatch ? idMatch[1] : null;
    if (!id) continue;
    const stops = [];
    const stopRe = /<stop\b([^>]*)\/?\>/gi;
    let s;
    while ((s = stopRe.exec(body)) !== null){
      const a = s[1];
      const colorMatch = a.match(/stop-color\s*=\s*['\"]([^'\"]+)['\"]/i);
      const styleMatch = a.match(/style\s*=\s*['\"]([^'\"]+)['\"]/i);
      let col = null;
      if (colorMatch) col = colorMatch[1];
      else if (styleMatch){
        const sm = styleMatch[1].match(/stop-color\s*:\s*([^;]+)/i);
        if (sm) col = sm[1];
      }
      if (col) stops.push(normalizeColor(col));
    }
    grads[id] = stops;
  }
  return grads;
}

const files = fs.readdirSync(path.join(__dirname, '..', 'assets', 'flags')).filter(f=>f.toLowerCase().endsWith('.svg'));
const result = {};
for (const file of files){
  const p = path.join(__dirname, '..', 'assets', 'flags', file);
  let text = '';
  try { text = fs.readFileSync(p, 'utf8'); } catch(e){ console.error('ERR', file, e.message); continue; }
  const grads = extractGradientStops(text);
  const elemRe = /<(rect|path|polygon|circle|ellipse|g|use)\b([^>]*)>/gi;
  let m;
  const colors = [];
  while ((m = elemRe.exec(text)) !== null){
    const tag = m[1];
    const attrs = m[2];
    let fillMatch = attrs.match(/fill\s*=\s*['\"]([^'\"]+)['\"]/i);
    let fill = fillMatch ? fillMatch[1] : null;
    if (!fill){
      const styleMatch = attrs.match(/style\s*=\s*['\"]([^'\"]+)['\"]/i);
      if (styleMatch){
        const sm = styleMatch[1].match(/fill\s*:\s*([^;]+)/i);
        if (sm) fill = sm[1];
      }
    }
    if (!fill) continue;
    const norm = normalizeColor(fill);
    if (!norm) continue;
    if (typeof norm === 'object' && norm.type === 'url'){
      const stops = grads[norm.id];
      if (stops && stops.length) colors.push(stops[0]);
      else colors.push(norm);
    } else {
      colors.push(norm);
    }
  }
  const dedup = [];
  for (const c of colors){
    if (!c) continue;
    if (typeof c === 'object') continue;
    if (dedup.length === 0 || dedup[dedup.length-1] !== c) dedup.push(c);
  }
  result[path.basename(file, '.svg')] = dedup;
}
fs.writeFileSync(path.join(__dirname, '..', 'outputs', 'flag-stripe-order.json'), JSON.stringify(result, null, 2), 'utf8');
console.log('Wrote', path.join(__dirname, '..', 'outputs', 'flag-stripe-order.json'));
