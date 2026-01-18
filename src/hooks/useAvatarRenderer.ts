import { useState, useCallback, useRef, useEffect } from 'react';
import { renderAvatar } from '@/renderer/render';
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
export function useAvatarRenderer(
  flagsList: FlagSpec[],
  flagImageCache: Map<string, ImageBitmap>
) {
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
      const { size, thickness, flagOffsetPct, presentation, segmentRotation, bg, circleSize } = options;

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
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const img = await createImageBitmap(blob);

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

        // Calculate position offset for renderer
        // Use Step 1's circleSize (the circle the user actually sees and adjusts)
        // This ensures position/zoom match what the user set in Step 1
        const limits = calculatePositionLimits(
          options.imageDimensions,
          circleSize, // Use Step 1 circle size (what user sees)
          options.imagePosition.zoom
        );
        const imageOffset = positionToRendererOffset(
          { x: options.imagePosition.x, y: options.imagePosition.y },
          options.imageDimensions,
          circleSize, // Use Step 1 circle size (what user sees)
          options.imagePosition.zoom,
          limits
        );

        // Render avatar with flag border
        // Pass position/zoom directly to renderer - no capture needed
        const result = await renderAvatar(img, transformedFlag, {
          size,
          thicknessPct: thickness,
          imageOffsetPx: imageOffset,
          imageZoom: options.imagePosition.zoom,
          flagOffsetPct: { x: flagOffsetPct, y: 0 }, // Use flagOffsetPct for cutout mode
          presentation,
          segmentRotation,
          backgroundColor: bg === 'transparent' ? null : bg,
          borderImageBitmap: flagImageBitmap,
        });

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
          window.__BB_UPLOAD_DONE__ = true;
        } catch {
          // Ignore errors setting test hooks
        }
      } catch (err) {
        // Clear loading state on error
        setIsRendering(false);
        
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
    [flagsList, flagImageCache]
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
