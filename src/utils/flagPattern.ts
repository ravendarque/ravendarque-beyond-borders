/**
 * Flag pattern utilities for UI rendering
 * 
 * These functions generate canvas-based flag patterns for the UI preview.
 * This is separate from the final renderer which creates the download image.
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
 * Generate canvas-based pattern for ring mode
 * Returns data URL of concentric rings sized for the annulus
 */
async function generateRingPatternCanvas(options: FlagPatternOptions): Promise<string> {
  const { flag, wrapperSize, circleSize } = options;
  
  const colors = flag.modes?.ring?.colors ?? [];
  if (colors.length === 0) {
    return 'transparent';
  }
  
  // Calculate annulus dimensions
  const wrapperRadius = wrapperSize / 2;
  const circleRadius = circleSize / 2;
  const annulusThickness = wrapperRadius - circleRadius;
  
  if (annulusThickness <= 0) {
    return 'transparent';
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
  const thickness = outerR - innerR;
  let remainingOuter = outerR;
  
  for (const stripe of stripes) {
    const frac = stripe.weight / totalWeight;
    const band = frac * thickness;
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
  
  // Fill any remaining gap with last stripe color
  if (remainingOuter > innerR + 0.5) {
    ctx.beginPath();
    ctx.arc(center, center, remainingOuter, 0, Math.PI * 2);
    ctx.arc(center, center, innerR, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = stripes[stripes.length - 1]?.color ?? '#000000';
    ctx.fill();
  }
  
  // Convert to data URL
  const blob = await canvas.convertToBlob();
  return URL.createObjectURL(blob);
}

/**
 * Generate canvas-based pattern for segment mode
 * Returns data URL of angular segments as full circle
 */
async function generateSegmentPatternCanvas(options: FlagPatternOptions): Promise<string> {
  const { flag, wrapperSize, circleSize, segmentRotation = 0 } = options;
  
  const colors = flag.modes?.ring?.colors ?? [];
  if (colors.length === 0) {
    return 'transparent';
  }
  
  // Calculate annulus dimensions
  const wrapperRadius = wrapperSize / 2;
  const circleRadius = circleSize / 2;
  const annulusThickness = wrapperRadius - circleRadius;
  
  if (annulusThickness <= 0) {
    return 'transparent';
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
  
  // Convert to data URL
  const blob = await canvas.convertToBlob();
  return URL.createObjectURL(blob);
}

/**
 * Generate flag pattern data URL based on presentation mode
 */
export async function generateFlagPattern(options: FlagPatternOptions): Promise<string> {
  switch (options.presentation) {
    case 'cutout':
      return Promise.resolve(generateCutoutPattern(options));
    case 'ring':
      return generateRingPatternCanvas(options);
    case 'segment':
      return generateSegmentPatternCanvas(options);
    default:
      return Promise.resolve('transparent');
  }
}

/**
 * Generate flag pattern background style object
 */
export async function generateFlagPatternStyle(options: FlagPatternOptions): Promise<React.CSSProperties> {
  const backgroundImage = await generateFlagPattern(options);
  
  if (options.presentation === 'cutout' && options.flag.png_full) {
    const { flag, flagOffsetPct = 0, wrapperSize } = options;
    const aspectRatio = flag.aspectRatio ?? 2;
    const flagHeight = wrapperSize;
    const flagWidth = flagHeight * aspectRatio;
    // Offset calculation: -50% = left edge, 0% = center, +50% = right edge
    // We negate to match renderer semantics
    const offsetPx = -(flagOffsetPct / 50) * (flagWidth - wrapperSize) / 2;
    const backgroundPositionX = `calc(50% + ${offsetPx}px)`;
    
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: `${flagWidth}px ${flagHeight}px`,
      backgroundPosition: `${backgroundPositionX} center`,
      backgroundRepeat: 'no-repeat',
    };
  }
  
  // For ring and segment modes, use the canvas-generated data URL
  return {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}
