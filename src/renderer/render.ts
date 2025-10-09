import type { FlagSpec } from '../flags/schema';
import { createCanvas, canvasToBlob, clamp as utilClamp } from './canvas-utils';
import { validateFlagPattern } from './flag-validation';

export interface RenderOptions {
  size: 512 | 1024;
  thicknessPct: number; // 5..20
  paddingPct?: number;
  outerStroke?: { color: string; widthPx: number };
  imageInsetPx?: number; // inset between image edge and inner ring
  imageOffsetPx?: { x: number; y: number }; // offset to apply to image center (pixels)
  borderImageBitmap?: ImageBitmap | undefined; // optional image to use for border rendering (SVG bitmap)
  presentation?: 'ring' | 'segment' | 'cutout';
  backgroundColor?: string | null; // null => transparent
}

export async function renderAvatar(
  image: ImageBitmap,
  flag: FlagSpec,
  options: RenderOptions,
): Promise<Blob> {
  // Validate flag pattern before rendering
  validateFlagPattern(flag);
  
  const size = options.size;
  const canvasW = size;
  const canvasH = size;

  // Compute px metrics based on size to keep thickness consistent
  const base = Math.min(canvasW, canvasH);
  const thickness = Math.round((options.thicknessPct / 100) * base);
  const padding = Math.round(((options.paddingPct ?? 0) / 100) * base);

  // Create canvas (with OffscreenCanvas fallback and size validation)
  const { canvas, ctx } = createCanvas(canvasW, canvasH);

  // Background fill (optional, else transparent)
  if (options.backgroundColor) {
    ctx.save();
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // Geometry (circle only)
  const r = Math.min(canvasW, canvasH) / 2;
  const ringOuter = r - Math.max(1, padding);
  const ringInner = Math.max(0, ringOuter - thickness);
  const imageInset = options.imageInsetPx ?? 0; // can be negative (outset)
  const imageRadius = clamp(ringInner - imageInset, 0, r - 0.5);

  // Decide border style early to handle cutout differently
  // Pattern is guaranteed to exist due to validateFlagPattern above
  const stripes = flag.pattern!.stripes;
  const totalWeight = stripes.reduce((s: number, x: { weight: number }) => s + x.weight, 0);
  const presentation = options.presentation as 'ring' | 'segment' | 'cutout' | undefined;
  let borderStyle: 'concentric' | 'angular' | 'cutout';
  if (presentation === 'ring') borderStyle = 'concentric';
  else if (presentation === 'segment') borderStyle = 'angular';
  else if (presentation === 'cutout') borderStyle = 'cutout';
  else borderStyle = flag.pattern!.orientation === 'horizontal' ? 'concentric' : 'angular';

  /**
   * CUTOUT MODE: Special rendering where the user's image is centered
   * and the flag pattern appears only in the border/ring area
   */
  if (borderStyle === 'cutout') {
    // Step 1: Draw the user's image in the center circle (respecting inset)
    // Image is always centered in cutout mode (imageOffsetPx is used for flag offset instead)
    ctx.save();
    ctx.beginPath();
    // Clip to the inner circle area (where the image should appear)
    ctx.arc(r, r, imageRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    const iw = image.width;
    const ih = image.height;
    // Scale image to fit the inner circle (respecting inset)
    const target = imageRadius * 2;
    const scale = Math.max(target / iw, target / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const cx = canvasW / 2; // Always centered
    const cy = canvasH / 2; // Always centered
    
    ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();

    // Step 2: Create a flag texture for the ring area
    // Use imageOffsetPx for flag pattern shifting (in cutout mode only)
    const flagOffsetX = options.imageOffsetPx?.x ?? 0;
    const extraWidth = Math.abs(flagOffsetX) * 3; // Extra space for shifting
    const flagCanvas = new OffscreenCanvas(canvasW + extraWidth, canvasH);
    const flagCtx = flagCanvas.getContext('2d')!;
    
    // If a border image (PNG) is provided, use it for accurate flag rendering
    if (options.borderImageBitmap) {
      // Draw the flag PNG image scaled to fit the canvas
      const bw = options.borderImageBitmap.width;
      const bh = options.borderImageBitmap.height;
      const scale = Math.max(flagCanvas.width / bw, flagCanvas.height / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      // Center the flag and apply horizontal offset
      const dx = (flagCanvas.width - dw) / 2 - flagOffsetX;
      const dy = (flagCanvas.height - dh) / 2;
      flagCtx.drawImage(options.borderImageBitmap, dx, dy, dw, dh);
    } else {
      // Draw stripes from pattern data
      // Pattern is guaranteed to exist due to validateFlagPattern above
      if (flag.pattern!.orientation === 'horizontal') {
        // Horizontal stripes - draw across full width
        let y = 0;
        for (const stripe of stripes) {
          const frac = stripe.weight / totalWeight;
          const h = frac * canvasH;
          flagCtx.fillStyle = stripe.color;
          flagCtx.fillRect(0, y, flagCanvas.width, h);
          y += h;
        }
      } else {
        // Vertical stripes - shift the pattern horizontally
        // Start position adjusted by flag offset
        let x = extraWidth / 2 - flagOffsetX; // Negative because we want to shift content, not canvas
        for (const stripe of stripes) {
          const frac = stripe.weight / totalWeight;
          const w = frac * canvasW;
          flagCtx.fillStyle = stripe.color;
          flagCtx.fillRect(x, 0, w, canvasH);
          x += w;
        }
      }
    }
    
    // Clip the flag to only the ring area (annulus)
    flagCtx.globalCompositeOperation = 'destination-in';
    flagCtx.fillStyle = 'white'; // Color doesn't matter, only alpha
    flagCtx.beginPath();
    flagCtx.arc(r + extraWidth / 2, r, ringOuter, 0, Math.PI * 2);
    flagCtx.arc(r + extraWidth / 2, r, ringInner, Math.PI * 2, 0, true); // Cut out the inner circle
    flagCtx.fill();
    
    // Step 3: Draw the flag ring on top of the image
    // Offset the drawing position to account for the extra canvas width
    ctx.drawImage(flagCanvas, -extraWidth / 2, 0);

    // Cutout mode complete - skip normal border rendering below
  } else {
    /**
     * NORMAL MODE (Ring/Segment): Draw user's image in center,
     * then add flag-colored border around it
     * Note: imageOffsetPx is NOT used in ring/segment modes - it's only for flag offset in cutout mode
     */

  // Draw circular masked image (kept inside border)
  ctx.save();
  ctx.beginPath();
  // Image is always centered in ring/segment modes (no offset)
  ctx.arc(r + 0, r + 0, imageRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Fit image into the inner circle (cover)
  const iw = image.width,
    ih = image.height;
  const target = imageRadius * 2;
  const scale = Math.max(target / iw, target / ih);
  const dw = iw * scale,
    dh = ih * scale;
  // Center in canvas (no offset in ring/segment modes)
  const cx = canvasW / 2,
    cy = canvasH / 2;
  ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();

  // Draw ring segments for the flag
  // Decide border style: take explicit presentation if provided, else fall back to recommended or stripe orientation
  // If a border image bitmap is provided, prefer rendering it wrapped around the annulus.
  // (Not used for cutout mode which has its own rendering path above)
  if (options.borderImageBitmap && presentation !== 'cutout') {
    // If the caller provided an SVG (or any) bitmap, generate a texture mapped to the ring
    const thickness = Math.max(1, Math.round(ringOuter - ringInner));
    const midR = (ringInner + ringOuter) / 2;
    const circumference = Math.max(2, Math.round(2 * Math.PI * midR));
    const texW = circumference;
    const texH = thickness;
    try {
      const tex = new OffscreenCanvas(texW, texH);
      const tctx = tex.getContext('2d')!;
      // draw the provided bitmap into the texture using cover semantics
      const bw = options.borderImageBitmap.width;
      const bh = options.borderImageBitmap.height;
      const scale = Math.max(texW / bw, texH / bh);
      const dw = Math.round(bw * scale);
      const dh = Math.round(bh * scale);
      const dx = Math.round((texW - dw) / 2);
      const dy = Math.round((texH - dh) / 2);
      tctx.clearRect(0, 0, texW, texH);
      tctx.drawImage(options.borderImageBitmap, 0, 0, bw, bh, dx, dy, dw, dh);
      const bmpTex = await createImageBitmap(tex);
      // Map left-edge -> top of ring
      const startAngle = -Math.PI / 2;
      drawTexturedAnnulus(ctx, r, ringInner, ringOuter, bmpTex, startAngle, 'normal');
    } catch {
      // fallback: draw it directly (older behavior)
      try {
        drawTexturedAnnulus(ctx, r, ringInner, ringOuter, options.borderImageBitmap);
      } catch {
        // last resort: semi-transparent concentric rings
        ctx.save();
        ctx.globalAlpha = 0.64;
        drawConcentricRings(ctx, r, ringInner, ringOuter, stripes, totalWeight);
        ctx.restore();
      }
    }
  } else if (borderStyle === 'concentric') {
    // Map horizontal stripes to concentric annuli from outer->inner to preserve stripe order (top => outer)
    drawConcentricRings(ctx, r, ringInner, ringOuter, stripes, totalWeight);
  } else {
    // default: angular arcs (vertical stripes map naturally around circumference)
    let start = -Math.PI / 2; // start at top center
    for (const stripe of stripes) {
      const frac = stripe.weight / totalWeight;
      const sweep = Math.PI * 2 * frac;
      const end = start + sweep;
      drawRingArc(ctx, r, ringInner, ringOuter, start, end, stripe.color);
      start = end;
    }
  }
  } // Close the else block for non-cutout mode

  // Optional outer stroke
  if (options.outerStroke) {
    ctx.beginPath();
    ctx.arc(canvasW / 2, canvasH / 2, ringOuter, 0, Math.PI * 2);
    ctx.strokeStyle = options.outerStroke.color;
    ctx.lineWidth = options.outerStroke.widthPx;
    ctx.stroke();
  }

  // Export PNG (using canvasToBlob with fallback support)
  const blob = await canvasToBlob(canvas, 'image/png');
  return blob;
}

function drawConcentricRings(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  center: number,
  innerR: number,
  outerR: number,
  stripes: { color: string; weight: number }[],
  totalWeight: number,
) {
  // Compute thickness in px
  const thickness = outerR - innerR;
  // Use floating calculation to avoid rounding errors
  let remainingOuter = outerR;
  // For each stripe (assume stripes ordered top->bottom), draw annulus from outer inward
  for (const stripe of stripes) {
    const frac = stripe.weight / totalWeight;
    const band = frac * thickness;
    const bandInner = Math.max(innerR, remainingOuter - band);
    // draw annulus between bandInner and remainingOuter
    ctx.beginPath();
    ctx.arc(center, center, remainingOuter, 0, Math.PI * 2);
    ctx.arc(center, center, bandInner, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = stripe.color;
    ctx.fill();
    remainingOuter = bandInner;
    if (remainingOuter <= innerR + 0.5) break; // nothing left
  }
  // If rounding left a gap, fill inner-most with last stripe color
  if (remainingOuter > innerR + 0.5) {
    ctx.beginPath();
    ctx.arc(center, center, remainingOuter, 0, Math.PI * 2);
    ctx.arc(center, center, innerR, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000000';
    ctx.fill();
  }
}

function drawRingArc(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  center: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  fill: string,
) {
  ctx.beginPath();
  // Outer arc
  ctx.arc(center, center, outerR, startAngle, endAngle);
  // Inner arc (reverse)
  ctx.arc(center, center, innerR, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Build a stripe texture canvas for wrapping. Returns an OffscreenCanvas.
 * orientation is 'horizontal' or 'vertical'. For wrapping we always render horizontally
 * across the width (circumference) and use height as thickness.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createStripeTexture(stripes: { color: string; weight: number }[], orientation: string, w: number, h: number) {
  const canvas = new OffscreenCanvas(Math.max(1, w), Math.max(1, h));
  const ctx = canvas.getContext('2d')!;
  // Normalize weights
  const total = stripes.reduce((s, x) => s + x.weight, 0);
  let x = 0;
  for (const s of stripes) {
    const frac = s.weight / total;
    const wpx = Math.max(1, Math.round(frac * w));
    ctx.fillStyle = s.color;
    ctx.fillRect(x, 0, wpx, h);
    x += wpx;
  }
  // fill any remaining pixel due to rounding
  if (x < w) {
    ctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000';
    ctx.fillRect(x, 0, w - x, h);
  }
  return canvas;
}

/**
 * Draw a textured annulus by wrapping a provided bitmap around the ring.
 * This uses a simple slice-based approximation: the bitmap is drawn to a
 * temporary rectangular canvas whose width matches the ring circumference
 * and whose height matches the ring thickness; that texture is then
 * painted in thin tangential slices into the annulus while an annulus clip
 * keeps the result clean.
 */
function drawTexturedAnnulus(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  center: number,
  innerR: number,
  outerR: number,
  bitmap: ImageBitmap,
  startAngle = 0,
  mode: 'normal' | 'erase' = 'normal',
) {
  const thickness = outerR - innerR;
  if (thickness <= 0) return;

  // Prepare a texture canvas sized to the ring's circumference x thickness
  const midR = (innerR + outerR) / 2;
  const circumference = Math.max(1, Math.round(2 * Math.PI * midR));
  const texW = Math.max(1, circumference);
  const texH = Math.max(1, Math.round(thickness));

  // Render the source bitmap into a texture canvas using cover semantics
  const tex = new OffscreenCanvas(texW, texH);
  const texCtx = tex.getContext('2d')!;
  const bw = bitmap.width;
  const bh = bitmap.height;
  const scale = Math.max(texW / bw, texH / bh);
  const dw = Math.round(bw * scale);
  const dh = Math.round(bh * scale);
  const dx = Math.round((texW - dw) / 2);
  const dy = Math.round((texH - dh) / 2);
  texCtx.clearRect(0, 0, texW, texH);
  texCtx.drawImage(bitmap, 0, 0, bw, bh, dx, dy, dw, dh);

  // Read texture pixels for direct sampling
  const srcData = texCtx.getImageData(0, 0, texW, texH);
  const srcBuf = srcData.data;

  // Destination bounding box (tight around the outer circle)
  const minX = Math.floor(center - outerR);
  const minY = Math.floor(center - outerR);
  const destW = Math.ceil(outerR * 2);
  const destH = destW;

  // Create a temporary destination canvas to populate the annulus pixels precisely
  const dest = new OffscreenCanvas(destW, destH);
  const destCtx = dest.getContext('2d')!;
  const destImage = destCtx.createImageData(destW, destH);
  const dstBuf = destImage.data;

  // Precompute values
  const twoPI = Math.PI * 2;
  const invTwoPI = 1 / twoPI;

  for (let y = 0; y < destH; y++) {
    const absY = minY + y + 0.5; // sample at pixel center
    const dyc = absY - center;
    for (let x = 0; x < destW; x++) {
      const absX = minX + x + 0.5;
      const dxc = absX - center;
      const rr = dxc * dxc + dyc * dyc;
      const radius = Math.sqrt(rr);
      const dstIdx = (y * destW + x) * 4;
      if (radius < innerR || radius > outerR) {
        // leave transparent
        dstBuf[dstIdx + 0] = 0;
        dstBuf[dstIdx + 1] = 0;
        dstBuf[dstIdx + 2] = 0;
        dstBuf[dstIdx + 3] = 0;
        continue;
      }

      // Compute angular coordinate where 0 maps to +X axis; we want startAngle to map to texture x=0
      let angle = Math.atan2(dyc, dxc);
      // Normalize to [0, 2PI)
      angle -= startAngle;
      while (angle < 0) angle += twoPI;
      while (angle >= twoPI) angle -= twoPI;

      // Map to texture coordinates
      const u = (angle * invTwoPI) * texW; // horizontal position in texture
      const v = ((radius - innerR) / thickness) * texH; // vertical position in texture

      // Nearest-neighbour sample (fast and avoids weighted blending)
      const sx = Math.min(texW - 1, Math.max(0, Math.floor(u)));
      const sy = Math.min(texH - 1, Math.max(0, Math.floor(v)));
      const sIdx = (sy * texW + sx) * 4;
      dstBuf[dstIdx + 0] = srcBuf[sIdx + 0];
      dstBuf[dstIdx + 1] = srcBuf[sIdx + 1];
      dstBuf[dstIdx + 2] = srcBuf[sIdx + 2];
      dstBuf[dstIdx + 3] = srcBuf[sIdx + 3];
    }
  }

  // Put the sampled annulus onto the destination canvas and draw it into the main context
  destCtx.putImageData(destImage, 0, 0);

  if (mode === 'normal') {
    // Composite the annulus onto the target canvas at the proper position
    ctx.save();
    ctx.drawImage(dest, minX, minY);
    ctx.restore();
    return;
  }

  // Erase mode: where dest has alpha > 0, clear the corresponding pixels on the target canvas
  // We'll use an offscreen temporary to read the existing pixels and composite an erased result.
  const target = new OffscreenCanvas(destW, destH);
  const targetCtx = target.getContext('2d')!;
  // Draw the current canvas region into target
  targetCtx.clearRect(0, 0, destW, destH);
  targetCtx.drawImage(ctx.canvas, minX, minY, destW, destH, 0, 0, destW, destH);
  const targetData = targetCtx.getImageData(0, 0, destW, destH);
  const targetBuf = targetData.data;
  const maskData = destCtx.getImageData(0, 0, destW, destH).data;
  for (let i = 0; i < targetBuf.length; i += 4) {
    const alpha = maskData[i + 3];
    if (alpha > 8) {
      // erase (make transparent)
      targetBuf[i + 3] = 0;
    }
  }
  targetCtx.putImageData(targetData, 0, 0);
  // Draw the erased region back onto the main context
  ctx.save();
  ctx.drawImage(target, minX, minY);
  ctx.restore();
}
