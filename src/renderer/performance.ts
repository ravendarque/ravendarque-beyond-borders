/**
 * Performance utilities for renderer optimization
 * Includes image downsampling, metrics tracking, and optimization helpers
 */

/**
 * Performance metrics for a render operation
 */
export interface RenderMetrics {
  /** Total render time in milliseconds */
  totalTime: number;
  /** Time to load and prepare image */
  imageLoadTime: number;
  /** Time to render to canvas */
  renderTime: number;
  /** Time to export blob */
  exportTime: number;
  /** Input image dimensions */
  inputSize: { width: number; height: number };
  /** Output canvas dimensions */
  outputSize: { width: number; height: number };
  /** Whether image was downsampled */
  wasDownsampled: boolean;
  /** Downsampling ratio if applied */
  downsampleRatio?: number;
  /** Memory usage estimate (bytes) */
  estimatedMemory: number;
}

/**
 * Performance tracker for render operations
 */
export class RenderPerformanceTracker {
  private startTime: number = 0;
  private marks: Map<string, number> = new Map();
  
  /**
   * Start tracking performance
   */
  start(): void {
    this.startTime = performance.now();
    this.marks.clear();
  }
  
  /**
   * Mark a performance milestone
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  /**
   * Get time elapsed since start
   */
  elapsed(): number {
    return performance.now() - this.startTime;
  }
  
  /**
   * Get time between two marks
   */
  duration(startMark: string, endMark: string): number {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    if (start === undefined || end === undefined) {
      return 0;
    }
    return end - start;
  }
  
  /**
   * Complete tracking and return metrics
   */
  complete(
    inputSize: { width: number; height: number },
    outputSize: { width: number; height: number },
    wasDownsampled: boolean,
    downsampleRatio?: number
  ): RenderMetrics {
    const totalTime = this.elapsed();
    const imageLoadTime = this.duration('start', 'imageLoaded');
    const renderTime = this.duration('imageLoaded', 'renderComplete');
    const exportTime = this.duration('renderComplete', 'exportComplete');
    
    // Estimate memory usage
    // Input: width * height * 4 bytes (RGBA)
    // Output: width * height * 4 bytes
    // Plus overhead for canvas context, etc.
    const inputMemory = inputSize.width * inputSize.height * 4;
    const outputMemory = outputSize.width * outputSize.height * 4;
    const estimatedMemory = inputMemory + outputMemory;
    
    return {
      totalTime,
      imageLoadTime,
      renderTime,
      exportTime,
      inputSize,
      outputSize,
      wasDownsampled,
      downsampleRatio,
      estimatedMemory,
    };
  }
}

/**
 * Calculate optimal downsample size for image
 * @param width Input image width
 * @param height Input image height
 * @param targetSize Target output size (512 or 1024)
 * @param maxScale Maximum scale factor (default: 2x)
 * @returns Optimal dimensions for downsampling
 */
export function calculateDownsampleSize(
  width: number,
  height: number,
  targetSize: number,
  maxScale = 2
): { width: number; height: number; scale: number } {
  // Maximum intermediate size (2x target by default)
  const maxSize = targetSize * maxScale;
  
  // If image is already small enough, don't downsample
  if (width <= maxSize && height <= maxSize) {
    return { width, height, scale: 1 };
  }
  
  // Calculate scale to fit within maxSize
  const scale = Math.min(maxSize / width, maxSize / height);
  
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
}

/**
 * Downsample an image to reduce memory usage
 * Uses canvas for high-quality scaling
 * @param image Input image
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Downsampled ImageBitmap
 */
export async function downsampleImage(
  image: ImageBitmap,
  targetWidth: number,
  targetHeight: number
): Promise<ImageBitmap> {
  // If no downsampling needed, return original
  if (image.width === targetWidth && image.height === targetHeight) {
    return image;
  }
  
  // Create temporary canvas for downsampling
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context for downsampling');
  }
  
  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw scaled image
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  
  // Create ImageBitmap from scaled canvas
  return createImageBitmap(canvas);
}

/**
 * Check if image should be downsampled based on size
 * @param width Image width
 * @param height Image height
 * @param targetSize Target output size
 * @param threshold Threshold multiplier (default: 2x)
 * @returns True if image should be downsampled
 */
export function shouldDownsample(
  width: number,
  height: number,
  targetSize: number,
  threshold = 2
): boolean {
  const maxDimension = Math.max(width, height);
  return maxDimension > targetSize * threshold;
}

/**
 * Estimate memory usage for rendering operation
 * @param imageWidth Input image width
 * @param imageHeight Input image height
 * @param outputSize Output canvas size
 * @returns Estimated memory in bytes
 */
export function estimateMemoryUsage(
  imageWidth: number,
  imageHeight: number,
  outputSize: number
): number {
  // Input image: width * height * 4 bytes (RGBA)
  const inputMemory = imageWidth * imageHeight * 4;
  
  // Output canvas: size * size * 4 bytes
  const outputMemory = outputSize * outputSize * 4;
  
  // Temporary canvases and processing overhead: estimate 50% extra
  const overhead = (inputMemory + outputMemory) * 0.5;
  
  return inputMemory + outputMemory + overhead;
}

/**
 * Format memory size as human-readable string
 * @param bytes Memory size in bytes
 * @returns Formatted string (e.g., "12.5 MB")
 */
export function formatMemorySize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

/**
 * Format render metrics as human-readable string
 * @param metrics Render metrics
 * @returns Formatted string
 */
export function formatRenderMetrics(metrics: RenderMetrics): string {
  const lines = [
    `Total time: ${metrics.totalTime.toFixed(0)}ms`,
    `  Image load: ${metrics.imageLoadTime.toFixed(0)}ms`,
    `  Render: ${metrics.renderTime.toFixed(0)}ms`,
    `  Export: ${metrics.exportTime.toFixed(0)}ms`,
    `Input size: ${metrics.inputSize.width}x${metrics.inputSize.height}`,
    `Output size: ${metrics.outputSize.width}x${metrics.outputSize.height}`,
  ];
  
  if (metrics.wasDownsampled) {
    lines.push(`Downsampled: ${(metrics.downsampleRatio! * 100).toFixed(0)}%`);
  }
  
  lines.push(`Memory: ${formatMemorySize(metrics.estimatedMemory)}`);
  
  return lines.join('\n');
}

/**
 * Log render metrics to console (development only)
 * @param metrics Render metrics
 */
export function logRenderMetrics(metrics: RenderMetrics): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // eslint-disable-next-line no-console
  console.group('🎨 Render Performance');
  // eslint-disable-next-line no-console
  console.log(formatRenderMetrics(metrics));
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * Check if device is low-end based on available memory
 * Uses navigator.deviceMemory if available
 * @returns True if device appears to be low-end
 */
export function isLowEndDevice(): boolean {
  // Check if deviceMemory API is available
  if ('deviceMemory' in navigator) {
    // TypeScript doesn't have this in types yet
    const memory = (navigator as { deviceMemory?: number }).deviceMemory;
    // Consider devices with <= 2GB RAM as low-end
    return memory !== undefined && memory <= 2;
  }
  
  // Fallback: check if running on mobile
  // This is a heuristic and not always accurate
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  return isMobile;
}

/**
 * Get recommended render settings for device
 * @returns Recommended max scale and quality settings
 */
export function getRecommendedSettings(): {
  maxScale: number;
  enableDownsampling: boolean;
  estimatedMaxSize: number;
} {
  const isLowEnd = isLowEndDevice();
  
  if (isLowEnd) {
    return {
      maxScale: 1.5, // More aggressive downsampling
      enableDownsampling: true,
      estimatedMaxSize: 1024, // Limit to 1024x1024
    };
  }
  
  return {
    maxScale: 2, // Standard 2x downsampling
    enableDownsampling: true,
    estimatedMaxSize: 2048, // Allow up to 2048x2048
  };
}

/**
 * Warm up canvas rendering (preload shaders, etc.)
 * Call this during app initialization to improve first render performance
 */
export async function warmUpRenderer(): Promise<void> {
  try {
    // Create a small test canvas
    const canvas = new OffscreenCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Draw some basic shapes to initialize rendering pipeline
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Export to blob to initialize image encoding
    await canvas.convertToBlob({ type: 'image/png' });
  } catch {
    // Ignore errors during warm-up
    // This is a best-effort optimization
  }
}
