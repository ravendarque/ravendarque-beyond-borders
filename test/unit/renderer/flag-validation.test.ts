import { describe, it, expect } from 'vitest'
import { validateFlagPattern, FlagValidationError } from '@/renderer/flag-validation'
import type { FlagSpec } from '@/flags/schema'

describe('flag-validation', () => {
  describe('validateFlagPattern', () => {
    it('should validate a correct flag pattern', () => {
      const validFlag: FlagSpec = {
        id: 'test-flag',
        name: 'Test Flag',
        displayName: 'Test Flag',
        png_full: '/flags/test-flag.png',
        category: 'oppressed',
        sources: {},
        status: 'active',
        pattern: {
          type: 'stripes',
          stripes: [
            { color: '#FF0000', weight: 1 },
            { color: '#00FF00', weight: 1 },
            { color: '#0000FF', weight: 1 }
          ],
          orientation: 'horizontal'
        },
        recommended: {
          borderStyle: 'ring-stripes',
          defaultThicknessPct: 10
        }
      }

      expect(() => validateFlagPattern(validFlag)).not.toThrow()
    })

    it('should throw if pattern is missing', () => {
      const invalidFlag = {
        id: 'no-pattern',
        name: 'No Pattern'
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('missing pattern data')
        expect(err.flagId).toBe('no-pattern')
        expect(err.field).toBe('pattern')
      }
    })

    it('should throw if stripes array is missing', () => {
      const invalidFlag = {
        id: 'no-stripes',
        name: 'No Stripes',
        pattern: {}
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('missing stripes array')
        expect(err.flagId).toBe('no-stripes')
      }
    })

    it('should throw if stripes array is empty', () => {
      const invalidFlag = {
        id: 'empty-stripes',
        name: 'Empty Stripes',
        pattern: {
          stripes: [],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('at least 1 stripe')
        expect(err.flagId).toBe('empty-stripes')
      }
    })

    it('should throw if stripe has invalid color', () => {
      const invalidFlag = {
        id: 'bad-color',
        name: 'Bad Color',
        pattern: {
          stripes: [
            { color: 'not-a-hex', weight: 1 }
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('invalid hex color')
        expect(err.message).toContain('not-a-hex')
        expect(err.flagId).toBe('bad-color')
      }
    })

    it('should throw if stripe is missing color', () => {
      const invalidFlag = {
        id: 'no-color',
        name: 'No Color',
        pattern: {
          stripes: [
            { weight: 1 } as any
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('missing color')
        expect(err.flagId).toBe('no-color')
      }
    })

    it('should throw if stripe has invalid weight', () => {
      const invalidFlag = {
        id: 'bad-weight',
        name: 'Bad Weight',
        pattern: {
          stripes: [
            { color: '#FF0000', weight: 0 }
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('non-positive weight')
        expect(err.flagId).toBe('bad-weight')
      }
    })

    it('should throw if too many stripes', () => {
      const tooManyStripes = Array(51).fill(null).map(() => ({
        color: '#FF0000',
        weight: 1
      }))

      const invalidFlag = {
        id: 'too-many',
        name: 'Too Many',
        pattern: {
          stripes: tooManyStripes,
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(invalidFlag))
        .toThrow(FlagValidationError)
      
      try {
        validateFlagPattern(invalidFlag)
      } catch (err: any) {
        expect(err.message).toContain('too many stripes')
        expect(err.message).toContain('51')
        expect(err.flagId).toBe('too-many')
      }
    })

    it('should validate 3-digit hex colors', () => {
      const validFlag = {
        id: 'short-hex',
        name: 'Short Hex',
        pattern: {
          stripes: [
            { color: '#F00', weight: 1 },
            { color: '#0F0', weight: 1 }
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(validFlag)).not.toThrow()
    })

    it('should validate 6-digit hex colors', () => {
      const validFlag = {
        id: 'long-hex',
        name: 'Long Hex',
        pattern: {
          stripes: [
            { color: '#FF0000', weight: 1 },
            { color: '#00FF00', weight: 1 }
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(validFlag)).not.toThrow()
    })

    it('should validate flags with different weights', () => {
      const validFlag = {
        id: 'weighted',
        name: 'Weighted',
        pattern: {
          stripes: [
            { color: '#FF0000', weight: 2 },
            { color: '#00FF00', weight: 1 },
            { color: '#0000FF', weight: 3 }
          ],
          orientation: 'horizontal'
        }
      } as any

      expect(() => validateFlagPattern(validFlag)).not.toThrow()
    })

    it('should include field name in error', () => {
      const invalidFlag = {
        id: 'test',
        name: 'Test',
        pattern: {
          stripes: [
            { color: '#FF0000', weight: 1 },
            { color: 'bad', weight: 1 }
          ],
          orientation: 'horizontal'
        }
      } as any

      try {
        validateFlagPattern(invalidFlag)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.field).toContain('stripes[1].color')
      }
    })
  })

  describe('FlagValidationError', () => {
    it('should create error with correct properties', () => {
      const error = new FlagValidationError(
        'Test error',
        'test-flag',
        'test.field'
      )

      expect(error.message).toBe('Test error')
      expect(error.flagId).toBe('test-flag')
      expect(error.field).toBe('test.field')
      expect(error.name).toBe('FlagValidationError')
    })

    it('should be instanceof Error', () => {
      const error = new FlagValidationError('Test', 'test-flag')
      expect(error).toBeInstanceOf(Error)
    })

    it('should work without field parameter', () => {
      const error = new FlagValidationError('Test', 'test-flag')
      expect(error.flagId).toBe('test-flag')
      expect(error.field).toBeUndefined()
    })
  })
})
