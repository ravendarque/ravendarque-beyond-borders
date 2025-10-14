import { describe, it, expect } from 'vitest'
import { FlagSpec, Stripe } from '@/flags/schema'

describe('flags schema', () => {
  it('validates a correct flag spec', () => {
    const specimen = {
      id: 'trans-pride',
      displayName: 'Trans Pride',
      category: 'marginalized',
      sources: {},
      status: 'active',
      png_full: 'trans-pride.png', // Required field
      pattern: {
        type: 'stripes',
        orientation: 'horizontal',
        stripes: [
          { color: '#5BCEFA', weight: 1 },
          { color: '#F5A9B8', weight: 1 },
        ],
      },
      recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 10 },
    }
    const parsed = FlagSpec.parse(specimen)
    expect(parsed.id).toBe('trans-pride')
  })

  it('rejects invalid color', () => {
    const bad = Stripe.safeParse({ color: 'blue', weight: 1 })
    expect(bad.success).toBe(false)
  })
})
