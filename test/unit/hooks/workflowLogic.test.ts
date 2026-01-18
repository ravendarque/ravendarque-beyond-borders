import { describe, it, expect } from 'vitest';
import {
  shouldCaptureImage,
  shouldResetFlagOffset,
  shouldClearCroppedImage,
} from '@/hooks/workflowLogic';
import type { FlagSpec } from '@/flags/schema';

describe('workflowLogic', () => {
  describe('shouldCaptureImage', () => {
    it('should return false when not on Step 3', () => {
      const result = shouldCaptureImage(
        1,
        'data:image/png;base64,test',
        { width: 800, height: 600 },
        null,
        { x: 0, y: 0, zoom: 0 },
        null
      );
      expect(result).toBe(false);
    });

    it('should return false when no image URL', () => {
      const result = shouldCaptureImage(
        3,
        null,
        { width: 800, height: 600 },
        null,
        { x: 0, y: 0, zoom: 0 },
        null
      );
      expect(result).toBe(false);
    });

    it('should return true when no cropped image exists', () => {
      const result = shouldCaptureImage(
        3,
        'data:image/png;base64,test',
        { width: 800, height: 600 },
        null,
        { x: 0, y: 0, zoom: 0 },
        null
      );
      expect(result).toBe(true);
    });

    it('should return true when position changed', () => {
      const result = shouldCaptureImage(
        3,
        'data:image/png;base64,test',
        { width: 800, height: 600 },
        'data:image/png;base64,cropped',
        { x: 10, y: 20, zoom: 5 },
        { x: 0, y: 0, zoom: 0 }
      );
      expect(result).toBe(true);
    });

    it('should return false when position unchanged', () => {
      const position = { x: 10, y: 20, zoom: 5 };
      const result = shouldCaptureImage(
        3,
        'data:image/png;base64,test',
        { width: 800, height: 600 },
        'data:image/png;base64,cropped',
        position,
        position
      );
      expect(result).toBe(false);
    });
  });

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

  describe('shouldClearCroppedImage', () => {
    it('should return true when on Step 1', () => {
      const result = shouldClearCroppedImage(1, 'data:image/png;base64,test');
      expect(result).toBe(true);
    });

    it('should return true when image URL is null', () => {
      const result = shouldClearCroppedImage(3, null);
      expect(result).toBe(true);
    });

    it('should return false when on Step 3 with image', () => {
      const result = shouldClearCroppedImage(3, 'data:image/png;base64,test');
      expect(result).toBe(false);
    });
  });
});
