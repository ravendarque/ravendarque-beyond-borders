import { describe, it, expect } from 'vitest'
import { renderAvatar, type RenderOptions } from '@/renderer/render'
import { flags } from '@/flags/flags'

// 1x1 transparent PNG
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

async function imageBitmapFromDataUrl(url: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  // @ts-ignore createImageBitmap provided by test setup
  return await createImageBitmap(blob)
}

describe('renderer', () => {
  describe('basic rendering', () => {
    it('renders a PNG blob for a simple image', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      const result = await renderAvatar(img as any, flag, { 
        size: 512, 
        thicknessPct: 7, 
        backgroundColor: null 
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.blob.type).toBe('image/png')
      expect(result.sizeBytes).toBeGreaterThan(0)
      expect(result.sizeKB).toMatch(/^\d+\.\d{2}$/) // Format: "123.45"
    })

    it('respects custom PNG quality setting', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      // Lower quality should result in smaller file (in theory)
      const lowQuality = await renderAvatar(img as any, flag, { 
        size: 512, 
        thicknessPct: 7,
        pngQuality: 0.5
      })
      
      expect(lowQuality.blob).toBeInstanceOf(Blob)
      expect(lowQuality.sizeBytes).toBeGreaterThan(0)
    })

    it('uses default PNG quality when not specified', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, { 
        size: 512, 
        thicknessPct: 7 
      })
      
      // Should still produce valid output
      expect(result.blob.type).toBe('image/png')
      expect(result.sizeBytes).toBeGreaterThan(0)
    })
  })

  describe('presentation modes', () => {
    it('renders ring mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        presentation: 'ring'
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('renders segment mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 15,
        presentation: 'segment'
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('renders cutout mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 0,
        presentation: 'cutout'
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })
  })

  describe('size validation', () => {
    it('handles different canvas sizes', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const sizes: (512 | 1024)[] = [512, 1024]
      
      for (const size of sizes) {
        const result = await renderAvatar(img as any, flag, {
          size,
          thicknessPct: 10
        })
        
        expect(result.blob).toBeInstanceOf(Blob)
        expect(result.sizeBytes).toBeGreaterThan(0)
      }
    })

    it('rejects oversized canvas', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      await expect(async () => {
        await renderAvatar(img as any, flag, {
          size: 20000 as any, // Way too large - bypass type checking for test
          thicknessPct: 10
        })
      }).rejects.toThrow(/exceeds.*limit/)
    })
  })

  describe('background color', () => {
    it('renders with background color', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        backgroundColor: '#FFFFFF'
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('renders with transparent background', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        backgroundColor: null
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })
  })

  describe('image offset', () => {
    it('applies imageOffsetPx in ring mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        presentation: 'ring',
        imageOffsetPx: { x: 20, y: -10 }
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('applies flagOffsetPx in cutout mode', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 0,
        presentation: 'cutout',
        flagOffsetPct: { x: 15, y: 0 }
      })
      
      expect(result.blob).toBeInstanceOf(Blob)
    })
  })

  describe('performance metrics', () => {
    it('includes metrics when enabled', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        enablePerformanceTracking: true
      })
      
      expect(result.metrics).toBeDefined()
      if (result.metrics) {
        expect(result.metrics.totalTime).toBeGreaterThan(0)
      }
    })

    it('omits metrics when disabled', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      
      const result = await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        enablePerformanceTracking: false
      })
      
      expect(result.metrics).toBeUndefined()
    })
  })

  describe('progress callbacks', () => {
    it('calls onProgress callback during render', async () => {
      const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
      const flag = flags[0]
      const progressValues: number[] = []
      
      await renderAvatar(img as any, flag, {
        size: 512,
        thicknessPct: 10,
        onProgress: (progress) => {
          progressValues.push(progress)
        }
      })
      
      // Should have received some progress updates
      expect(progressValues.length).toBeGreaterThan(0)
      // Progress values should be between 0 and 1
      progressValues.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(1)
      })
    })
  })
})
