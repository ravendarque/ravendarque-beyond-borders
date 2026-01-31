/**
 * Shared utility functions for flag processing scripts
 */

import { basename } from 'path';
import { loadOptionalDep } from './deps.js';
import { logger } from './logger.js';

/**
 * Sanitize a filename to be filesystem-safe
 * @param {string} name - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(name) {
  name = decodeURIComponent(name || 'flag.svg');
  name = basename(name);
  name = name.replace(/^File:/i, '');
  name = name.replace(/[<>:"/\\|?*]/g, '_');
  name = name.replace(/^[._\-\s]+/, '').replace(/[._\-\s]+$/, '');
  if (name.length > 120) name = name.slice(0, 120);
  if (!name.toLowerCase().endsWith('.svg')) name = name + '.svg';
  return name;
}

/**
 * Extract dominant colors from a PNG file by analyzing pixel data.
 * Returns colors in visual order (sampling from top to bottom).
 * @param {string} pngPath - Path to PNG file
 * @returns {Promise<string[]>} Array of hex color strings
 */
export async function extractColorsFromPng(pngPath) {
  const Sharp = await loadOptionalDep('sharp');
  if (!Sharp) {
    logger.warn('sharp not available, skipping PNG color extraction');
    return [];
  }

  try {
    // Read PNG and get raw pixel data
    const { data, info } = await Sharp(pngPath)
      .resize(200, null, { fit: 'inside' }) // Resize for faster processing
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    // Collect all unique colors from the entire image
    const colorCounts = new Map();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Skip only transparent pixels
        if (a < 50) continue;

        // Round to nearest 16 to group similar colors
        const rRound = Math.round(r / 16) * 16;
        const gRound = Math.round(g / 16) * 16;
        const bRound = Math.round(b / 16) * 16;
        const colorKey = `${rRound},${gRound},${bRound}`;

        colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
      }
    }

    // Sort colors by frequency and extract top colors
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .filter(([colorKey, count]) => count > width * height * 0.01) // Must appear in at least 1% of image
      .slice(0, 12); // Take top 12 colors

    // Convert to hex and deduplicate similar colors
    const uniqueColors = [];
    for (const [colorKey, count] of sortedColors) {
      const [r, g, b] = colorKey.split(',').map(Number);
      const hex =
        '#' +
        [r, g, b].map((x) => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');

      // Check if this color is too similar to an existing color
      const isSimilar = uniqueColors.some((existing) => {
        const er = parseInt(existing.slice(1, 3), 16);
        const eg = parseInt(existing.slice(3, 5), 16);
        const eb = parseInt(existing.slice(5, 7), 16);
        const distance = Math.sqrt((r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2);
        return distance < 40; // Colors closer than 40 in RGB space are considered similar
      });

      if (!isSimilar) {
        uniqueColors.push(hex);
      }
    }

    return uniqueColors.slice(0, 8);
  } catch (e) {
    logger.warn('Failed to extract colors from PNG:', e.message);
    return [];
  }
}

/**
 * Extract colors from SVG text content
 * @param {string} svgText - SVG file content as string
 * @returns {string[]} Array of hex color strings
 */
export function extractColorsFromSvgText(svgText) {
  const colors = [];
  const seen = new Set();

  function pushColor(c) {
    if (!c) return;
    const n = c.toLowerCase();
    if (seen.has(n)) return;
    seen.add(n);
    colors.push(n);
  }

  // Check for elements that may use default fill (black)
  // Look for rect/path/circle/polygon elements without explicit fill that appear to be structural
  const hasImplicitBlack = /<(?:rect|path|circle|polygon|ellipse)[^>]*(?!fill\s*=)[^>]*>/i.test(
    svgText,
  );

  const hexRe = /#([0-9a-fA-F]{3,8})/g;
  let m;
  while ((m = hexRe.exec(svgText)) !== null) {
    const raw = m[1];
    let h = '#' + raw.toLowerCase();
    if (raw.length === 3)
      h =
        '#' +
        raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
          .toLowerCase();
    if (h.length === 9) h = h.slice(0, 7);
    pushColor(h);
  }

  const rgbRe = /rgb\s*\(([^\)]+)\)/gi;
  while ((m = rgbRe.exec(svgText)) !== null) {
    const parts = m[1].split(',').map((s) => s.trim());
    if (parts.length >= 3) {
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
        pushColor(hex);
      }
    }
  }

  const nameRe = /(?:fill|stop-color)\s*[:=]\s*['"]?([a-zA-Z]+)['"]?/g;
  while ((m = nameRe.exec(svgText)) !== null) {
    const namedColor = m[1].toLowerCase();
    // Convert common named colors to hex
    const namedToHex = {
      white: '#ffffff',
      black: '#000000',
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffff00',
      cyan: '#00ffff',
      magenta: '#ff00ff',
    };
    pushColor(namedToHex[namedColor] || namedColor);
  }

  // If we found elements without fill and no explicit black was declared, add it
  if (hasImplicitBlack && !seen.has('#000000') && !seen.has('black')) {
    pushColor('#000000');
  }

  return colors.slice(0, 8);
}
