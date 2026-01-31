/**
 * Canvas utility functions for renderer
 * Includes fallbacks, validation, and browser compatibility helpers
 */

/**
 * Browser-specific canvas size limits (width * height in pixels)
 * Source: https://github.com/jhildenbiddle/canvas-size
 */
export const CANVAS_LIMITS = {
  chrome: 16384 * 16384, // ~268 million pixels
  firefox: 32767 * 32767, // ~1 billion pixels
  safari: 4096 * 4096, // ~16 million pixels (most restrictive)
  default: 4096 * 4096, // Use Safari's limit as safe default
} as const;

/**
 * Detect browser type for canvas limit checking
 */
function getBrowserType(): keyof typeof CANVAS_LIMITS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('chrome') || ua.includes('edge')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  return 'default';
}

/**
 * Get maximum safe canvas size for current browser
 */
export function getMaxCanvasSize(): number {
  const browser = getBrowserType();
  return CANVAS_LIMITS[browser];
}

/**
 * Validate that canvas dimensions are within browser limits
 * @throws Error if dimensions exceed limits
 */
export function validateCanvasSize(width: number, height: number): void {
  const maxSize = getMaxCanvasSize();
  const requestedSize = width * height;

  if (requestedSize > maxSize) {
    const browser = getBrowserType();
    const maxDimension = Math.floor(Math.sqrt(maxSize));
    throw new Error(
      `Canvas size ${width}x${height} (${requestedSize.toLocaleString()} pixels) ` +
        `exceeds ${browser} limit of ${Math.floor(Math.sqrt(maxSize))}x${Math.floor(Math.sqrt(maxSize))} ` +
        `(${maxSize.toLocaleString()} pixels). Maximum dimension: ${maxDimension}px.`,
    );
  }
}

/**
 * Check if OffscreenCanvas is supported
 */
export function supportsOffscreenCanvas(): boolean {
  try {
    return (
      typeof OffscreenCanvas !== 'undefined' &&
      typeof OffscreenCanvas.prototype.convertToBlob === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Create a canvas (OffscreenCanvas if supported, otherwise regular Canvas)
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @returns Canvas instance and its 2D context
 */
export function createCanvas(
  width: number,
  height: number,
): {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
} {
  // Validate size first
  validateCanvasSize(width, height);

  if (supportsOffscreenCanvas()) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from OffscreenCanvas');
    }
    return { canvas, ctx };
  } else {
    // Fallback to regular Canvas for older browsers
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from Canvas');
    }
    return { canvas, ctx };
  }
}

/**
 * Convert canvas to Blob (with fallback for regular Canvas)
 * @param canvas Canvas instance (OffscreenCanvas or HTMLCanvasElement)
 * @param type MIME type (default: 'image/png')
 * @param quality Quality for lossy formats (0-1)
 * @returns Promise resolving to Blob
 */
export async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  // OffscreenCanvas has convertToBlob method
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }

  // Regular Canvas fallback using toBlob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality,
    );
  });
}

/**
 * Validate hex color code
 * @param color Hex color string (e.g., '#FF0000' or '#F00')
 * @returns True if valid
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(color);
}

/**
 * Normalize hex color to 6-digit format
 * @param color Hex color string (e.g., '#F00' or '#FF0000')
 * @returns 6-digit hex color (e.g., '#FF0000')
 */
export function normalizeHexColor(color: string): string {
  if (!isValidHexColor(color)) {
    throw new Error(`Invalid hex color: ${color}`);
  }

  // Already 6 digits
  if (color.length === 7) {
    return color.toUpperCase();
  }

  // Expand 3 digits to 6 digits (#F00 -> #FF0000)
  const r = color[1];
  const g = color[2];
  const b = color[3];
  return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Allocate pixels to stripes proportionally, ensuring no gaps or overlaps
 * Uses integer arithmetic to avoid accumulating rounding errors
 *
 * @param totalPixels Total pixels to allocate
 * @param weights Array of relative weights for each stripe
 * @returns Array of pixel counts for each stripe (sum equals totalPixels)
 */
export function allocatePixels(totalPixels: number, weights: number[]): number[] {
  if (weights.length === 0) {
    return [];
  }

  if (weights.some((w) => w <= 0)) {
    throw new Error('All stripe weights must be positive');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const result: number[] = [];
  let allocated = 0;

  // Allocate pixels proportionally, rounding down
  for (let i = 0; i < weights.length - 1; i++) {
    const pixels = Math.floor((weights[i] / totalWeight) * totalPixels);
    result.push(pixels);
    allocated += pixels;
  }

  // Give remaining pixels to last stripe to ensure exact total
  result.push(totalPixels - allocated);

  return result;
}

/**
 * Check if two colors are visually similar (within tolerance)
 * @param color1 First hex color
 * @param color2 Second hex color
 * @param tolerance RGB tolerance (default: 1)
 * @returns True if colors are within tolerance
 */
export function colorsAreSimilar(color1: string, color2: string, tolerance = 1): boolean {
  const c1 = normalizeHexColor(color1);
  const c2 = normalizeHexColor(color2);

  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);

  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);

  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance
  );
}
