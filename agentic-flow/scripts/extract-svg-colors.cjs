const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'flags');
const outDir = path.join(__dirname, '..', 'outputs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'flag-colors.json');

function rgbToHex(r,g,b){
  return '#'+[r,g,b].map(n=>{const v=Number(n); return v.toString(16).padStart(2,'0');}).join('').toUpperCase();
}

function normalizeHex(h){
  h = h.replace('#','');
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  if (h.length === 4) { // ARGB? drop alpha
    h = h.slice(1); // naive
  }
  if (h.length === 6) return '#'+h.toUpperCase();
  if (h.length === 8) return '#'+h.slice(0,6).toUpperCase();
  return '#'+h.toUpperCase();
}

const files = fs.readdirSync(dir).filter(f=>f.toLowerCase().endsWith('.svg'));
const result = {};

for (const file of files){
  const p = path.join(dir, file);
  let text = '';
  try { text = fs.readFileSync(p, 'utf8'); } catch(e){ console.error('ERR', file, e.message); continue; }
  const counts = Object.create(null);
  // hex colors
  const hexRe = /#([0-9a-fA-F]{3,8})\b/g;
  let m;
  while ((m = hexRe.exec(text)) !== null){
    const h = normalizeHex('#'+m[1]);
    counts[h] = (counts[h]||0)+1;
  }
  // rgb()
  const rgbRe = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g;
  while ((m = rgbRe.exec(text)) !== null){
    const h = rgbToHex(m[1], m[2], m[3]);
    counts[h] = (counts[h]||0)+1;
  }
  // rgba()
  const rgbaRe = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.\d+|[01])\s*\)/g;
  while ((m = rgbaRe.exec(text)) !== null){
    const hex = rgbToHex(m[1], m[2], m[3]);
    counts[hex] = (counts[hex]||0)+1;
  }
  
  const arr = Object.keys(counts).map(k=>({color:k,count:counts[k]}));
  arr.sort((a,b)=>b.count-a.count);
  const top = arr.slice(0,6).map(x=>x.color);
  const key = path.basename(file, '.svg');
  result[key] = { file, colors: top, all: arr };
}

fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');
console.log('Wrote', outFile);
