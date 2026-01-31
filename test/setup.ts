// Vitest setup: jsdom polyfills and canvas mocks

// Minimal no-op 2D context and OffscreenCanvas mocks for tests (jsdom lacks Canvas APIs)
class Mock2DContext {
  fillStyle: any;
  strokeStyle: any;
  lineWidth = 1;
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
  drawImage(
    _img?: any,
    _sx?: any,
    _sy?: any,
    _sw?: any,
    _sh?: any,
    _dx?: any,
    _dy?: any,
    _dw?: any,
    _dh?: any,
  ) {}
  fillRect(_x?: any, _y?: any, _w?: any, _h?: any) {}
  clearRect(_x?: any, _y?: any, _w?: any, _h?: any) {}
}

class MockOffscreenCanvas {
  public width: number;
  public height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext(_type: '2d') {
    return new Mock2DContext() as any;
  }
  async convertToBlob(opts?: BlobPropertyBag): Promise<Blob> {
    // Create a blob with some fake PNG data to simulate realistic file size
    // Real PNG would be much larger, but this is enough for testing
    const fakeImageData = new Array(this.width * this.height).fill(0);
    return new Blob([new Uint8Array(fakeImageData)], { type: opts?.type ?? 'image/png' });
  }
}

// @ts-ignore
if (typeof (globalThis as any).OffscreenCanvas === 'undefined') {
  // @ts-ignore
  (globalThis as any).OffscreenCanvas = MockOffscreenCanvas;
}

// createImageBitmap is not in jsdom; provide a minimal stub for tests that don't rely on real pixels
if (typeof (globalThis as any).createImageBitmap === 'undefined') {
  (globalThis as any).createImageBitmap = async (_blob: Blob) => {
    // Minimal stub: return an object with width/height only. Our renderer reads width/height and uses drawImage
    // on OffscreenCanvas, which we mock above.
    return { width: 32, height: 32 } as any;
  };
}

// ResizeObserver is not in happy-dom/jsdom; provide a minimal stub for Radix UI components
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Pointer Events API polyfill for Radix UI Select
// happy-dom and jsdom don't fully support Pointer Events API
if (typeof (globalThis as any).PointerEvent === 'undefined') {
  (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init as MouseEventInit);
    }
  };
}

// Mock localStorage if not available (happy-dom should provide it, but ensure it works)
if (
  typeof (globalThis as any).localStorage === 'undefined' ||
  typeof (globalThis as any).localStorage.clear !== 'function'
) {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      get length() {
        return Object.keys(store).length;
      },
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

// Add hasPointerCapture and setPointerCapture methods to Element prototype
if (typeof Element !== 'undefined') {
  const originalHasPointerCapture = Element.prototype.hasPointerCapture;
  if (!originalHasPointerCapture || typeof originalHasPointerCapture !== 'function') {
    Element.prototype.hasPointerCapture = function (pointerId: number): boolean {
      // Return false for tests - Radix UI checks this but doesn't require it to work
      return false;
    };
  }

  const originalSetPointerCapture = Element.prototype.setPointerCapture;
  if (!originalSetPointerCapture || typeof originalSetPointerCapture !== 'function') {
    Element.prototype.setPointerCapture = function (pointerId: number): void {
      // No-op for tests
    };
  }

  const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
  if (!originalReleasePointerCapture || typeof originalReleasePointerCapture !== 'function') {
    Element.prototype.releasePointerCapture = function (pointerId: number): void {
      // No-op for tests
    };
  }
}
