/**
 * Image processing utilities
 * Handles SVG to PNG conversion and PNG analysis
 */

import { loadOptionalDep } from './deps.js';
import { logger } from './logger.js';

let Sharp = null;
let Resvg = null;

/**
 * Initialize image processing dependencies
 * @returns {Promise<{Sharp: any, Resvg: any}>}
 */
async function initDeps() {
  if (Sharp === null) {
    Sharp = await loadOptionalDep('sharp');
  }
  if (Resvg === null) {
    const resvgModule = await loadOptionalDep('@resvg/resvg-js');
    Resvg = resvgModule?.Resvg || null;
  }
  return { Sharp, Resvg };
}

/**
 * Render SVG to PNG using resvg and sharp
 * @param {string} svgText - SVG content as string
 * @param {string} dstPath - Destination PNG path
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} mode - Resize mode: 'slice' (cover) or 'contain' (default: 'slice')
 * @returns {Promise<boolean>} - Success
 */
export async function renderSvgWithResvgSharp(svgText, dstPath, width, height, mode = 'slice') {
  const { Sharp: SharpModule } = await initDeps();
  if (!SharpModule) {
    throw new Error('sharp not available');
  }
  
  let srcPngBuf = null;
  try {
    const { Resvg: ResvgModule } = await initDeps();
    if (ResvgModule) {
      try {
        const inst = new ResvgModule(svgText);
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
      await SharpModule(srcPngBuf).resize(width, height, { fit, position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(dstPath);
    } else {
      await SharpModule(Buffer.from(svgText)).resize(width, height, { fit, position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(dstPath);
    }
    return true;
  } catch (e) {
    throw e;
  }
}

/**
 * Analyze PNG canvas usage
 * @param {string} pngPath - Path to PNG file
 * @returns {Promise<{pctW: number, pctH: number, usedW: number|null, usedH: number|null}>} - Usage stats
 */
export async function analyzePngUsage(pngPath) {
  const { Sharp: SharpModule } = await initDeps();
  if (!SharpModule) {
    return { pctW: 1, pctH: 1, usedW: null, usedH: null };
  }
  
  try {
    const { data, info } = await SharpModule(pngPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const bytes = data;
    let minX = w, minY = h, maxX = 0, maxY = 0, any = false;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * info.channels;
        const a = bytes[i + (info.channels - 1)];
        const r = bytes[i];
        const g = bytes[i + 1];
        const b = bytes[i + 2];
        // Skip transparent or near-white pixels
        if (a > 8 && !(r > 240 && g > 240 && b > 240)) {
          any = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (!any) {
      return { pctW: 0, pctH: 0, usedW: 0, usedH: 0 };
    }
    
    const usedW = maxX - minX + 1;
    const usedH = maxY - minY + 1;
    return { pctW: usedW / w, pctH: usedH / h, usedW, usedH };
  } catch (e) {
    logger.warn('Failed to analyze PNG usage:', e.message);
    return { pctW: 1, pctH: 1, usedW: null, usedH: null };
  }
}
