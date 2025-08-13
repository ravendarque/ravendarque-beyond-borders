import { describe, it, expect } from 'vitest'
import { flags } from '@/flags/flags'
import { FlagSpec } from '@/flags/schema'

describe('flags data', () => {
  it('has at least one flag and validates against schema', () => {
    expect(flags.length).toBeGreaterThan(0)
    for (const f of flags) {
      const parsed = FlagSpec.safeParse(f)
      expect(parsed.success).toBe(true)
    }
  })
})
