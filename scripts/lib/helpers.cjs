const path = require('path');
const fs = require('fs');

function sanitizeFilename(name) {
  name = decodeURIComponent(name || 'flag.svg');
  name = path.basename(name);
  name = name.replace(/^File:/i, '');
  name = name.replace(/[<>:\"/\\|?*]/g, '_');
  name = name.replace(/^[._\-\s]+/, '').replace(/[._\-\s]+$/, '');
  if (name.length > 120) name = name.slice(0, 120);
  if (!name.toLowerCase().endsWith('.svg')) name = name + '.svg';
  return name;
}

function extractColorsFromSvgText(svgText) {
  const colors = [];
  const seen = new Set();
  function pushColor(c) {
    if (!c) return;
    const n = c.toLowerCase();
    if (seen.has(n)) return;
    seen.add(n);
    colors.push(n);
  }
  const hexRe = /#([0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = hexRe.exec(svgText)) !== null) {
    const raw = m[1];
    let h = '#' + raw.toLowerCase();
    if (raw.length === 3) h = '#' + raw.split('').map(ch => ch + ch).join('').toLowerCase();
    if (h.length === 9) h = h.slice(0, 7);
    pushColor(h);
  }
  const rgbRe = /rgb\s*\(([^\)]+)\)/gi;
  while ((m = rgbRe.exec(svgText)) !== null) {
    const parts = m[1].split(',').map(s => s.trim());
    if (parts.length >= 3) {
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        pushColor(hex);
      }
    }
  }
  const nameRe = /(?:fill|stop-color)\s*[:=]\s*['\"]?([a-zA-Z]+)['\"]?/g;
  while ((m = nameRe.exec(svgText)) !== null) {
    pushColor(m[1].toLowerCase());
  }
  return colors.slice(0, 8);
}

module.exports = { sanitizeFilename, extractColorsFromSvgText };
