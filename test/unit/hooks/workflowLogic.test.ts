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

    it('should return false when not in cutout mode', () => {
      const result = shouldResetFlagOffset(3, 'ring', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(false);
    });

    it('should return true when first time configuring', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
    });

    it('should return true when flag changed', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'new-flag', 'old-flag', mockFlag);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(25);
    });

    it('should return false when flag unchanged', () => {
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', 'test-flag', mockFlag);
      expect(result.shouldReset).toBe(false);
    });

    it('should default to 0 when flag has no cutout config', () => {
      const flagWithoutCutout = { ...mockFlag, modes: {} } as FlagSpec;
      const result = shouldResetFlagOffset(3, 'cutout', 'test-flag', null, flagWithoutCutout);
      expect(result.shouldReset).toBe(true);
      expect(result.defaultOffset).toBe(0);
    });
  });
});
