import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCanvasSize,
  getMaxCanvasSize,
  createCanvas,
  supportsOffscreenCanvas,
  isValidHexColor,
  normalizeHexColor,
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
});
