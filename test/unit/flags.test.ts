import { describe, it, expect } from 'vitest'
import { flags } from '@/flags/flags'
import { FlagSpec } from '@/flags/schema'
import fs from 'node:fs'
import path from 'node:path'

describe('flags data', () => {
  it('has at least one flag and validates against schema', () => {
    expect(flags.length).toBeGreaterThan(0)
    for (const f of flags) {
      const parsed = FlagSpec.safeParse(f)
      if (!parsed.success) {
        console.error(`Flag ${f.id} failed validation:`, parsed.error.errors)
      }
      expect(parsed.success, `Flag ${f.id} failed schema validation`).toBe(true)
    }
  })

  it('all flags have required properties', () => {
    for (const flag of flags) {
      expect(flag.id, `Flag missing id`).toBeTruthy()
      expect(flag.displayName, `Flag ${flag.id} missing displayName`).toBeTruthy()
      expect(flag.png_full, `Flag ${flag.id} missing png_full`).toBeTruthy()
    }
  })

  it('all flag PNG files exist', () => {
    const publicFlagsDir = path.resolve(process.cwd(), 'public/flags')
    
    for (const flag of flags) {
      if (flag.png_full) {
        const pngPath = path.join(publicFlagsDir, flag.png_full)
        expect(
          fs.existsSync(pngPath),
          `Flag PNG file not found for ${flag.id}: ${flag.png_full}`
        ).toBe(true)
      }
    }
  })

  it('all flags have color layout data', () => {
    for (const flag of flags) {
      const hasPattern = flag.pattern && flag.pattern.stripes && flag.pattern.stripes.length > 0
      const hasLayout = flag.layouts && flag.layouts.length > 0 && 
                       flag.layouts[0].colors && flag.layouts[0].colors.length > 0
      
      expect(
        hasPattern || hasLayout,
        `Flag ${flag.id} missing both pattern.stripes and layouts[0].colors`
      ).toBe(true)
    }
  })

  it('flag IDs are unique', () => {
    const ids = flags.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('flag display names are present and non-empty', () => {
    for (const flag of flags) {
      expect(flag.displayName, `Flag ${flag.id} has empty displayName`).toBeTruthy()
      expect(flag.displayName.trim().length, `Flag ${flag.id} displayName is only whitespace`).toBeGreaterThan(0)
    }
  })
})
