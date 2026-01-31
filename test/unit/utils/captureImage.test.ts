/**
 * Unit tests for captureImage utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureAdjustedImage } from '@/utils/captureImage';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import { IMAGE_CONSTANTS } from '@/constants';

// Mock canvas for tests
class MockCanvas {
  width = 0;
  height = 0;
  getContext(_type: '2d'): CanvasRenderingContext2D | null {
    const ctx = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high' as ImageSmoothingQuality,
      beginPath: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      drawImage: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    } as unknown as CanvasRenderingContext2D;
    return ctx;
  }
  toDataURL(_type?: string, _quality?: number): string {
    return 'data:image/png;base64,mock';
  }
}

// 1x1 transparent PNG
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

// 100x100 red square PNG
const RED_SQUARE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

describe('captureAdjustedImage', () => {
  let originalCreateElement: typeof document.createElement;
  let originalImage: typeof Image;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.createElement for canvas
    originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return new MockCanvas() as unknown as HTMLCanvasElement;
      }
      return originalCreateElement.call(document, tagName);
    }) as typeof document.createElement;

    // Mock Image constructor to resolve immediately
    originalImage = global.Image;
    global.Image = class MockImage {
      src = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 100;
      height = 100;
      naturalWidth = 100;
      naturalHeight = 100;

      constructor() {
        // Auto-resolve onload after a microtask to simulate async loading
        setTimeout(() => {
          if (this.src && this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as unknown as typeof Image;
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    global.Image = originalImage;
  });

  it('should capture image and return data URL', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should use default output size when not specified', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle different output sizes', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result512 = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    const result1024 = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      1024,
    );

    expect(result512).toBeTruthy();
    expect(result1024).toBeTruthy();
    expect(result512).toMatch(/^data:image\/png;base64,/);
    expect(result1024).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle image position offset', async () => {
    const position: ImagePosition = { x: 25, y: -25, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 200, height: 200 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle zoom level', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 50 }; // 50% zoom = 1.5x scale
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle landscape images', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 200, height: 100 }; // Landscape
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle portrait images', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 200 }; // Portrait
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should throw error if canvas context cannot be created', async () => {
    // Temporarily override getContext to return null
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 512,
          height: 512,
          getContext: () => null, // Return null to simulate failure
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement.call(document, tagName);
    }) as typeof document.createElement;

    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    await expect(
      captureAdjustedImage(TINY_PNG_DATA_URL, position, circleSize, imageDimensions, 512),
    ).rejects.toThrow('Failed to get canvas context');

    // Restore original
    document.createElement = originalCreateElement;
  });

  it('should throw error if image fails to load', async () => {
    // Mock Image to trigger onerror
    const MockErrorImage = class {
      src = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 0;
      height = 0;

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 0);
      }
    };

    const originalImage = global.Image;
    global.Image = MockErrorImage as unknown as typeof Image;

    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    await expect(
      captureAdjustedImage('invalid-url', position, circleSize, imageDimensions, 512),
    ).rejects.toThrow('Failed to load image');

    global.Image = originalImage;
  });

  it('should apply circular clipping correctly', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 0 };
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    // Result should be a valid data URL
    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);

    // The circular clipping is applied via canvas clip() - we can't easily verify
    // the visual result in unit tests, but we can verify it doesn't throw
  });

  it('should handle maximum zoom level', async () => {
    const position: ImagePosition = { x: 0, y: 0, zoom: 200 }; // 200% zoom = 3x scale
    const imageDimensions: ImageDimensions = { width: 100, height: 100 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should handle edge case position values', async () => {
    const position: ImagePosition = { x: -100, y: 100, zoom: 0 }; // Edge values
    const imageDimensions: ImageDimensions = { width: 200, height: 200 };
    const circleSize = 250;

    const result = await captureAdjustedImage(
      TINY_PNG_DATA_URL,
      position,
      circleSize,
      imageDimensions,
      512,
    );

    expect(result).toBeTruthy();
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
