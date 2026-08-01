/**
 * Application-wide constants
 *
 * Centralized location for magic numbers and configuration values
 * to improve maintainability and consistency.
 */

/**
 * Canvas rendering sizes
 */
export const RENDER_SIZES = {
  /** Standard render size (1x) */
  STANDARD: 512,
  /** Live preview render size - persistent WebGL renderer, no blob encoding */
  PREVIEW: 512,
  /** High-resolution export size (2x) - used for Save/download only */
  HIGH_RES: 1024,
} as const;

/**
 * Image capture and processing constants
 */
export const IMAGE_CONSTANTS = {
  /** Default output size for captured images (high-res for quality) */
  DEFAULT_CAPTURE_SIZE: 1024,
  /** Default circle size in pixels (updated from CSS, but this is fallback) */
  DEFAULT_CIRCLE_SIZE: 250,
  /** Minimum circle size for preview container */
  MIN_CIRCLE_SIZE: 250,
  /** Maximum circle size for preview container */
  MAX_CIRCLE_SIZE: 400,
} as const;

/**
 * File size conversion constants
 */
export const FILE_SIZE = {
  /** Bytes per kilobyte */
  BYTES_PER_KB: 1024,
  /** Bytes per megabyte */
  BYTES_PER_MB: 1024 * 1024,
  /** Bytes per gigabyte */
  BYTES_PER_GB: 1024 * 1024 * 1024,
} as const;

/**
 * Type for render size options
 */
export type RenderSize = (typeof RENDER_SIZES)[keyof typeof RENDER_SIZES];
