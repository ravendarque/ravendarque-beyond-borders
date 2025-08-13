import { describe, it, expect } from 'vitest'
import { renderAvatar } from '@/renderer/render'
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
  it('renders a PNG blob for a simple image', async () => {
  const img = await imageBitmapFromDataUrl(TINY_PNG_DATA_URL)
    const flag = flags[0]
    const blob = await renderAvatar(img as any, flag, { size: 512, thicknessPct: 7, backgroundColor: null })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })
})
