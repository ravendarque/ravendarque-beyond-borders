/**
 * Unit tests for flag pattern generation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateFlagPatternStyle } from '@/utils/flagPattern';
import type { FlagSpec } from '@/flags/schema';

// Mock OffscreenCanvas
class MockOffscreenCanvas {
  width = 0;
  height = 0;
  private ctx: any;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ctx = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      beginPath: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      fillStyle: '',
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
    };
  }

  getContext(_type: '2d') {
    return this.ctx;
  }

  async convertToBlob() {
    return new Blob(['mock'], { type: 'image/png' });
  }
}

describe('generateFlagPatternStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock OffscreenCanvas
    global.OffscreenCanvas = MockOffscreenCanvas as any;
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });
  const mockFlag: FlagSpec = {
    id: 'test',
    displayName: 'Test Flag',
    png_full: null,
    modes: {
      ring: {
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      },
    },
  };

  it('should generate ring pattern with canvas blob URL', async () => {
    const result = await generateFlagPatternStyle({
      flag: mockFlag,
      presentation: 'ring',
      thicknessPct: 10,
      wrapperSize: 400,
      circleSize: 360,
    });

    expect(result.backgroundImage).toBeTruthy();
    expect(result.backgroundImage).toContain('url(');
    expect(result.backgroundImage).not.toBe('none');
    expect(result.backgroundImage).not.toBe('transparent');
  });

  it('should return none for ring mode with no colors', async () => {
    const flagNoColors: FlagSpec = {
      id: 'test',
      displayName: 'Test Flag',
      png_full: null,
      modes: {
        ring: {
          colors: [],
        },
      },
    };

    const result = await generateFlagPatternStyle({
      flag: flagNoColors,
      presentation: 'ring',
      thicknessPct: 10,
      wrapperSize: 400,
      circleSize: 360,
    });

    expect(result.backgroundImage).toBe('none');
  });

  it('should handle zero annulus thickness', async () => {
    const result = await generateFlagPatternStyle({
      flag: mockFlag,
      presentation: 'ring',
      thicknessPct: 0,
      wrapperSize: 400,
      circleSize: 400,
    });

    expect(result.backgroundImage).toBe('none');
  });
});
