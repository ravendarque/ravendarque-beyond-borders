/**
 * useAvatarPreview — live preview hook using the persistent WebGL renderer
 *
 * Architecture:
 * - LiveAvatarRenderer is created ONCE on mount (context + shaders compiled once)
 * - render() draws directly to a visible <canvas> element via transferToImageBitmap()
 * - Zero blob encoding, zero object URL creation/revocation — instant visual updates
 * - Falls back to Canvas 2D renderAvatar() → canvas draw when WebGL is unavailable
 *
 * Separation of concerns:
 * - useAvatarPreview  → live preview  (this hook, canvas-based, no blob)
 * - useAvatarRenderer → export/save   (one-shot blob for download)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { renderAvatar } from '@/renderer/render';
import { LiveAvatarRenderer } from '@/renderer/live-renderer';
import type { LiveRenderOptions } from '@/renderer/live-renderer';
import { FlagDataError, normalizeError } from '@/types/errors';
import { getAssetUrl } from '@/config';
import { RENDER_SIZES } from '@/constants';
import type { FlagSpec } from '@/flags/schema';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import { positionToRendererOffset, calculatePositionLimits } from '@/utils/imagePosition';

export interface PreviewOptions {
  thickness: number;
  flagOffsetPct: number;
  presentation: 'ring' | 'segment' | 'cutout';
  segmentRotation?: number;
  imagePosition: ImagePosition;
  imageDimensions: ImageDimensions;
  circleSize: number;
}

export function useAvatarPreview(flagsList: FlagSpec[], flagImageCache: Map<string, ImageBitmap>) {
  /** Ref to the visible <canvas> element rendered by AvatarPreviewCanvas */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Persistent WebGL renderer — null until mounted, null if WebGL unavailable */
  const rendererRef = useRef<LiveAvatarRenderer | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  /** True = last render used WebGL, false = Canvas 2D fallback, null = no render yet */
  const [lastRenderUsedWebGL, setLastRenderUsedWebGL] = useState<boolean | null>(null);

  /**
   * Cache the last decoded ImageBitmap by URL.
   * When only slider values change (same image URL), we skip the fetch+decode entirely.
   */
  const lastImageRef = useRef<{ url: string; bitmap: ImageBitmap } | null>(null);

  /** Render ID — incremented on each render call to discard stale results */
  const renderIdRef = useRef(0);

  // Initialise the persistent renderer once
  useEffect(() => {
    if (!LiveAvatarRenderer.isSupported()) return;
    try {
      rendererRef.current = new LiveAvatarRenderer(RENDER_SIZES.PREVIEW);
    } catch {
      // WebGL init failed — will use Canvas 2D fallback
    }
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);

  const render = useCallback(
    async (imageUrl: string, flagId: string, options: PreviewOptions) => {
      // Signal E2E tests that a render has started
      try {
        window.__BB_UPLOAD_DONE__ = false;
        window.__BB_RENDER_STAGE__ = 'start';
        window.__BB_RENDER_ERROR__ = undefined;
      } catch {
        // ignore
      }

      if (!imageUrl || !flagId) {
        setIsRendering(false);
        return;
      }

      const thisId = ++renderIdRef.current;
      setIsRendering(true);

      try {
        // Decode image — skip fetch+decode when same URL (slider drag loop)
        let img: ImageBitmap;
        if (lastImageRef.current?.url === imageUrl) {
          img = lastImageRef.current.bitmap;
        } else {
          try {
            window.__BB_RENDER_STAGE__ = 'fetch_start';
          } catch {}
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          try {
            window.__BB_RENDER_STAGE__ = 'createImageBitmap_start';
          } catch {}
          img = await createImageBitmap(blob);
          try {
            window.__BB_RENDER_STAGE__ = 'createImageBitmap_done';
          } catch {}
          // Close old cached bitmap before replacing
          lastImageRef.current?.bitmap.close();
          lastImageRef.current = { url: imageUrl, bitmap: img };
        }

        // Abort if a newer render was triggered while we were loading
        if (thisId !== renderIdRef.current) return;

        const flag = flagsList.find((f) => f.id === flagId);
        if (!flag) throw FlagDataError.patternMissing(flagId);

        // Load flag PNG for cutout mode (cached)
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
          if (thisId !== renderIdRef.current) return;
        }

        // Build the same offset/zoom that render.ts uses
        const size = RENDER_SIZES.PREVIEW;
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

        const liveOptions: LiveRenderOptions = {
          thicknessPct: options.thickness,
          imageOffsetPx,
          imageZoom: options.imagePosition.zoom,
          circleSize: options.circleSize,
          originalImageDimensions: options.imageDimensions,
          flagOffsetPct: { x: options.flagOffsetPct, y: 0 },
          presentation: options.presentation,
          segmentRotation: options.segmentRotation,
          borderImageBitmap,
        };

        try {
          window.__BB_RENDER_STAGE__ = 'renderAvatar_start';
        } catch {}

        const canvas = canvasRef.current;
        if (!canvas) {
          setIsRendering(false);
          return;
        }

        if (rendererRef.current) {
          // === WebGL path — synchronous draw, no blob ===
          const bitmap = rendererRef.current.render(img, flag, liveOptions);

          if (thisId !== renderIdRef.current) {
            bitmap.close();
            return;
          }

          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.clearRect(0, 0, canvas.width, canvas.height);
            ctx2d.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          }
          bitmap.close();
          setLastRenderUsedWebGL(true);
        } else {
          // === Canvas 2D fallback — still drawn directly to canvas, no CSS background-image ===
          const result = await renderAvatar(img, flag, {
            size: RENDER_SIZES.PREVIEW,
            thicknessPct: options.thickness,
            imageOffsetPx,
            imageZoom: options.imagePosition.zoom,
            circleSize: options.circleSize,
            originalImageDimensions: options.imageDimensions,
            flagOffsetPct: { x: options.flagOffsetPct, y: 0 },
            presentation: options.presentation,
            segmentRotation: options.segmentRotation,
            backgroundColor: null,
            borderImageBitmap,
          });

          if (thisId !== renderIdRef.current) return;

          const fallbackBitmap = await createImageBitmap(result.blob);
          const ctx2d = canvas.getContext('2d');
          if (ctx2d) {
            ctx2d.clearRect(0, 0, canvas.width, canvas.height);
            ctx2d.drawImage(fallbackBitmap, 0, 0, canvas.width, canvas.height);
          }
          fallbackBitmap.close();
          setLastRenderUsedWebGL(false);
        }

        setIsRendering(false);

        try {
          window.__BB_RENDER_STAGE__ = 'done';
          window.__BB_UPLOAD_DONE__ = true;
        } catch {}
      } catch (err) {
        if (thisId !== renderIdRef.current) return;
        setIsRendering(false);
        try {
          window.__BB_RENDER_STAGE__ = 'error';
          window.__BB_RENDER_ERROR__ = err instanceof Error ? err.message : String(err);
        } catch {}

        const appError = normalizeError(err);
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Preview render failed:', appError.toJSON());
        }
        throw appError;
      }
    },
    [flagsList, flagImageCache],
  );

  // Cleanup cached bitmap on unmount
  useEffect(() => {
    return () => {
      lastImageRef.current?.bitmap.close();
      lastImageRef.current = null;
    };
  }, []);

  return { canvasRef, render, isRendering, lastRenderUsedWebGL };
}
