import { useState, useCallback } from 'react';
import { renderAvatar } from '@/renderer/render';
import type { FlagSpec } from '@/flags/schema';

export interface RenderOptions {
  size: 512 | 1024;
  thickness: number;
  insetPct: number;
  flagOffsetX: number;
  presentation: 'ring' | 'segment' | 'cutout';
  bg: string | 'transparent';
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
      const { size, thickness, insetPct, flagOffsetX, presentation, bg } = options;

      // Exit early if no image
      if (!imageUrl) {
        setIsRendering(false);
        return;
      }

      // Clear overlay if no flag selected
      if (!flagId) {
        if (overlayUrl) {
          URL.revokeObjectURL(overlayUrl);
          setOverlayUrl(null);
        }
        setIsRendering(false);
        return;
      }

      try {
        // Find selected flag
        const flag = flagsList.find((f) => f.id === flagId);
        if (!flag) return;

        // Load image
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const img = await createImageBitmap(blob);

        // Transform flag data to format expected by renderAvatar
        const transformedFlag: FlagSpec = { ...flag };
        if ((flag as any).layouts?.[0]?.colors && !flag.pattern) {
          transformedFlag.pattern = {
            type: 'stripes' as const,
            stripes: (flag as any).layouts[0].colors.map((color: string) => ({
              color,
              weight: 1,
            })),
            orientation: 'horizontal' as const,
          };
        }

        // Load flag PNG image for cutout mode (for accurate rendering of complex flags)
        // Use cache to avoid re-fetching the same flag image
        let flagImageBitmap: ImageBitmap | undefined;
        if (presentation === 'cutout' && (flag as any).png_full) {
          const cacheKey = (flag as any).png_full;

          // Check cache first
          if (flagImageCache.has(cacheKey)) {
            flagImageBitmap = flagImageCache.get(cacheKey);
          } else {
            // Show loading indicator only when fetching flag image (not cached)
            setIsRendering(true);

            // Fetch and cache the flag image
            const flagResponse = await fetch(`/flags/${(flag as any).png_full}`);
            const flagBlob = await flagResponse.blob();
            flagImageBitmap = await createImageBitmap(flagBlob);
            flagImageCache.set(cacheKey, flagImageBitmap);

            setIsRendering(false);
          }
        }

        // Render avatar with flag border
        const resultBlob = await renderAvatar(img, transformedFlag, {
          size,
          thicknessPct: thickness,
          imageInsetPx: Math.round(((insetPct * -1) / 100) * size),
          imageOffsetPx: { x: Math.round(flagOffsetX), y: 0 },
          presentation,
          backgroundColor: bg === 'transparent' ? null : bg,
          borderImageBitmap: flagImageBitmap,
        });

        // Create overlay URL from result
        const blobUrl = URL.createObjectURL(resultBlob);

        // Clean up previous overlay
        if (overlayUrl) {
          URL.revokeObjectURL(overlayUrl);
        }

        setOverlayUrl(blobUrl);

        // Set test completion hook for E2E tests
        try {
          (window as any).__BB_UPLOAD_DONE__ = true;
        } catch {
          // Ignore errors setting test hooks
        }
      } catch (err) {
        // Silent fail - could add user-facing error handling here
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to render avatar:', err);
        }
        // Clear loading state on error
        setIsRendering(false);
      }
    },
    [flagsList, flagImageCache, overlayUrl]
  );

  return {
    overlayUrl,
    isRendering,
    render,
  };
}
