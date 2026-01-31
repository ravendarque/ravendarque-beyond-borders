/**
 * Utility for capturing the adjusted image from Step 1
 *
 * This captures the visible circle area as a high-resolution image,
 * matching exactly what the user sees in Step 1, for use in Step 3.
 */

import type { ImagePosition, ImageDimensions } from './imagePosition';
import { calculatePositionLimits, positionToBackgroundPosition } from './imagePosition';
import { IMAGE_CONSTANTS } from '@/constants';

/**
 * Capture the adjusted image at the specified resolution
 *
 * @param imageUrl - Original image URL (data URL or blob URL)
 * @param position - Current image position (x, y, zoom)
 * @param circleSize - Size of the circular preview area in pixels (from Step 1)
 * @param imageDimensions - Natural image dimensions
 * @param outputSize - Output image size in pixels (default: IMAGE_CONSTANTS.DEFAULT_CAPTURE_SIZE)
 * @returns Promise that resolves to a data URL of the captured image
 */
export async function captureAdjustedImage(
  imageUrl: string,
  position: ImagePosition,
  circleSize: number,
  imageDimensions: ImageDimensions,
  outputSize: number = IMAGE_CONSTANTS.DEFAULT_CAPTURE_SIZE,
): Promise<string> {
  // Create canvas at high resolution
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Load original image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageUrl;
  });

  // Calculate scale and position (same logic as Step 1)
  // Use imageDimensions parameter to match how dimensions are detected in Step 1
  // This ensures consistency, especially for portrait images with EXIF orientation
  // where img.width/height might differ from naturalWidth/naturalHeight
  const circleDiameter = circleSize;
  const imgWidth = imageDimensions.width;
  const imgHeight = imageDimensions.height;
  const coverScale = Math.max(circleDiameter / imgWidth, circleDiameter / imgHeight);
  const zoomMultiplier = 1 + position.zoom / 100;
  const scale = coverScale * zoomMultiplier;
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Calculate position limits for normalization (same as Step 1)
  const limits = calculatePositionLimits(imageDimensions, circleSize, position.zoom);
  // Calculate max limits (at zoom 200%) for consistent position mapping
  const maxLimits = calculatePositionLimits(imageDimensions, circleSize, 200);

  // Convert position to CSS background-position (same as Step 1)
  const cssPos = positionToBackgroundPosition({ x: position.x, y: position.y }, limits, maxLimits);
  const [cssX, cssY] = cssPos.split(' ').map((p) => parseFloat(p.replace('%', '')));

  // Scale calculations for output size (convert from Step 1 circleSize to outputSize)
  const scaleFactor = outputSize / circleDiameter;
  const scaledOutputWidth = scaledWidth * scaleFactor;
  const scaledOutputHeight = scaledHeight * scaleFactor;

  // Calculate position offset (convert from CSS percentage to pixels)
  // CSS background-position formula: leftEdge = (containerWidth - imageWidth) * (cssPercent / 100)
  const leftEdgeX = ((outputSize - scaledOutputWidth) / 100) * cssX;
  const topEdgeY = ((outputSize - scaledOutputHeight) / 100) * cssY;

  // Draw image with circular clip
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();

  // Draw the image at the calculated position
  ctx.drawImage(img, leftEdgeX, topEdgeY, scaledOutputWidth, scaledOutputHeight);

  // Return as data URL
  return canvas.toDataURL('image/png');
}
