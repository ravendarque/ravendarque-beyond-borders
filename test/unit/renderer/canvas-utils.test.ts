import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCanvasSize,
  getMaxCanvasSize,
  createCanvas,
  supportsOffscreenCanvas,
  isValidHexColor,
  normalizeHexColor,
  computeImageDrawRect,
  CANVAS_LIMITS,
} from '@/renderer/canvas-utils';

describe('canvas-utils', () => {
  describe('validateCanvasSize', () => {
    it('should not throw for valid canvas size', () => {
      expect(() => validateCanvasSize(512, 512)).not.toThrow();
      expect(() => validateCanvasSize(1024, 1024)).not.toThrow();
      expect(() => validateCanvasSize(2048, 2048)).not.toThrow();
    });

    it('should throw for oversized canvas', () => {
      // Try to create a canvas larger than the default limit (4096x4096)
      expect(() => validateCanvasSize(10000, 10000)).toThrow(/exceeds.*limit/);
    });

    it('should include browser type in error message', () => {
      try {
        validateCanvasSize(20000, 20000);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toMatch(/chrome|firefox|safari|default/);
      }
    });

    it('should include requested size in error message', () => {
      try {
        validateCanvasSize(10000, 10000);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('10000x10000');
      }
    });
  });

  describe('getMaxCanvasSize', () => {
    it('should return a positive number', () => {
      const maxSize = getMaxCanvasSize();
      expect(maxSize).toBeGreaterThan(0);
    });

    it('should return a value from CANVAS_LIMITS', () => {
      const maxSize = getMaxCanvasSize();
      const limits = Object.values(CANVAS_LIMITS);
      expect(limits).toContain(maxSize);
    });

    it('should return default limit for unknown browser', () => {
      const maxSize = getMaxCanvasSize();
      expect(maxSize).toBeGreaterThanOrEqual(CANVAS_LIMITS.default);
    });
  });

  describe('createCanvas', () => {
    it('should create canvas with correct dimensions', () => {
      const { canvas } = createCanvas(256, 256);
      expect(canvas.width).toBe(256);
      expect(canvas.height).toBe(256);
    });

    it('should return canvas and context', () => {
      const { canvas, ctx } = createCanvas(512, 512);
      expect(canvas).toBeDefined();
      expect(ctx).toBeDefined();
      // Context should be defined (canvas property may not exist in mock)
      expect(typeof ctx).toBe('object');
    });

    it('should throw if dimensions exceed limits', () => {
      expect(() => createCanvas(20000, 20000)).toThrow(/exceeds.*limit/);
    });

    it('should handle different aspect ratios', () => {
      const { canvas: wideCanvas } = createCanvas(800, 600);
      expect(wideCanvas.width).toBe(800);
      expect(wideCanvas.height).toBe(600);

      const { canvas: tallCanvas } = createCanvas(600, 800);
      expect(tallCanvas.width).toBe(600);
      expect(tallCanvas.height).toBe(800);
    });
  });

  describe('supportsOffscreenCanvas', () => {
    it('should return a boolean', () => {
      const result = supportsOffscreenCanvas();
      expect(typeof result).toBe('boolean');
    });

    it('should return true in test environment with mock', () => {
      // Our test setup mocks OffscreenCanvas
      const result = supportsOffscreenCanvas();
      expect(result).toBe(true);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#00FF00')).toBe(true);
      expect(isValidHexColor('#0000FF')).toBe(true);
      expect(isValidHexColor('#ABCDEF')).toBe(true);
      expect(isValidHexColor('#123456')).toBe(true);
    });

    it('should validate 3-digit hex colors', () => {
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('#0F0')).toBe(true);
      expect(isValidHexColor('#00F')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
    });

    it('should accept lowercase hex colors', () => {
      expect(isValidHexColor('#ff0000')).toBe(true);
      expect(isValidHexColor('#abcdef')).toBe(true);
      expect(isValidHexColor('#f0a')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // Missing #
      expect(isValidHexColor('#GG0000')).toBe(false); // Invalid characters
      expect(isValidHexColor('#FF00')).toBe(false); // Wrong length (4)
      expect(isValidHexColor('#FF00000')).toBe(false); // Too long (7)
      expect(isValidHexColor('')).toBe(false); // Empty
      expect(isValidHexColor('#')).toBe(false); // Just #
    });

    it('should reject named colors', () => {
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('blue')).toBe(false);
      expect(isValidHexColor('green')).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('should expand 3-digit hex to 6-digit', () => {
      expect(normalizeHexColor('#F00')).toBe('#FF0000');
      expect(normalizeHexColor('#0F0')).toBe('#00FF00');
      expect(normalizeHexColor('#00F')).toBe('#0000FF');
      expect(normalizeHexColor('#ABC')).toBe('#AABBCC');
    });

    it('should preserve 6-digit hex colors', () => {
      expect(normalizeHexColor('#FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('#00FF00')).toBe('#00FF00');
      expect(normalizeHexColor('#0000FF')).toBe('#0000FF');
    });

    it('should convert to uppercase', () => {
      expect(normalizeHexColor('#ff0000')).toBe('#FF0000');
      expect(normalizeHexColor('#FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('#FfFfFf')).toBe('#FFFFFF');
    });

    it('should handle mixed case 3-digit colors', () => {
      expect(normalizeHexColor('#Fa0')).toBe('#FFAA00');
      expect(normalizeHexColor('#aBC')).toBe('#AABBCC');
    });
  });

  describe('CANVAS_LIMITS', () => {
    it('should have expected browser limits', () => {
      expect(CANVAS_LIMITS.chrome).toBe(16384 * 16384);
      expect(CANVAS_LIMITS.firefox).toBe(32767 * 32767);
      expect(CANVAS_LIMITS.safari).toBe(4096 * 4096);
      expect(CANVAS_LIMITS.default).toBe(4096 * 4096);
    });

    it('should have safari as most restrictive', () => {
      expect(CANVAS_LIMITS.safari).toBeLessThanOrEqual(CANVAS_LIMITS.chrome);
      expect(CANVAS_LIMITS.safari).toBeLessThanOrEqual(CANVAS_LIMITS.firefox);
      expect(CANVAS_LIMITS.safari).toBeLessThanOrEqual(CANVAS_LIMITS.default);
    });
  });

  describe('computeImageDrawRect', () => {
    // Regression coverage for a bug where render-webgl.ts uploaded the raw user image with
    // none of this scaling, so exports ignored Step 1's position/zoom/circleSize entirely.

    it('cover-scales a square image to exactly fill the target diameter when no circleSize is given', () => {
      const rect = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {});
      // target = imageRadius * 2 = 600, scale = 600/200 = 3 -> dw/dh = 600
      expect(rect.dw).toBeCloseTo(600);
      expect(rect.dh).toBeCloseTo(600);
      // Centered: dx = canvasSize/2 - dw/2 = 500 - 300 = 200
      expect(rect.dx).toBeCloseTo(200);
      expect(rect.dy).toBeCloseTo(200);
    });

    it('cover-scales a non-square image preserving aspect ratio (the exact bug this guards against)', () => {
      // A 400x200 (2:1) source must stay 2:1 in the output, not get stretched to whatever
      // the canvas/target happens to be.
      const rect = computeImageDrawRect({ width: 400, height: 200 }, 1000, 300, {});
      expect(rect.dw / rect.dh).toBeCloseTo(400 / 200);
    });

    it('applies imageOffsetPx to shift the center', () => {
      const base = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {});
      const shifted = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {
        imageOffsetPx: { x: 50, y: -30 },
      });
      expect(shifted.dx).toBeCloseTo(base.dx + 50);
      expect(shifted.dy).toBeCloseTo(base.dy - 30);
      // Offset must not affect scale
      expect(shifted.dw).toBeCloseTo(base.dw);
      expect(shifted.dh).toBeCloseTo(base.dh);
    });

    it('applies imageZoom as a multiplier on scale, relative to circleSize', () => {
      const noZoom = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {
        circleSize: 400,
      });
      const zoomed = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {
        circleSize: 400,
        imageZoom: 50, // +50%
      });
      expect(zoomed.dw).toBeCloseTo(noZoom.dw * 1.5);
      expect(zoomed.dh).toBeCloseTo(noZoom.dh * 1.5);
    });

    it('uses originalImageDimensions instead of the bitmap size when provided (Step 1 may have resized)', () => {
      // Bitmap is 200x200 but the original upload was 400x200 - cover-scale must be computed
      // against the original, matching what Step 1's circleSize/zoom sliders were set against.
      const rect = computeImageDrawRect({ width: 200, height: 200 }, 1000, 300, {
        circleSize: 400,
        originalImageDimensions: { width: 400, height: 200 },
      });
      const ref = computeImageDrawRect({ width: 400, height: 200 }, 1000, 300, {
        circleSize: 400,
      });
      // Same cover-scale factor should apply to whatever the actual bitmap dimensions are
      expect(rect.dw / 200).toBeCloseTo(ref.dw / 400, 3);
    });
  });
});
