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
  const coverScale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  
  // Apply zoom: zoom increases the scale, which increases movement range
  const zoomMultiplier = 1 + (zoom / 100); // 0% zoom = 1x, 100% zoom = 2x, 200% zoom = 3x
  const zoomedScale = coverScale * zoomMultiplier;
  
  // Calculate scaled dimensions with zoom applied
  const scaledWidth = imgWidth * zoomedScale;
  const scaledHeight = imgHeight * zoomedScale;
  
  // Calculate how much the image extends beyond the circle
  // This determines the movement range
  const overflowX = (scaledWidth - circleDiameter) / 2;
  const overflowY = (scaledHeight - circleDiameter) / 2;
  
  // Convert overflow to percentage of circle radius
  // Position is in percentage where 100% = full radius movement
  const radius = circleDiameter / 2;
  const maxMoveX = (overflowX / radius) * 100;
  const maxMoveY = (overflowY / radius) * 100;
  
  // Use these directly (zoom is already applied in the scale calculation)
  const zoomedMaxMoveX = maxMoveX;
  const zoomedMaxMoveY = maxMoveY;
  
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
 * Position is in range [-maxMove, maxMove] where maxMove is calculated from overflow.
 * We need to normalize this to CSS percentage (0-100%) where:
 * - position = -maxMove → CSS 0% (left edge)
 * - position = 0 → CSS 50% (center)
 * - position = maxMove → CSS 100% (right edge)
 * 
 * @param position - Position object with x and y percentages
 * @param limits - Position limits to normalize against (optional, for backward compatibility)
 * @returns CSS background-position string (e.g., "25% 30%")
 */
export function positionToBackgroundPosition(
  position: { x: number; y: number },
  limits?: PositionLimits,
  maxLimits?: PositionLimits
): string {
  let x: number;
  let y: number;
  
  if (limits) {
    // Position is stored as fixed percentage (-50 to +50), independent of zoom
    // This represents a percentage of the maximum possible movement range
    const currentMaxMoveX = Math.max(Math.abs(limits.minX), Math.abs(limits.maxX));
    const currentMaxMoveY = Math.max(Math.abs(limits.minY), Math.abs(limits.maxY));
    
    if (maxLimits) {
      // Use maxLimits as reference to ensure consistent mapping across zoom levels
      const maxMoveX = Math.max(Math.abs(maxLimits.minX), Math.abs(maxLimits.maxX));
      const maxMoveY = Math.max(Math.abs(maxLimits.minY), Math.abs(maxLimits.maxY));
      
      if (currentMaxMoveX > 0 && maxMoveX > 0) {
        // Map from fixed range (-50 to +50) to max limits, then scale to current limits
        const normalizedX = (position.x / 50) * maxMoveX;
        // Scale to current limits proportionally
        const actualX = (normalizedX / maxMoveX) * currentMaxMoveX;
        // Normalize to CSS: -currentMaxMoveX → 0%, 0 → 50%, currentMaxMoveX → 100%
        x = 50 + (actualX / currentMaxMoveX) * 50;
      } else {
        x = 50; // Center if no movement
      }
      
      if (currentMaxMoveY > 0 && maxMoveY > 0) {
        // Map from fixed range (-50 to +50) to max limits, then scale to current limits
        const normalizedY = (position.y / 50) * maxMoveY;
        // Scale to current limits proportionally
        const actualY = (normalizedY / maxMoveY) * currentMaxMoveY;
        // Normalize to CSS: -currentMaxMoveY → 0%, 0 → 50%, currentMaxMoveY → 100%
        y = 50 + (actualY / currentMaxMoveY) * 50;
      } else {
        y = 50; // Center if no movement
      }
    } else {
      // Fallback: map directly to current limits (old behavior)
      if (currentMaxMoveX > 0) {
        const actualX = (position.x / 50) * currentMaxMoveX;
        x = 50 + (actualX / currentMaxMoveX) * 50;
      } else {
        x = 50;
      }
      
      if (currentMaxMoveY > 0) {
        const actualY = (position.y / 50) * currentMaxMoveY;
        y = 50 + (actualY / currentMaxMoveY) * 50;
      } else {
        y = 50;
      }
    }
  } else {
    // Fallback: assume position is already normalized to [-100, 100]
    // This maintains backward compatibility
    x = 50 + (position.x / 2);
    y = 50 + (position.y / 2);
  }
  
  // Clamp to valid CSS range
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));
  
  return `${x}% ${y}%`;
}


/**
 * Calculate image overflow in renderer (how much image extends beyond circle)
 * This is used to convert position percentages to pixel offsets
 */
export function calculateRendererImageOverflow(
  imageDimensions: ImageDimensions,
  imageRadius: number,
  zoom: number
): { overflowX: number; overflowY: number } {
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const circleDiameter = imageRadius * 2;
  
  // Calculate cover scale (same as in step 1)
  const coverScale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  
  // Apply zoom
  const zoomMultiplier = 1 + (zoom / 100);
  const zoomedScale = coverScale * zoomMultiplier;
  
  // Calculate scaled dimensions
  const scaledWidth = imgWidth * zoomedScale;
  const scaledHeight = imgHeight * zoomedScale;
  
  // Calculate overflow (how much extends beyond circle)
  const overflowX = (scaledWidth - circleDiameter) / 2;
  const overflowY = (scaledHeight - circleDiameter) / 2;
  
  return { overflowX, overflowY };
}

/**
 * Convert position to canvas drawing offset, using the EXACT same calculation as CSS background-position
 * 
 * This function replicates what CSS background-position does, but for canvas drawing.
 * We use the same positionToBackgroundPosition conversion, then apply CSS background-position math.
 * 
 * @param position - Position object with x and y percentages
 * @param imageDimensions - Natural image dimensions  
 * @param containerSize - Size of the container (circle diameter) in pixels
 * @param zoom - Zoom level (0-200)
 * @param limits - Position limits for normalization (same as used in step 1)
 * @returns Offset in pixels for canvas drawing (relative to container center)
 */
export function positionToRendererOffset(
  position: { x: number; y: number },
  imageDimensions: ImageDimensions,
  containerSize: number,
  zoom: number,
  limits: PositionLimits
): { x: number; y: number } {
  // Safety checks
  if (!imageDimensions || imageDimensions.width <= 0 || imageDimensions.height <= 0 || containerSize <= 0) {
    return { x: 0, y: 0 };
  }
  
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const circleDiameter = containerSize;
  
  // Calculate cover scale and zoom (same as step 1)
  const coverScale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  const zoomMultiplier = 1 + (zoom / 100);
  const zoomedScale = coverScale * zoomMultiplier;
  const scaledWidth = imgWidth * zoomedScale;
  const scaledHeight = imgHeight * zoomedScale;
  
  // Get CSS background-position using the SAME function as step 1
  const cssPosition = positionToBackgroundPosition(position, limits);
  const [cssX, cssY] = cssPosition.split(' ').map(p => parseFloat(p.replace('%', '')));
  
  // CSS background-position formula: leftEdge = (containerWidth - imageWidth) * (cssPercent / 100)
  // This gives us the left edge position relative to container's left edge
  const leftEdgeX = ((circleDiameter - scaledWidth) / 100) * cssX;
  const topEdgeY = ((circleDiameter - scaledHeight) / 100) * cssY;
  
  // Convert to center-relative offset for canvas
  // The container (circle) is centered in the canvas at canvasW/2
  // Container's left edge is at (canvasW - circleDiameter) / 2
  // Image's left edge in canvas coordinates: (canvasW - circleDiameter) / 2 + leftEdgeX
  // Image's center in canvas coordinates: (canvasW - circleDiameter) / 2 + leftEdgeX + scaledWidth/2
  // Offset from canvas center: imageCenter - canvasW/2
  // = (canvasW - circleDiameter)/2 + leftEdgeX + scaledWidth/2 - canvasW/2
  // = leftEdgeX + (scaledWidth - circleDiameter)/2
  const offsetX = leftEdgeX + (scaledWidth - circleDiameter) / 2;
  const offsetY = topEdgeY + (scaledHeight - circleDiameter) / 2;
  
  // Safety check for NaN/Infinity
  const safeX = isFinite(offsetX) ? offsetX : 0;
  const safeY = isFinite(offsetY) ? offsetY : 0;
  
  return { x: safeX, y: safeY };
}

/**
 * Calculate CSS background-size value that maintains cover behavior with zoom
 * 
 * @param imageDimensions - Natural image dimensions
 * @param circleSize - Size of the circular preview area in pixels
 * @param zoom - Zoom level (0-200, where 0 is no zoom)
 * @returns CSS background-size value ('cover' at 0% zoom, or percentage string)
 */
export function calculateBackgroundSize(
  imageDimensions: ImageDimensions | null,
  circleSize: number,
  zoom: number
): string {
  if (!imageDimensions) {
    return 'cover';
  }
  
  // At 0% zoom, use 'cover' for proper CSS behavior
  if (zoom === 0) {
    return 'cover';
  }
  
  const { width: imgWidth, height: imgHeight } = imageDimensions;
  const circleDiameter = circleSize;
  
  // Calculate cover scale (same as in calculatePositionLimits)
  const coverScale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  
  // CSS background-size percentage applies to the WIDTH of the image
  // The height is then scaled proportionally to maintain aspect ratio
  // 
  // For portrait: width fits at cover, so cover width = circleSize = 100%
  // For landscape: height fits at cover, so we need to calculate what width percentage gives us cover
  // 
  // At cover:
  // - Portrait: width = circleSize, so background-size = 100%
  // - Landscape: height = circleSize, width = imgWidth * (circleSize / imgHeight), so background-size = (imgWidth / imgHeight) * 100%
  
  let coverPercentage: number;
  if (imgWidth > imgHeight) {
    // Landscape: height fits, width extends
    // At cover: height = circleSize, width = imgWidth * (circleSize / imgHeight)
    // background-size percentage applies to width, so:
    // coverPercentage = (imgWidth * coverScale / circleDiameter) * 100 = (imgWidth / imgHeight) * 100
    const scaledWidth = imgWidth * coverScale;
    coverPercentage = (scaledWidth / circleDiameter) * 100;
  } else if (imgHeight > imgWidth) {
    // Portrait: width fits, height extends
    // At cover: width = circleSize, so background-size = 100%
    // The height scales proportionally automatically
    coverPercentage = 100;
  } else {
    // Square: both dimensions are the same, cover size is 100%
    coverPercentage = 100;
  }
  
  // Apply zoom multiplier: 0% zoom = 1x (cover), 100% zoom = 2x, 200% zoom = 3x
  // This scales the cover size by the zoom amount
  const zoomMultiplier = 1 + (zoom / 100);
  const finalPercentage = coverPercentage * zoomMultiplier;
  
  return `${finalPercentage}%`;
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
