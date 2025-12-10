import { describe, it, expect } from 'vitest'
import { FlagSpec, Stripe } from '@/flags/schema'

describe('flags schema', () => {
  it('validates a correct flag spec', () => {
    const specimen = {
      id: 'trans-pride',
      name: 'Transgender Pride Flag',
      displayName: 'Trans Pride',
      category: 'oppressed',
      png_full: 'trans-pride.png',
      modes: {
        ring: {
          colors: ['#5BCEFA', '#F5A9B8'],
        },
      },
    }
    const parsed = FlagSpec.parse(specimen)
    expect(parsed.id).toBe('trans-pride')
  })

  it('rejects invalid color', () => {
    const bad = Stripe.safeParse({ color: 'blue', weight: 1 })
    expect(bad.success).toBe(false)
  })
})
