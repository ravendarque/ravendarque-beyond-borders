/**
 * useAvatarRenderer — export-only renderer hook
 *
 * Responsible solely for producing the final high-resolution PNG for download.
 * Called once when the user clicks Save — not on every slider change.
 *
 * Tries the WebGL renderer first (GPU anti-aliasing, faster on large 1024px exports),
 * falling back to the Canvas 2D renderer on any failure or when WebGL is unavailable —
 * the same fallback pattern used by useAvatarPreview for live preview. Returns the blob
 * URL so the caller can trigger a download.
 *
 * Separation of concerns:
 * - useAvatarPreview  → live preview  (persistent WebGL renderer → canvas draw, no blob)
 * - useAvatarRenderer → export/save   (one-shot WebGL, falls back to Canvas 2D → blob URL)
 */

import { useState, useCallback } from 'react';
import { renderAvatar } from '@/renderer/render';
import { renderAvatarWebGL } from '@/renderer/render-webgl';
import { isWebGLSupported } from '@/renderer/webgl-utils';
import type { RenderResult } from '@/renderer/render';
import type { FlagSpec } from '@/flags/schema';
import { FlagDataError, normalizeError } from '@/types/errors';
import { getAssetUrl } from '@/config';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import { positionToRendererOffset, calculatePositionLimits } from '@/utils/imagePosition';

export interface RenderOptions {
  size: 512 | 1024;
  thickness: number;
  flagOffsetPct: number;
  presentation: 'ring' | 'segment' | 'cutout';
  segmentRotation?: number;
  bg: string | 'transparent';
  imagePosition: ImagePosition;
  imageDimensions: ImageDimensions;
  circleSize: number;
}

/**
 * Render the avatar at export resolution and return a blob URL for download.
 * The caller is responsible for revoking the URL after use.
 */
export function useAvatarRenderer(flagsList: FlagSpec[], flagImageCache: Map<string, ImageBitmap>) {
  const [isRendering, setIsRendering] = useState(false);

  const render = useCallback(
    async (imageUrl: string, flagId: string, options: RenderOptions): Promise<string | null> => {
      if (!imageUrl || !flagId) return null;

      setIsRendering(true);
      try {
        const flag = flagsList.find((f) => f.id === flagId);
        if (!flag) throw FlagDataError.patternMissing(flagId);

        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const img = await createImageBitmap(blob);

        // Load flag PNG for cutout mode
        let borderImageBitmap: ImageBitmap | undefined;
        if (options.presentation === 'cutout' && flag.png_full) {
          const cacheKey = flag.png_full;
          if (flagImageCache.has(cacheKey)) {
            borderImageBitmap = flagImageCache.get(cacheKey);
          } else {
            const flagResponse = await fetch(getAssetUrl(`flags/${flag.png_full}`));
            const flagBlob = await flagResponse.blob();
            borderImageBitmap = await createImageBitmap(flagBlob);
            flagImageCache.set(cacheKey, borderImageBitmap);
          }
        }

        const { size } = options;
        const thicknessPx = Math.round((options.thickness / 100) * size);
        const rendererCircleSize = size - thicknessPx * 2;

        const positionLimits = calculatePositionLimits(
          options.imageDimensions,
          options.circleSize,
          options.imagePosition.zoom,
        );
        const maxLimits = calculatePositionLimits(options.imageDimensions, options.circleSize, 200);
        const step1Offset = positionToRendererOffset(
          { x: options.imagePosition.x, y: options.imagePosition.y },
          options.imageDimensions,
          options.circleSize,
          options.imagePosition.zoom,
          positionLimits,
          maxLimits,
        );
        const scaleFactor = rendererCircleSize / options.circleSize;
        const imageOffsetPx = {
          x: step1Offset.x * scaleFactor,
          y: step1Offset.y * scaleFactor,
        };

        const renderOptions = {
          size: size as 512 | 1024,
          thicknessPct: options.thickness,
          imageOffsetPx,
          imageZoom: options.imagePosition.zoom,
          circleSize: options.circleSize,
          originalImageDimensions: options.imageDimensions,
          flagOffsetPct: { x: options.flagOffsetPct, y: 0 },
          presentation: options.presentation,
          segmentRotation: options.segmentRotation,
          backgroundColor: options.bg === 'transparent' ? null : options.bg,
          borderImageBitmap,
        };

        let result: RenderResult;
        if (isWebGLSupported()) {
          try {
            // Note: renderAvatarWebGL doesn't composite backgroundColor (no UI currently
            // sets it to anything but 'transparent' — see AppStepWorkflow.tsx). If that
            // changes, the shaders need a background-fill pass before this can be relied on.
            result = await renderAvatarWebGL(img, flag, renderOptions);
          } catch (webglErr) {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.error('WebGL export failed, falling back to Canvas 2D:', webglErr);
            }
            result = await renderAvatar(img, flag, renderOptions);
          }
        } else {
          result = await renderAvatar(img, flag, renderOptions);
        }

        setIsRendering(false);
        return URL.createObjectURL(result.blob);
      } catch (err) {
        setIsRendering(false);
        const appError = normalizeError(err);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Export render failed:', appError.toJSON());
        }
        throw appError;
      }
    },
    [flagsList, flagImageCache],
  );

  return { render, isRendering };
}

/** @deprecated Import RenderOptions from useAvatarPreview or define locally */
export type { RenderOptions as ExportRenderOptions };
