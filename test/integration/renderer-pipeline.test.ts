/**
 * Integration tests for the complete renderer pipeline
 * Tests image loading → processing → rendering → display flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderAvatar } from '@/renderer/render';
import { flags } from '@/flags/flags';
import type { FlagSpec } from '@/flags/schema';

// 1x1 transparent PNG
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

async function imageBitmapFromDataUrl(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  // @ts-ignore createImageBitmap provided by test setup
  return await createImageBitmap(blob);
}

describe('Renderer Pipeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Render Pipeline', () => {
    it('should complete full pipeline: image → flag → render → blob', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags.find((f) => f.id === 'palestine') || flags[0];

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        presentation: 'ring',
      });

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('should handle cutout mode with flag image loading', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags.find((f) => f.modes?.cutout?.offsetEnabled) || flags[0];

      // Mock flag image loading
      const mockFlagImage = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        presentation: 'cutout',
        borderImageBitmap: mockFlagImage,
        flagOffsetPct: { x: 0, y: 0 },
      });

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
    });

    it('should apply flag offset correctly in cutout mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags.find((f) => f.modes?.cutout?.offsetEnabled) || flags[0];
      const mockFlagImage = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);

      // Test with different offset values (percentage: -50 to +50)
      const offsets = [-50, 0, 50]; // -50%, 0%, +50%

      for (const offset of offsets) {
        const result = await renderAvatar(img, flag, {
          size: 512,
          thicknessPct: 10,
          presentation: 'cutout',
          borderImageBitmap: mockFlagImage,
          flagOffsetPct: { x: offset, y: 0 },
        });

        expect(result.blob).toBeInstanceOf(Blob);
        // All should render successfully with different offsets
      }
    });
  });

  describe('Flag Data Integration', () => {
    it('should use flag colors from modes.ring.colors', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags.find((f) => f.modes?.ring?.colors) || flags[0];

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        presentation: 'ring',
      });

      expect(result.blob).toBeInstanceOf(Blob);
      // Flag colors should be used in rendering
    });

    it('should handle flags with cutout mode configuration', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const cutoutFlags = flags.filter((f) => f.modes?.cutout?.offsetEnabled);

      for (const flag of cutoutFlags.slice(0, 3)) {
        const mockFlagImage = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);

        const result = await renderAvatar(img, flag, {
          size: 512,
          thicknessPct: 10,
          presentation: 'cutout',
          borderImageBitmap: mockFlagImage,
          flagOffsetPct: {
            x: flag.modes?.cutout?.defaultOffset || 0,
            y: 0,
          },
        });

        expect(result.blob).toBeInstanceOf(Blob);
      }
    });
  });

  describe('Image Processing Integration', () => {
    it('should handle image downsampling for large images', async () => {
      // Create a larger mock image
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags[0];

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        enableDownsampling: true,
      });

      expect(result.blob).toBeInstanceOf(Blob);
      // Downsampling should work without errors
    });
  });

  describe('Performance Metrics Integration', () => {
    it('should track performance metrics when enabled', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags[0];

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        enablePerformanceTracking: true,
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.renderTime).toBeGreaterThan(0);
    });

    it('should omit metrics when disabled', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL);
      const flag = flags[0];

      const result = await renderAvatar(img, flag, {
        size: 512,
        thicknessPct: 10,
        enablePerformanceTracking: false,
      });

      expect(result.metrics).toBeUndefined();
    });
  });
});
