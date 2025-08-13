// Vitest setup: jsdom polyfills and canvas mocks

// Minimal no-op 2D context and OffscreenCanvas mocks for tests (jsdom lacks Canvas APIs)
class Mock2DContext {
  fillStyle: any
  strokeStyle: any
  lineWidth = 1
  beginPath() {}
  closePath() {}
  clip() {}
  save() {}
  restore() {}
  arc(_x?: any, _y?: any, _r?: any, _sa?: any, _ea?: any, _ccw?: any) {}
  fill(_rule?: any) {}
  stroke() {}
  moveTo(_x?: any, _y?: any) {}
  rect(_x?: any, _y?: any, _w?: any, _h?: any) {}
  drawImage(_img?: any, _sx?: any, _sy?: any, _sw?: any, _sh?: any, _dx?: any, _dy?: any, _dw?: any, _dh?: any) {}
  fillRect(_x?: any, _y?: any, _w?: any, _h?: any) {}
  clearRect(_x?: any, _y?: any, _w?: any, _h?: any) {}
}

class MockOffscreenCanvas {
  public width: number
  public height: number
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }
  getContext(_type: '2d') {
    return new Mock2DContext() as any
  }
  async convertToBlob(opts?: BlobPropertyBag): Promise<Blob> {
    return new Blob([], { type: opts?.type ?? 'image/png' })
  }
}

// @ts-ignore
if (typeof (globalThis as any).OffscreenCanvas === 'undefined') {
  // @ts-ignore
  ;(globalThis as any).OffscreenCanvas = MockOffscreenCanvas
}

// createImageBitmap is not in jsdom; provide a minimal stub for tests that don't rely on real pixels
if (typeof (globalThis as any).createImageBitmap === 'undefined') {
  ;(globalThis as any).createImageBitmap = async (_blob: Blob) => {
    // Minimal stub: return an object with width/height only. Our renderer reads width/height and uses drawImage
    // on OffscreenCanvas, which we mock above.
    return { width: 32, height: 32 } as any
  }
}
