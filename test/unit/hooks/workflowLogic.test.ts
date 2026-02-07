import { describe, it, expect } from 'vitest';
import { shouldResetFlagOffset } from '@/hooks/workflowLogic';
import type { FlagSpec } from '@/flags/schema';

describe('workflowLogic', () => {
  describe('shouldResetFlagOffset', () => {
    const mockFlag: FlagSpec = {
      id: 'test-flag',
      name: 'Test Flag',
      category: 'test',
      modes: {
        cutout: {
          defaultOffset: 25,
        },
      },
    } as FlagSpec;

    it('should return false when not on Step 3', () => {
      const result = shouldResetFlagOffset(1, 'ring', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(false);
    });

    it('should return true when on step 3 and first time configuring (any mode) so step3 stays in sync', () => {
      const result = shouldResetFlagOffset(3, 'ring', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(0);
      expect(result.defaultThickness).toBeUndefined();
      expect(result.configKey).toBe('test-flag:ring');
    });

    it('should return true when first time configuring', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
      expect(result.configKey).toBe('test-flag:cutout');
    });

    it('should return true when flag changed', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'new-flag', 'old-flag:cutout', mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
    });

    it('should return false when flag and mode unchanged', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', 'test-flag:cutout', mockFlag);
      expect(result.shouldReset).toBe(false);
    });

    it('should return true when mode changes from ring to cutout (same flag)', () => {
      const flagWithThickness = {
        ...mockFlag,
        modes: { cutout: { defaultOffset: 25, defaultBorderThickness: 13 } },
      } as FlagSpec;
      const result = shouldResetFlagOffset(
        3,
        'cutout',
        'test-flag',
        'test-flag:ring',
        flagWithThickness,
      );
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
      expect(result.defaultThickness).toBe(13);
      expect(result.configKey).toBe('test-flag:cutout');
    });

    it('should return true when mode changes from cutout to ring (same flag)', () => {
      const result = shouldResetFlagOffset(3, 'ring', 'test-flag', 'test-flag:cutout', mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(0);
      expect(result.defaultThickness).toBeUndefined();
      expect(result.configKey).toBe('test-flag:ring');
    });

    it('should default to 0 when flag has no cutout config', () => {
      const flagWithoutCutout = { ...mockFlag, modes: {} } as FlagSpec;
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, flagWithoutCutout);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(0);
    });

    it('should return defaultThickness when flag cutout has defaultBorderThickness', () => {
      const flagWithThickness = {
        ...mockFlag,
        modes: { cutout: { defaultOffset: 25, defaultBorderThickness: 13 } },
      } as FlagSpec;
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, flagWithThickness);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
      expect(result.defaultThickness).toBe(13);
    });

    it('should return undefined defaultThickness when flag cutout has no defaultBorderThickness', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
      expect(result.defaultThickness).toBeUndefined();
    });
  });
});
