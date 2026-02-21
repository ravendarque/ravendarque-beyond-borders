import { useState, useCallback, useRef, useEffect } from 'react';
import { renderAvatar } from '@/renderer/render';
import { renderAvatarWebGL } from '@/renderer/render-webgl';
import { isWebGLSupported } from '@/renderer/webgl-utils';
import type { FlagSpec } from '@/flags/schema';
import { FlagDataError, normalizeError } from '@/types/errors';
import { getAssetUrl } from '@/config';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import { positionToRendererOffset, calculatePositionLimits } from '@/utils/imagePosition';

export interface RenderOptions {
  size: 512 | 1024;
  thickness: number;
  flagOffsetPct: number; // Percentage: -50 to +50
  presentation: 'ring' | 'segment' | 'cutout';
  segmentRotation?: number;
  bg: string | 'transparent';
  imagePosition: ImagePosition;
  imageDimensions: ImageDimensions;
  circleSize: number; // Circle size from Step 1 (for accurate position/zoom calculation)
}

/**
 * A custom hook that handles avatar rendering logic
 * @param flagsList - Array of available flags
 * @param flagImageCache - Cache map for flag ImageBitmaps
 * @returns Rendering state and functions
 */
export function useAvatarRenderer(flagsList: FlagSpec[], flagImageCache: Map<string, ImageBitmap>) {
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Use ref to track overlayUrl for cleanup without adding to dependencies
  const overlayUrlRef = useRef<string | null>(null);

  // Keep ref in sync with state
  overlayUrlRef.current = overlayUrl;

  /**
   * Render avatar with flag border using the provided image URL
   * This function handles the complete rendering pipeline:
   * 1. Load and validate inputs (image, flag)
   * 2. Transform flag data to renderer format
   * 3. Call renderAvatar to generate the bordered image
   * 4. Update the overlay with the result
   */
  const render = useCallback(
    async (imageUrl: string, flagId: string, options: RenderOptions) => {
      const { size, thickness, flagOffsetPct, presentation, segmentRotation, bg, circleSize } =
        options;

      // E2E: clear render-done signal so tests wait for this run, not a stale value
      try {
        window.__BB_UPLOAD_DONE__ = false;
        window.__BB_RENDER_STAGE__ = 'start';
        window.__BB_RENDER_ERROR__ = undefined;
      } catch {
        // Ignore
      }

      // Exit early if no image
      if (!imageUrl) {
        setIsRendering(false);
        return;
      }

      // Clear overlay if no flag selected
      if (!flagId) {
        if (overlayUrlRef.current) {
          URL.revokeObjectURL(overlayUrlRef.current);
          setOverlayUrl(null);
        }
        setIsRendering(false);
        return;
      }

      try {
        // Show loading indicator at start of render process
        setIsRendering(true);

        // Find selected flag
        const flag = flagsList.find((f) => f.id === flagId);
        if (!flag) {
          throw FlagDataError.patternMissing(flagId);
        }

        // Load original image (not cropped - renderer will apply position/zoom)
        try {
          window.__BB_RENDER_STAGE__ = 'fetch_start';
        } catch {}
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        try {
          window.__BB_RENDER_STAGE__ = 'createImageBitmap_start';
        } catch {}
        const img = await createImageBitmap(blob);
        try {
          window.__BB_RENDER_STAGE__ = 'createImageBitmap_done';
        } catch {}

        // Transform flag data to format expected by renderAvatar
        const transformedFlag: FlagSpec = { ...flag };

        // Load flag PNG image for cutout mode (for accurate rendering of complex flags)
        // Use cache to avoid re-fetching the same flag image
        let flagImageBitmap: ImageBitmap | undefined;
        if (presentation === 'cutout' && flag.png_full) {
          const cacheKey = flag.png_full;

          // Check cache first
          if (flagImageCache.has(cacheKey)) {
            flagImageBitmap = flagImageCache.get(cacheKey);
          } else {
            // Fetch and cache the flag image
            const flagResponse = await fetch(getAssetUrl(`flags/${flag.png_full}`));
            const flagBlob = await flagResponse.blob();
            flagImageBitmap = await createImageBitmap(flagBlob);
            flagImageCache.set(cacheKey, flagImageBitmap);
          }
        }

        // Calculate the renderer's inner circle size (where the image is drawn)
        // Simple formula: inner circle diameter = canvas size - (border thickness * 2)
        const base = size;
        const thicknessPx = Math.round((thickness / 100) * base);
        const rendererCircleSize = size - thicknessPx * 2; // Inner circle diameter

        // Calculate position limits using step 1's circle size
        // Position percentages are relative to step 1's circle size, not the renderer's
        // This ensures the position normalization matches what step 1 uses
        const positionLimits = calculatePositionLimits(
          options.imageDimensions,
          circleSize, // Use step 1's circle size for limits calculation
          options.imagePosition.zoom,
        );

        // Calculate max limits (at zoom 200%) for consistent position mapping
        // This is needed for positionToBackgroundPosition to work correctly
        const maxLimits = calculatePositionLimits(options.imageDimensions, circleSize, 200);

        // Convert step 1 position adjustments to pixel offsets
        // IMPORTANT: Calculate offset for step 1's circle size first (where position is relative to)
        // Then scale it to the renderer's circle size
        const step1Offset = positionToRendererOffset(
          { x: options.imagePosition.x, y: options.imagePosition.y },
          options.imageDimensions,
          circleSize, // Calculate offset for step 1's circle size
          options.imagePosition.zoom,
          positionLimits,
          maxLimits,
        );

        // Scale the offset from step 1's circle size to renderer's circle size
        // This ensures the position mapping is correct when circle sizes differ
        const scaleFactor = rendererCircleSize / circleSize;
        const imageOffset = {
          x: step1Offset.x * scaleFactor,
          y: step1Offset.y * scaleFactor,
        };

        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Renderer offset calculation:', {
            position: options.imagePosition,
            circleSize,
            rendererCircleSize,
            thicknessPx,
            imageOffset,
            canvasSize: size,
            center: { x: size / 2, y: size / 2 },
            imageRadius: rendererCircleSize / 2,
          });
        }

        try {
          window.__BB_RENDER_STAGE__ = 'renderAvatar_start';
        } catch {}

        // Feature detection: Use WebGL if available, fallback to Canvas 2D
        const useWebGL = isWebGLSupported();

        // Log which renderer is being used
        console.log(
          `🎨 Rendering with: ${useWebGL ? 'WebGL (GPU-accelerated)' : 'Canvas 2D (CPU)'}`,
        );

        // Render avatar with flag border
        // Pass position/zoom directly to renderer - no capture needed
        let result;
        try {
          if (useWebGL) {
            result = await renderAvatarWebGL(img, transformedFlag, {
              size,
              thicknessPct: thickness,
              imageOffsetPx: imageOffset,
              imageZoom: options.imagePosition.zoom,
              circleSize: circleSize,
              originalImageDimensions: options.imageDimensions,
              flagOffsetPct: { x: flagOffsetPct, y: 0 },
              presentation,
              segmentRotation,
              backgroundColor: bg === 'transparent' ? null : bg,
              borderImageBitmap: flagImageBitmap,
            });
          } else {
            // Fallback to Canvas 2D for browsers without WebGL support
            result = await renderAvatar(img, transformedFlag, {
              size,
              thicknessPct: thickness,
              imageOffsetPx: imageOffset,
              imageZoom: options.imagePosition.zoom,
              circleSize: circleSize,
              originalImageDimensions: options.imageDimensions,
              flagOffsetPct: { x: flagOffsetPct, y: 0 },
              presentation,
              segmentRotation,
              backgroundColor: bg === 'transparent' ? null : bg,
              borderImageBitmap: flagImageBitmap,
            });
          }
        } catch (err) {
          // If WebGL fails, fallback to Canvas 2D
          if (useWebGL) {
            console.warn('WebGL rendering failed, falling back to Canvas 2D:', err);
            result = await renderAvatar(img, transformedFlag, {
              size,
              thicknessPct: thickness,
              imageOffsetPx: imageOffset,
              imageZoom: options.imagePosition.zoom,
              circleSize: circleSize,
              originalImageDimensions: options.imageDimensions,
              flagOffsetPct: { x: flagOffsetPct, y: 0 },
              presentation,
              segmentRotation,
              backgroundColor: bg === 'transparent' ? null : bg,
              borderImageBitmap: flagImageBitmap,
            });
          } else {
            throw err;
          }
        }

        // Create overlay URL from result blob
        const blobUrl = URL.createObjectURL(result.blob);

        // Clean up previous overlay
        if (overlayUrlRef.current) {
          URL.revokeObjectURL(overlayUrlRef.current);
        }

        setOverlayUrl(blobUrl);

        // Clear loading state after successful render
        setIsRendering(false);

        // Set test completion hook for E2E tests
        try {
          window.__BB_RENDER_STAGE__ = 'done';
          window.__BB_UPLOAD_DONE__ = true;
        } catch {
          // Ignore errors setting test hooks
        }
      } catch (err) {
        // Clear loading state on error
        setIsRendering(false);
        try {
          window.__BB_RENDER_STAGE__ = 'error';
          window.__BB_RENDER_ERROR__ = err instanceof Error ? err.message : String(err);
        } catch {}

        // Normalize and re-throw the error for the caller to handle
        const appError = normalizeError(err);

        // Development logging
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to render avatar:', appError.toJSON());
        }

        // Re-throw so caller (App.tsx) can display the error
        throw appError;
      }
    },
    [flagsList, flagImageCache],
  );

  // Cleanup: revoke object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (overlayUrlRef.current) {
        URL.revokeObjectURL(overlayUrlRef.current);
      }
    };
  }, []);

  return {
    overlayUrl,
    isRendering,
    render,
  };
}
