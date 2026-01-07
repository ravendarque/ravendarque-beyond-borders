import type { FlagSpec } from '../flags/schema';
import { createCanvas, canvasToBlob } from './canvas-utils';
import {
  RenderPerformanceTracker,
  calculateDownsampleSize,
  downsampleImage,
  shouldDownsample,
  logRenderMetrics,
  type RenderMetrics,
} from './performance';

/**
 * Options for rendering an avatar with flag border
 */
export interface RenderOptions {
  /** Output size in pixels (512 or 1024) */
  size: 512 | 1024;
  
  /** Border thickness as percentage of canvas size (5-20) */
  thicknessPct: number;
  
  /** Padding around the outer edge as percentage of canvas size */
  paddingPct?: number;
  
  /** Optional stroke around the outer edge */
  outerStroke?: { color: string; widthPx: number };
  
  /** 
   * Offset to apply to the user's image center in ring/segment modes (pixels)
   * Note: Not used in cutout mode - use flagOffsetPct instead
   */
  imageOffsetPx?: { x: number; y: number };
  
  /**
   * Zoom level for the user's image (0-200, where 0 is no zoom, 100 is 2x, 200 is 3x)
   * Applied to the image scale after cover sizing
   */
  imageZoom?: number;
  
  /**
   * Offset to apply to flag pattern in cutout mode (percentage: -50 to +50)
   * Only applies when presentation is 'cutout'
   * -50%: left edge of border touches left edge of flag
   * 0%: center, no offset
   * +50%: right edge of border touches right edge of flag
   */
  flagOffsetPct?: { x: number; y: number };
  
  /** Optional pre-rendered flag image (PNG) for accurate flag rendering */
  borderImageBitmap?: ImageBitmap | undefined;
  
  /** Border presentation style */
  presentation?: 'ring' | 'segment' | 'cutout';
  
  /** Rotation angle for segment mode in degrees (0-360) */
  segmentRotation?: number;
  
  /** Background color (null or 'transparent' for transparent background) */
  backgroundColor?: string | null;
  
  /** Enable performance metrics logging (default: development mode only) */
  enablePerformanceTracking?: boolean;
  
  /** Enable automatic image downsampling for large images (default: true) */
  enableDownsampling?: boolean;
  
  /** Progress callback for loading indicators (0-1) */
  onProgress?: (progress: number) => void;
  
  /** 
   * PNG compression quality (0-1, higher = better quality but larger file)
   * Default: 0.92 (optimal balance between quality and file size)
   * Note: PNG compression is lossless, but this affects encoding time and size
   */
  pngQuality?: number;
}

/**
 * Result of rendering an avatar
 */
export interface RenderResult {
  /** The rendered avatar image as a Blob */
  blob: Blob;
  /** Actual file size in bytes */
  sizeBytes: number;
  /** Estimated file size in KB (formatted string) */
  sizeKB: string;
  /** Performance metrics (if tracking enabled) */
  metrics?: RenderMetrics;
}

/**
 * Renders an avatar with a flag-themed border
 * 
 * @param image - The user's image as an ImageBitmap
 * @param flag - Flag specification with colors, pattern, and metadata
 * @param options - Rendering options (size, style, offsets, etc.)
 * @returns A Promise that resolves to a Blob containing the rendered PNG image
 * 
 * @example
 * ```typescript
 * // Ring mode with flag border
 * const result = await renderAvatar(userImage, palestineFlag, {
 *   size: 1024,
 *   thicknessPct: 15,
 *   presentation: 'ring',
 *   backgroundColor: '#ffffff'
 * });
 * console.log(`File size: ${result.sizeKB} KB`); // e.g., "156.23 KB"
 * 
 * // Cutout mode with flag offset and custom compression
 * const result = await renderAvatar(userImage, kurdistanFlag, {
 *   size: 1024,
 *   thicknessPct: 20,
 *   presentation: 'cutout',
 *   flagOffsetPct: { x: 50, y: 0 }, // Shift flag pattern (percentage: -50 to +50)
 *   borderImageBitmap: flagPNG,
 *   pngQuality: 0.85 // Lower quality for smaller file size
 * });
 * ```
 */
export async function renderAvatar(
  image: ImageBitmap,
  flag: FlagSpec,
  options: RenderOptions,
): Promise<RenderResult> {
  // Performance tracking
  const tracker = new RenderPerformanceTracker();
  const enableTracking = options.enablePerformanceTracking ?? (import.meta.env.DEV);
  if (enableTracking) {
    tracker.start();
    tracker.mark('start');
  }
  
  // Image downsampling for large images
  const enableDownsampling = options.enableDownsampling ?? true;
  let processedImage = image;
  let wasDownsampled = false;
  let downsampleRatio = 1;
  
  if (enableDownsampling && shouldDownsample(image.width, image.height, options.size)) {
    const downsampleSize = calculateDownsampleSize(image.width, image.height, options.size);
    processedImage = await downsampleImage(image, downsampleSize.width, downsampleSize.height);
    wasDownsampled = true;
    downsampleRatio = downsampleSize.scale;
    
    if (enableTracking) {
      tracker.mark('imageDownsampled');
    }
  }
  
  if (enableTracking) {
    tracker.mark('imageLoaded');
  }
  
  // Report progress: image loaded (20%)
  options.onProgress?.(0.2);
  
  const size = options.size;
  const canvasW = size;
  const canvasH = size;

  // Compute px metrics based on size to keep thickness consistent
  const base = Math.min(canvasW, canvasH);
  const thickness = Math.round((options.thicknessPct / 100) * base);
  const padding = Math.round(((options.paddingPct ?? 0) / 100) * base);

  // Create canvas (with OffscreenCanvas fallback and size validation)
  const { canvas, ctx } = createCanvas(canvasW, canvasH);
  
  // Enable high-quality image smoothing for crisp rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background fill (optional, else transparent)
  if (options.backgroundColor) {
    ctx.save();
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  }

  // Geometry (circle only)
  const r = Math.min(canvasW, canvasH) / 2;
  const ringOuterRadius = r - Math.max(1, padding);
  const ringInnerRadius = Math.max(0, ringOuterRadius - thickness);
  const imageRadius = clamp(ringInnerRadius, 0, r - 0.5);

  // Get colors from modes.ring.colors (all stripes have weight 1)
  const ringColors = flag.modes?.ring?.colors ?? [];
  const stripes = ringColors.map(color => ({ color, weight: 1 }));
  const totalWeight = stripes.length;
  const presentation = options.presentation as 'ring' | 'segment' | 'cutout' | undefined;
  let borderStyle: 'concentric' | 'angular' | 'cutout';
  if (presentation === 'ring') borderStyle = 'concentric';
  else if (presentation === 'segment') borderStyle = 'angular';
  else if (presentation === 'cutout') borderStyle = 'cutout';
  else borderStyle = 'concentric'; // Default to concentric (horizontal stripes)

  /**
   * CUTOUT MODE: Special rendering where the user's image is in the center circle
   * and the flag pattern appears only in the border/ring area
   */
  if (borderStyle === 'cutout') {
    // Step 1: Draw the user's image in the center circle (respecting inset and position)
    // imageOffsetPx is used for image positioning, flagOffsetPct is used for flag pattern offset
    ctx.save();
    ctx.beginPath();
    // Clip to the inner circle area (where the image should appear)
    // Clip circle stays centered - don't apply image offset to clip
    ctx.arc(r, r, imageRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Use downsampled image if available
    const iw = processedImage.width;
    const ih = processedImage.height;
    // Scale image to fit the inner circle (respecting inset)
    const target = imageRadius * 2;
    const coverScale = Math.max(target / iw, target / ih);
    // Apply zoom if provided
    // Zoom is in percentage: 0% = 1x, 100% = 2x, 200% = 3x
    const zoom = options.imageZoom ?? 0;
    const zoomMultiplier = 1 + (zoom / 100);
    const scale = coverScale * zoomMultiplier;
    const dw = iw * scale;
    const dh = ih * scale;
    // Apply image offset for positioning (from imagePosition)
    const imgOffsetX = options.imageOffsetPx?.x ?? 0;
    const imgOffsetY = options.imageOffsetPx?.y ?? 0;
    const cx = canvasW / 2 + imgOffsetX;
    const cy = canvasH / 2 + imgOffsetY;
    
    ctx.drawImage(processedImage, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
    
    // Report progress: image drawn (40%)
    options.onProgress?.(0.4);

    // Step 2: Create a flag texture for the ring area
    // Use flagOffsetPct (percentage) for flag pattern shifting
    const flagOffsetPct = options.flagOffsetPct?.x ?? 0;
    
    // Calculate extra width needed for flag shifting
    // Estimate based on max possible flag extension (flag could extend up to canvas width)
    // Use 3x multiplier for safety margin
    const estimatedMaxExtension = canvasW;
    const extraWidth = Math.abs(flagOffsetPct / 50) * estimatedMaxExtension * 3;
    const flagCanvas = new OffscreenCanvas(canvasW + extraWidth, canvasH);
    const flagCtx = flagCanvas.getContext('2d')!;
    
    // Enable high-quality image smoothing for crisp flag rendering
    flagCtx.imageSmoothingEnabled = true;
    flagCtx.imageSmoothingQuality = 'high';
    
    // The ring center on the flagCanvas (accounting for extraWidth)
    const ringCenterX = extraWidth / 2 + r;
    
    // If a border image (PNG) is provided, use it for accurate flag rendering
    if (options.borderImageBitmap) {
      // Draw the flag PNG image with FIXED size based on ring height (diameter) and flag aspect ratio
      // The flag should NOT scale based on offset - offset only shifts position
      
      // Flag rectangle height = ring outer diameter
      // This matches the full height of the outer circle
      // This is constant regardless of offset
      const ringOuterDiameter = ringOuterRadius * 2;
      const flagRectHeight = ringOuterDiameter;
      
      // Flag rectangle width = height * aspect ratio from flags.ts (maintains flag's natural proportions)
      // Use the aspect ratio from the flag data, not from the bitmap dimensions
      // Note: The flag will extend beyond the circle's edges horizontally, but the circular clipping will cut it off
      const flagAspectRatio = flag.aspectRatio ?? 2; // Default to 2:1 if not specified
      const flagRectWidth = flagRectHeight * flagAspectRatio;
      
      // Position flag with offset
      // The ring center on flagCanvas is at ringCenterX
      // Offset semantics (from schema):
      //   -50%: left edge of border touches left edge of flag
      //   0%: center, no offset
      //   +50%: right edge of border touches right edge of flag
      // 
      // The flag extends beyond the ring by (flagRectWidth - ringOuterDiameter) / 2 on each side
      // We map the offset percentage (-50 to +50) directly to this extension range
      const flagExtension = (flagRectWidth - ringOuterDiameter) / 2;
      // Convert percentage (-50 to +50) to offset in pixels
      // -50%: shift flag RIGHT so left edge of border touches left edge of flag
      // +50%: shift flag LEFT so right edge of border touches right edge of flag
      // So we negate the percentage to get the correct direction
      const offsetPx = -(flagOffsetPct / 50) * flagExtension;
      const dx = ringCenterX - flagRectWidth / 2 + offsetPx;
      const dy = r - flagRectHeight / 2;
      
      // Debug logging (remove after verification)
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[Cutout] Flag rendering:', {
          flagId: flag.id,
          aspectRatio: flagAspectRatio,
          flagRectHeight,
          flagRectWidth,
          ringOuterDiameter,
          flagOffsetPct: flagOffsetPct,
          bitmapWidth: options.borderImageBitmap.width,
          bitmapHeight: options.borderImageBitmap.height,
          bitmapAspectRatio: options.borderImageBitmap.width / options.borderImageBitmap.height,
          canvasW,
          canvasH,
          r,
          ringCenterX,
          extraWidth,
          dx,
          dy,
          flagCanvasWidth: flagCanvas.width,
          flagCanvasHeight: flagCanvas.height,
        });
      }
      flagCtx.drawImage(options.borderImageBitmap, dx, dy, flagRectWidth, flagRectHeight);
    } else {
      // Draw horizontal stripes from modes.ring.colors
      let y = 0;
      for (const stripe of stripes) {
        const frac = stripe.weight / totalWeight;
        const h = frac * canvasH;
        flagCtx.fillStyle = stripe.color;
        flagCtx.fillRect(0, y, flagCanvas.width, h);
        y += h;
      }
    }
    
    // Clip the flag to only the ring area (annulus)
    // The ring is centered at ringCenterX on the flagCanvas
    flagCtx.globalCompositeOperation = 'destination-in';
    flagCtx.fillStyle = 'white'; // Color doesn't matter, only alpha
    flagCtx.beginPath();
    flagCtx.arc(ringCenterX, r, ringOuterRadius, 0, Math.PI * 2);
    flagCtx.arc(ringCenterX, r, ringInnerRadius, Math.PI * 2, 0, true); // Cut out the inner circle
    flagCtx.fill();
    
    // Step 3: Draw the flag ring on top of the image
    // Offset the drawing position to account for the extra canvas width
    // This aligns the ring center on flagCanvas (ringCenterX) with the ring center on main canvas (r)
    ctx.drawImage(flagCanvas, -extraWidth / 2, 0);

    // Cutout mode complete - skip normal border rendering below
  } else {
    /**
     * NORMAL MODE (Ring/Segment): Draw user's image in center,
     * then add flag-colored border around it
     * Note: imageOffsetPx can be used to shift image center if needed
     */

  // Draw circular masked image (kept inside border)
  ctx.save();
  ctx.beginPath();
  // Clip circle stays centered - don't apply image offset to clip
  // The offset only affects where the image is drawn, not the clip boundary
  ctx.arc(r, r, imageRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Fit image into the inner circle (cover)
  // Use downsampled image if available
  const iw = processedImage.width,
    ih = processedImage.height;
  const target = imageRadius * 2;
  const coverScale = Math.max(target / iw, target / ih);
  // Apply zoom if provided
  // Zoom is in percentage: 0% = 1x, 100% = 2x, 200% = 3x
  const zoom = options.imageZoom ?? 0;
  const zoomMultiplier = 1 + (zoom / 100);
  const scale = coverScale * zoomMultiplier;
  const dw = iw * scale,
    dh = ih * scale;
  // Apply image offset for positioning (from imagePosition)
  const imgOffsetX = options.imageOffsetPx?.x ?? 0;
  const imgOffsetY = options.imageOffsetPx?.y ?? 0;
  // Center in canvas (with optional offset for fine-tuning)
  const cx = canvasW / 2 + imgOffsetX,
    cy = canvasH / 2 + imgOffsetY;
  ctx.drawImage(processedImage, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
  
  // Report progress: image drawn (50%)
  options.onProgress?.(0.5);

  // Draw ring segments for the flag
  // If a border image bitmap is provided, prefer rendering it wrapped around the annulus.
  // (Not used for cutout mode which has its own rendering path above)
  if (options.borderImageBitmap && presentation !== 'cutout') {
    // If the caller provided an SVG (or any) bitmap, generate a texture mapped to the ring
    const thickness = Math.max(1, Math.round(ringOuterRadius - ringInnerRadius));
    const midR = (ringInnerRadius + ringOuterRadius) / 2;
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
      // Map left-edge -> top of ring, apply rotation if provided
      const rotationRad = options.segmentRotation !== undefined 
        ? (options.segmentRotation * Math.PI) / 180 
        : 0;
      const startAngle = -Math.PI / 2 + rotationRad;
      drawTexturedAnnulus(ctx, r, ringInnerRadius, ringOuterRadius, bmpTex, startAngle, 'normal');
    } catch {
      // fallback: draw it directly (older behavior)
      try {
        drawTexturedAnnulus(ctx, r, ringInnerRadius, ringOuterRadius, options.borderImageBitmap);
      } catch {
        // last resort: semi-transparent concentric rings
        ctx.save();
        ctx.globalAlpha = 0.64;
        drawConcentricRings(ctx, r, ringInnerRadius, ringOuterRadius, stripes, totalWeight);
        ctx.restore();
      }
    }
  } else if (borderStyle === 'concentric') {
    // Map horizontal stripes to concentric annuli from outer->inner to preserve stripe order (top => outer)
    drawConcentricRings(ctx, r, ringInnerRadius, ringOuterRadius, stripes, totalWeight);
  } else {
    // default: angular arcs (vertical stripes map naturally around circumference)
    // Apply rotation if provided (convert degrees to radians)
    const rotationRad = options.segmentRotation !== undefined 
      ? (options.segmentRotation * Math.PI) / 180 
      : 0;
    let start = -Math.PI / 2 + rotationRad; // start at top center, apply rotation
    for (const stripe of stripes) {
      const frac = stripe.weight / totalWeight;
      const sweep = Math.PI * 2 * frac;
      const end = start + sweep;
      drawRingArc(ctx, r, ringInnerRadius, ringOuterRadius, start, end, stripe.color);
      start = end;
    }
  }
  } // Close the else block for non-cutout mode
  
  // Report progress: rendering complete (80%)
  if (enableTracking) {
    tracker.mark('renderComplete');
  }
  options.onProgress?.(0.8);

  // Optional outer stroke
  if (options.outerStroke) {
    ctx.beginPath();
    ctx.arc(canvasW / 2, canvasH / 2, ringOuterRadius, 0, Math.PI * 2);
    ctx.strokeStyle = options.outerStroke.color;
    ctx.lineWidth = options.outerStroke.widthPx;
    ctx.stroke();
  }

  // Export PNG with optimized compression
  // PNG compression quality: 0.92 is optimal balance between quality and file size
  const pngQuality = options.pngQuality ?? 0.92;
  const blob = await canvasToBlob(canvas, 'image/png', pngQuality);
  
  // Calculate file size
  const sizeBytes = blob.size;
  const sizeKB = (sizeBytes / 1024).toFixed(2);
  
  // Report progress: export complete (100%)
  if (enableTracking) {
    tracker.mark('exportComplete');
    
    // Generate and log metrics
    const metrics = tracker.complete(
      { width: image.width, height: image.height },
      { width: canvasW, height: canvasH },
      wasDownsampled,
      downsampleRatio
    );
    
    logRenderMetrics(metrics);
    
    // Log file size in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`📦 Export size: ${sizeKB} KB (${sizeBytes.toLocaleString()} bytes)`);
    }
    
    options.onProgress?.(1.0);
    
    return {
      blob,
      sizeBytes,
      sizeKB,
      metrics
    };
  }
  
  options.onProgress?.(1.0);
  
  return {
    blob,
    sizeBytes,
    sizeKB
  };
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
