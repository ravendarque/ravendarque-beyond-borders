/**
 * Unit tests for flag pattern generation
 */

import { describe, it, expect } from 'vitest';
import { generateFlagPatternStyle } from '@/utils/flagPattern';
import type { FlagSpec } from '@/flags/schema';

describe('generateFlagPatternStyle', () => {
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
