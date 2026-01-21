/**
 * Flag pattern utilities for UI rendering
 * 
 * Ring mode: Uses canvas rendering for reliable hard-edged concentric rings
 * Segment mode: Uses CSS conic-gradient for smooth angular segments
 * Cutout mode: Uses flag PNG images with positioning
 */

import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';

export type PresentationMode = 'ring' | 'segment' | 'cutout';

export interface FlagPatternOptions {
  /** Flag specification */
  flag: FlagSpec;
  /** Presentation mode */
  presentation: PresentationMode;
  /** Border thickness percentage (5-20) */
  thicknessPct: number;
  /** Flag offset percentage for cutout mode (-50 to +50) */
  flagOffsetPct?: number;
  /** Segment rotation in degrees (for segment mode) */
  segmentRotation?: number;
  /** Wrapper size in pixels */
  wrapperSize: number;
  /** Circle size in pixels (for calculating annulus) */
  circleSize: number;
}

/**
 * Generate CSS background for cutout mode
 * Returns a full circle flag pattern
 */
export function generateCutoutPattern(options: FlagPatternOptions): string {
  const { flag, flagOffsetPct = 0, wrapperSize } = options;
  
  if (!flag.png_full) {
    // Fallback to ring colors if no PNG
    return 'transparent';
  }
  
  // For cutout mode, use the flag PNG as full circle background
  // The offset adjusts the background position
  const flagUrl = getAssetUrl(`flags/${flag.png_full}`);
  return flagUrl;
}

/**
 * Generate canvas element for ring mode
 * 
 * Uses the same rendering logic as the final download renderer to ensure
 * UI preview matches the downloaded image exactly.
 * 
 * @returns OffscreenCanvas with concentric rings drawn from outer to inner
 */
export async function generateRingPatternCanvasElement(options: FlagPatternOptions): Promise<OffscreenCanvas | null> {
  const { flag, wrapperSize, circleSize } = options;
  
  const colors = flag.modes?.ring?.colors ?? [];
  if (colors.length === 0) {
    return null;
  }
  
  // Calculate annulus dimensions
  const wrapperRadius = wrapperSize / 2;
  const circleRadius = circleSize / 2;
  const annulusThickness = wrapperRadius - circleRadius;
  
  if (annulusThickness <= 0) {
    return null;
  }
  
  // Create canvas matching the renderer's logic
  const canvas = new OffscreenCanvas(wrapperSize, wrapperSize);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  const center = wrapperSize / 2;
  const innerR = circleRadius;
  const outerR = wrapperRadius;
  
  // Create stripes with equal weight (matching renderer)
  const stripes = colors.map(color => ({ color, weight: 1 }));
  const totalWeight = stripes.length;
  
  // Draw concentric rings from outer to inner (matching renderer's drawConcentricRings)
  let remainingOuter = outerR;
  
  for (const stripe of stripes) {
    const frac = stripe.weight / totalWeight;
    const band = frac * annulusThickness;
    const bandInner = Math.max(innerR, remainingOuter - band);
    
    // Draw annulus between bandInner and remainingOuter
    ctx.beginPath();
    ctx.arc(center, center, remainingOuter, 0, Math.PI * 2);
    ctx.arc(center, center, bandInner, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = stripe.color;
    ctx.fill();
    
    remainingOuter = bandInner;
    if (remainingOuter <= innerR + 0.5) break;
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
  
  return canvas;
}

/**
 * Generate CSS conic-gradient for segment mode
 * 
 * Creates smooth angular segments with subtle anti-aliasing transitions
 * between color boundaries to eliminate pixel artifacts.
 */
function generateSegmentPatternCSS(options: FlagPatternOptions): string {
  const { flag, segmentRotation = 0 } = options;
  
  const colors = flag.modes?.ring?.colors ?? [];
  if (colors.length === 0) {
    return 'transparent';
  }
  
  // Conic gradient: starts at top (12 o'clock) = -90deg
  // Apply rotation offset
  const startAngle = -90 + segmentRotation;
  
  // Each color gets equal fraction of the circle
  // Add a tiny transition zone (0.4deg) between segments to smooth jagged pixel edges
  // This creates a very subtle blend that eliminates aliasing while still looking like distinct segments
  const anglePerColor = 360 / colors.length;
  const transitionZone = 0.4; // Small transition in degrees for anti-aliasing
  const stops: string[] = [];
  
  for (let i = 0; i < colors.length; i++) {
    const startAngleDeg = i * anglePerColor;
    const endAngleDeg = (i + 1) * anglePerColor;
    const currentColor = colors[i];
    const nextColor = colors[(i + 1) % colors.length];
    
    // Start of segment: current color
    stops.push(`${currentColor} ${startAngleDeg}deg`);
    // Just before end: current color (most of segment is solid)
    stops.push(`${currentColor} ${endAngleDeg - transitionZone}deg`);
    // At end: transition to next color (smooth edge)
    stops.push(`${nextColor} ${endAngleDeg}deg`);
  }
  
  return `conic-gradient(from ${startAngle}deg at 50%, ${stops.join(', ')})`;
}

/**
 * Generate canvas element for segment mode
 * 
 * Alternative to CSS conic-gradient, matching the renderer's logic exactly.
 * Currently unused in UI (CSS gradient is preferred for performance).
 */
export async function generateSegmentPatternCanvasElement(options: FlagPatternOptions): Promise<OffscreenCanvas | null> {
  const { flag, wrapperSize, circleSize, segmentRotation = 0 } = options;
  
  const colors = flag.modes?.ring?.colors ?? [];
  if (colors.length === 0) {
    return null;
  }
  
  // Calculate annulus dimensions
  const wrapperRadius = wrapperSize / 2;
  const circleRadius = circleSize / 2;
  const annulusThickness = wrapperRadius - circleRadius;
  
  if (annulusThickness <= 0) {
    return null;
  }
  
  // Create canvas matching the renderer's logic
  const canvas = new OffscreenCanvas(wrapperSize, wrapperSize);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  const center = wrapperSize / 2;
  const innerR = circleRadius;
  const outerR = wrapperRadius;
  
  // Create stripes with equal weight (matching renderer)
  const stripes = colors.map(color => ({ color, weight: 1 }));
  const totalWeight = stripes.length;
  
  // Draw angular arcs (matching renderer's logic)
  // Apply rotation: convert degrees to radians
  const rotationRad = (segmentRotation * Math.PI) / 180;
  let start = -Math.PI / 2 + rotationRad; // start at top center, apply rotation
  
  for (const stripe of stripes) {
    const frac = stripe.weight / totalWeight;
    const sweep = Math.PI * 2 * frac;
    const end = start + sweep;
    
    // Draw arc segment (matching renderer's drawRingArc)
    ctx.beginPath();
    ctx.arc(center, center, outerR, start, end);
    ctx.arc(center, center, innerR, end, start, true);
    ctx.closePath();
    ctx.fillStyle = stripe.color;
    ctx.fill();
    
    start = end;
  }
  
  return canvas;
}

/**
 * Generate flag pattern CSS/style based on presentation mode
 * 
 * - Ring mode: Canvas rendering (reliable for hard-edged concentric rings)
 * - Segment mode: CSS conic-gradient (smooth angular segments)
 * - Cutout mode: Flag PNG images with offset positioning
 * 
 * @returns Promise resolving to React CSS properties for background styling
 */
export async function generateFlagPatternStyle(options: FlagPatternOptions): Promise<React.CSSProperties> {
  switch (options.presentation) {
    case 'cutout': {
      const { flag, flagOffsetPct = 0, wrapperSize } = options;
      
      if (!flag.png_full) {
        return { backgroundImage: 'transparent' };
      }
      
      const flagUrl = getAssetUrl(`flags/${flag.png_full}`);
      const aspectRatio = flag.aspectRatio ?? 2;
      const flagHeight = wrapperSize;
      const flagWidth = flagHeight * aspectRatio;
      // Offset calculation: -50% = left edge, 0% = center, +50% = right edge
      // We negate to match renderer semantics
      const offsetPx = -(flagOffsetPct / 50) * (flagWidth - wrapperSize) / 2;
      const backgroundPositionX = `calc(50% + ${offsetPx}px)`;
      
      return {
        backgroundImage: `url(${flagUrl})`,
        backgroundSize: `${flagWidth}px ${flagHeight}px`,
        backgroundPosition: `${backgroundPositionX} center`,
        backgroundRepeat: 'no-repeat',
      };
    }
    
    case 'ring': {
      // Use canvas for ring mode - more reliable than CSS radial-gradient for hard-edged rings
      const canvas = await generateRingPatternCanvasElement(options);
      if (!canvas) {
        return { backgroundImage: 'none' };
      }
      
      // Convert OffscreenCanvas to blob URL
      const blob = await canvas.convertToBlob();
      const url = URL.createObjectURL(blob);
      
      return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    
    case 'segment': {
      const gradient = generateSegmentPatternCSS(options);
      return {
        backgroundImage: gradient,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    
    default:
      return { backgroundImage: 'transparent' };
  }
}

