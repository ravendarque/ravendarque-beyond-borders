/**
 * Utilities for calculating image position and constraints
 * 
 * Handles position calculations for profile picture adjustment in step 1,
 * including aspect ratio detection and movement limits.
 */

export type ImageAspectRatio = 'landscape' | 'portrait' | 'square';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface PositionLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ImagePosition {
  x: number; // Horizontal position (-100 to 100, where 0 is center)
  y: number; // Vertical position (-100 to 100, where 0 is center)
  zoom: number; // Zoom level (0 to 200, where 0 is no zoom, 100 is 2x)
}

/**
 * Determine image aspect ratio from dimensions
 */
export function getAspectRatio(dimensions: ImageDimensions): ImageAspectRatio {
  const { width, height } = dimensions;
  if (width > height) return 'landscape';
  if (height > width) return 'portrait';
  return 'square';
}

/**
 * Calculate position limits based on image dimensions, circle size, and zoom
 * 
 * @param imageDimensions - Natural image dimensions
 * @param circleSize - Size of the circular preview area in pixels
 * @param zoom - Zoom level (0-200, where 0 is no zoom)
 * @returns Position limits in percentage (-100 to 100)
 */
export function calculatePositionLimits(
  imageDimensions: ImageDimensions,
  circleSize: number,
  zoom: number = 0
): PositionLimits {
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const aspectRatio = getAspectRatio(imageDimensions);
  
  // Calculate how the image fits in the circle with cover sizing
  // When using cover, the image is scaled to fill the circle
  // The dimension that's larger (relative to circle) determines the fit
  const circleDiameter = circleSize;
  
  // Calculate scale factor for cover sizing
  // Image is scaled so the smaller dimension fits the circle
  const scale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;
  
  // Calculate how much the image extends beyond the circle
  // This determines the movement range
  const overflowX = (scaledWidth - circleDiameter) / 2;
  const overflowY = (scaledHeight - circleDiameter) / 2;
  
  // Convert overflow to percentage of circle radius
  // Position is in percentage where 100% = full radius movement
  const radius = circleDiameter / 2;
  const maxMoveX = (overflowX / radius) * 100;
  const maxMoveY = (overflowY / radius) * 100;
  
  // Apply zoom: zoom increases the scale, which increases movement range
  const zoomMultiplier = 1 + (zoom / 100); // 0% zoom = 1x, 100% zoom = 2x, 200% zoom = 3x
  const zoomedMaxMoveX = maxMoveX * zoomMultiplier;
  const zoomedMaxMoveY = maxMoveY * zoomMultiplier;
  
  // For landscape: only horizontal movement (when zoom = 0)
  // For portrait: only vertical movement (when zoom = 0)
  // For square: no movement (when zoom = 0)
  // When zoom > 0, both axes become available
  
  if (zoom === 0) {
    if (aspectRatio === 'landscape') {
      return {
        minX: -zoomedMaxMoveX,
        maxX: zoomedMaxMoveX,
        minY: 0,
        maxY: 0,
      };
    }
    if (aspectRatio === 'portrait') {
      return {
        minX: 0,
        maxX: 0,
        minY: -zoomedMaxMoveY,
        maxY: zoomedMaxMoveY,
      };
    }
    // Square
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    };
  }
  
  // With zoom, both axes are available
  return {
    minX: -zoomedMaxMoveX,
    maxX: zoomedMaxMoveX,
    minY: -zoomedMaxMoveY,
    maxY: zoomedMaxMoveY,
  };
}

/**
 * Convert position percentage to CSS background-position value
 * 
 * @param position - Position object with x and y percentages
 * @returns CSS background-position string (e.g., "25% 30%")
 */
export function positionToBackgroundPosition(position: { x: number; y: number }): string {
  // CSS background-position: 0% = left/top, 50% = center, 100% = right/bottom
  // Our position: -100 = show left/top, 0 = center, 100 = show right/bottom
  // When position.x is positive (right), we want to show right side (CSS 100%)
  // When position.x is negative (left), we want to show left side (CSS 0%)
  const x = 50 + (position.x / 2); // Convert -100..100 to 0..100, then shift by 50% for center
  const y = 50 + (position.y / 2);
  return `${x}% ${y}%`;
}

/**
 * Convert position percentage to pixels for renderer
 * 
 * @param position - Position object with x and y percentages
 * @param canvasSize - Size of the canvas in pixels (512 or 1024)
 * @returns Offset in pixels for renderer
 */
export function positionToRendererOffset(
  position: { x: number; y: number },
  canvasSize: number
): { x: number; y: number } {
  // Position is in percentage (-100 to 100)
  // Convert to pixels: percentage of radius
  const radius = canvasSize / 2;
  const xPx = (position.x / 100) * radius;
  const yPx = (position.y / 100) * radius;
  return { x: xPx, y: yPx };
}

/**
 * Clamp position value within limits
 */
export function clampPosition(
  position: ImagePosition,
  limits: PositionLimits
): ImagePosition {
  return {
    x: Math.max(limits.minX, Math.min(limits.maxX, position.x)),
    y: Math.max(limits.minY, Math.min(limits.maxY, position.y)),
    zoom: position.zoom, // Zoom is clamped separately
  };
}
