import { describe, it, expect } from 'vitest';
import { validateFlagPattern, FlagValidationError } from '@/renderer/flag-validation';
import type { FlagSpec } from '@/flags/schema';

describe('flag-validation', () => {
  describe('validateFlagPattern', () => {
    it('should validate a correct flag pattern', () => {
      const validFlag: FlagSpec = {
        id: 'test-flag',
        name: 'Test Flag',
        displayName: 'Test Flag',
        png_full: '/flags/test-flag.png',
        category: 'oppressed',
        modes: {
          ring: {
            colors: ['#FF0000', '#00FF00', '#0000FF'],
          },
        },
      };

      expect(() => validateFlagPattern(validFlag)).not.toThrow();
    });

    it('should throw if modes.ring.colors is missing', () => {
      const invalidFlag = {
        id: 'no-colors',
        name: 'No Colors',
        displayName: 'No Colors',
        category: 'oppressed',
      } as any;

      expect(() => validateFlagPattern(invalidFlag)).toThrow(FlagValidationError);

      try {
        validateFlagPattern(invalidFlag);
      } catch (err: any) {
        expect(err.message).toContain('missing modes.ring.colors');
        expect(err.flagId).toBe('no-colors');
        expect(err.field).toBe('modes.ring.colors');
      }
    });

    it('should throw if colors array is empty', () => {
      const invalidFlag = {
        id: 'empty-colors',
        name: 'Empty Colors',
        displayName: 'Empty Colors',
        category: 'oppressed',
        modes: {
          ring: {
            colors: [],
          },
        },
      } as any;

      expect(() => validateFlagPattern(invalidFlag)).toThrow(FlagValidationError);

      try {
        validateFlagPattern(invalidFlag);
      } catch (err: any) {
        expect(err.message).toContain('at least 1 color');
        expect(err.flagId).toBe('empty-colors');
      }
    });

    it('should throw if color has invalid hex format', () => {
      const invalidFlag = {
        id: 'bad-color',
        name: 'Bad Color',
        displayName: 'Bad Color',
        category: 'oppressed',
        modes: {
          ring: {
            colors: ['not-a-hex'],
          },
        },
      } as any;

      expect(() => validateFlagPattern(invalidFlag)).toThrow(FlagValidationError);

      try {
        validateFlagPattern(invalidFlag);
      } catch (err: any) {
        expect(err.message).toContain('invalid hex color');
        expect(err.message).toContain('not-a-hex');
        expect(err.flagId).toBe('bad-color');
      }
    });

    it('should throw if color is missing', () => {
      const invalidFlag = {
        id: 'no-color',
        name: 'No Color',
        displayName: 'No Color',
        category: 'oppressed',
        modes: {
          ring: {
            colors: [null, '#00FF00'],
          },
        },
      } as any;

      expect(() => validateFlagPattern(invalidFlag)).toThrow(FlagValidationError);

      try {
        validateFlagPattern(invalidFlag);
      } catch (err: any) {
        expect(err.message).toContain('missing');
        expect(err.flagId).toBe('no-color');
      }
    });

    it('should throw if too many colors', () => {
      const tooManyColors = Array(51).fill('#FF0000');

      const invalidFlag = {
        id: 'too-many',
        name: 'Too Many',
        displayName: 'Too Many',
        category: 'oppressed',
        modes: {
          ring: {
            colors: tooManyColors,
          },
        },
      } as any;

      expect(() => validateFlagPattern(invalidFlag)).toThrow(FlagValidationError);

      try {
        validateFlagPattern(invalidFlag);
      } catch (err: any) {
        expect(err.message).toContain('too many colors');
        expect(err.message).toContain('51');
        expect(err.flagId).toBe('too-many');
      }
    });

    it('should validate 3-digit hex colors', () => {
      const validFlag = {
        id: 'short-hex',
        name: 'Short Hex',
        displayName: 'Short Hex',
        category: 'oppressed',
        modes: {
          ring: {
            colors: ['#F00', '#0F0'],
          },
        },
      } as any;

      expect(() => validateFlagPattern(validFlag)).not.toThrow();
    });

    it('should validate 6-digit hex colors', () => {
      const validFlag = {
        id: 'long-hex',
        name: 'Long Hex',
        displayName: 'Long Hex',
        category: 'oppressed',
        modes: {
          ring: {
            colors: ['#FF0000', '#00FF00'],
          },
        },
      } as any;

      expect(() => validateFlagPattern(validFlag)).not.toThrow();
    });

    it('should include field name in error', () => {
      const invalidFlag = {
        id: 'test',
        name: 'Test',
        displayName: 'Test',
        category: 'oppressed',
        modes: {
          ring: {
            colors: ['#FF0000', 'bad'],
          },
        },
      } as any;

      try {
        validateFlagPattern(invalidFlag);
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.field).toContain('modes.ring.colors[1]');
      }
    });
  });

  describe('FlagValidationError', () => {
    it('should create error with correct properties', () => {
      const error = new FlagValidationError('Test error', 'test-flag', 'test.field');

      expect(error.message).toBe('Test error');
      expect(error.flagId).toBe('test-flag');
      expect(error.field).toBe('test.field');
      expect(error.name).toBe('FlagValidationError');
    });

    it('should be instanceof Error', () => {
      const error = new FlagValidationError('Test', 'test-flag');
      expect(error).toBeInstanceOf(Error);
    });

    it('should work without field parameter', () => {
      const error = new FlagValidationError('Test', 'test-flag');
      expect(error.flagId).toBe('test-flag');
      expect(error.field).toBeUndefined();
    });
  });
});
