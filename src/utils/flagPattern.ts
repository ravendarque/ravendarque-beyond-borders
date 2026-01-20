/**
 * Flag pattern utilities for UI rendering
 * 
 * Uses CSS gradients for ring/segment modes (instant, smooth transitions)
 * Canvas is only used for final download render, not UI preview.
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
 * Generate CSS radial-gradient for ring mode
 * Returns CSS gradient string for concentric rings
 */
function generateRingPatternCSS(options: FlagPatternOptions): string {
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
  
  // Generate color stops for radial gradient
  // Each color gets equal fraction of the annulus thickness
  // Gradient goes from center (0%) to edge (100%)
  // We want colors to appear only in the annulus region (innerRadius% to 100%)
  const totalColors = colors.length;
  const center = '50%';
  
  // Calculate percentage positions for each ring
  // innerRadius% = where inner circle starts
  // 100% = outer edge
  const innerRadiusPct = (circleRadius / wrapperRadius) * 100;
  const annulusPct = 100 - innerRadiusPct;
  
  // Build gradient stops from inner to outer
  // Each color gets equal fraction of the annulus
  const stops: string[] = [];
  let currentPct = innerRadiusPct;
  
  for (let i = 0; i < colors.length; i++) {
    const frac = 1 / totalColors;
    const bandPct = frac * annulusPct;
    const nextPct = Math.min(100, currentPct + bandPct);
    
    // Each ring has hard edges (same color at start and end)
    stops.push(`${colors[i]} ${currentPct}%`);
    stops.push(`${colors[i]} ${nextPct}%`);
    
    currentPct = nextPct;
    if (currentPct >= 100) break;
  }
  
  // Ensure we reach 100% with last color
  if (currentPct < 100) {
    const lastColor = colors[colors.length - 1] ?? '#000000';
    stops.push(`${lastColor} ${currentPct}%`);
    stops.push(`${lastColor} 100%`);
  }
  
  // Everything inside innerRadius is transparent (will be covered by image circle)
  if (innerRadiusPct > 0) {
    stops.unshift(`transparent 0%`, `transparent ${innerRadiusPct}%`);
  }
  
  return `radial-gradient(circle at ${center}, ${stops.join(', ')})`;
}

/**
 * Generate CSS conic-gradient for segment mode
 * Returns CSS gradient string for angular segments
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
 * Generate canvas element for segment mode (for direct DOM rendering)
 * Returns OffscreenCanvas that can be drawn to a regular canvas
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
 * Returns synchronously - no async operations needed for CSS gradients
 */
export function generateFlagPatternStyle(options: FlagPatternOptions): React.CSSProperties {
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
      const gradient = generateRingPatternCSS(options);
      return {
        backgroundImage: gradient,
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
