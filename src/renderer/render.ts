import type { FlagSpec } from '../flags/schema';

export interface RenderOptions {
  size: 512 | 1024;
  thicknessPct: number; // 5..20
  paddingPct?: number;
  outerStroke?: { color: string; widthPx: number };
  imageInsetPx?: number; // inset between image edge and inner ring
  imageOffsetPx?: { x: number; y: number }; // offset to apply to image center (pixels)
  borderImageBitmap?: ImageBitmap | undefined; // optional image to use for border rendering (SVG bitmap)
  backgroundColor?: string | null; // null => transparent
}

export async function renderAvatar(
  image: ImageBitmap,
  flag: FlagSpec,
  options: RenderOptions,
): Promise<Blob> {
  const size = options.size;
  const canvasW = size;
  const canvasH = size;

  // Compute px metrics based on size to keep thickness consistent
  const base = Math.min(canvasW, canvasH);
  const thickness = Math.round((options.thicknessPct / 100) * base);
  const padding = Math.round(((options.paddingPct ?? 0) / 100) * base);

  // Create canvas
  const canvas = new OffscreenCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d')!;

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

  // Draw circular masked image (kept inside border)
  ctx.save();
  ctx.beginPath();
  // Apply optional image offset to center when drawing the image
  const offsetX = options.imageOffsetPx?.x ?? 0;
  const offsetY = options.imageOffsetPx?.y ?? 0;
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
  // Center in canvas (apply offset)
  const cx = canvasW / 2 + offsetX,
    cy = canvasH / 2 + offsetY;
  ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();

  // Draw ring segments for the flag
  const stripes = flag.pattern.stripes;
  const totalWeight = stripes.reduce((s: number, x: { weight: number }) => s + x.weight, 0);
  // Decide border style: use recommended.borderStyle if present, else infer from stripe orientation
  const borderStyle = (flag as any).recommended?.borderStyle as string | undefined
    ?? (flag.pattern.orientation === 'horizontal' ? 'concentric' : 'angular');
  // If a border image bitmap is provided, prefer rendering it wrapped around the annulus.
  if (options.borderImageBitmap) {
    drawTexturedAnnulus(ctx, r, ringInner, ringOuter, options.borderImageBitmap);
  } else if (borderStyle === 'concentric' || flag.pattern.orientation === 'horizontal') {
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

  // Optional outer stroke
  if (options.outerStroke) {
    ctx.beginPath();
    ctx.arc(canvasW / 2, canvasH / 2, ringOuter, 0, Math.PI * 2);
    ctx.strokeStyle = options.outerStroke.color;
    ctx.lineWidth = options.outerStroke.widthPx;
    ctx.stroke();
  }

  // Export PNG
  const blob = await canvas.convertToBlob({ type: 'image/png' });
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
) {
  const thickness = outerR - innerR;
  if (thickness <= 0) return;

  const midR = (innerR + outerR) / 2;
  const circumference = 2 * Math.PI * midR;

  // Create texture canvas sized to circumference x thickness
  const texW = Math.max(1, Math.round(circumference));
  const texH = Math.max(1, Math.round(thickness));
  const tex = new OffscreenCanvas(texW, texH);
  const tctx = tex.getContext('2d')!;

  // Draw the source bitmap into the texture canvas using 'cover' semantics
  const bw = bitmap.width;
  const bh = bitmap.height;
  const scale = Math.max(texW / bw, texH / bh);
  const dw = Math.round(bw * scale);
  const dh = Math.round(bh * scale);
  // center the scaled image horizontally
  const dx = Math.round((texW - dw) / 2);
  const dy = Math.round((texH - dh) / 2);
  tctx.clearRect(0, 0, texW, texH);
  tctx.drawImage(bitmap, 0, 0, bw, bh, dx, dy, dw, dh);

  // Clip to annulus on the destination
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, outerR, 0, Math.PI * 2);
  ctx.arc(center, center, innerR, Math.PI * 2, 0, true);
  ctx.closePath();
  ctx.clip();

  // Paint by slicing the texture and drawing thin tangential rectangles
  const sliceW = 2; // source slice width in texture-space pixels (small => smoother wrap)
  const arcPerPixel = circumference / texW; // tangential length per texture pixel

  // Translate to center to simplify rotations
  ctx.translate(center, center);

  for (let sx = 0; sx < texW; sx += sliceW) {
    const curSliceW = Math.min(sliceW, texW - sx);
    const angle = (sx / texW) * Math.PI * 2; // angle position for this slice
    const arcLen = curSliceW * arcPerPixel;

    ctx.save();
    ctx.rotate(angle);
    // drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh)
    // Destination rectangle: positioned at x=innerR, y=-thickness/2, width=arcLen, height=thickness
    ctx.drawImage(tex, sx, 0, curSliceW, texH, innerR, -thickness / 2, arcLen, thickness);
    ctx.restore();
  }

  // restore transform + clipping
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.restore();
}
