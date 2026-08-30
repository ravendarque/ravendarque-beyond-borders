import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderAvatarWebGL } from '@/renderer/render-webgl';
import type { FlagSpec } from '@/flags/schema';
import type { RenderOptions } from '@/renderer/render';

// Mock WebGL context
let lastGLContext: any = null;
/** Ordered log of every call made on the mock context, for ordering/value assertions */
let callLog: Array<{ fn: string; args: any[] }> = [];
let textureIdCounter = 0;

const createMockWebGLContext = () => {
  const log = (fn: string, args: any[]) => callLog.push({ fn, args });

  // Tag getUniformLocation results with the uniform name so uniform*() calls can be
  // traced back to which uniform they set (the real WebGL API doesn't expose this,
  // but the mock needs it to assert e.g. exact u_flagSize/u_flagPos values).
  const getUniformLocation = vi.fn((_program: unknown, name: string) => ({ __name: name }));
  const uniform2f = vi.fn((location: any, x: number, y: number) => {
    log('uniform2f', [location?.__name, x, y]);
  });
  const uniform1f = vi.fn((location: any, x: number) => {
    log('uniform1f', [location?.__name, x]);
  });

  // Tag createTexture results with an incrementing id so deleteTexture calls can be
  // matched back to which texture (image vs flag) was deleted.
  const createTexture = vi.fn(() => ({ __textureId: ++textureIdCounter }));
  const deleteTexture = vi.fn((texture: any) => {
    log('deleteTexture', [texture?.__textureId]);
  });
  const drawArrays = vi.fn((...args: any[]) => {
    log('drawArrays', args);
  });
  const deleteProgram = vi.fn((program: any) => log('deleteProgram', [program]));
  const deleteBuffer = vi.fn((buffer: any) => log('deleteBuffer', [buffer]));

  const gl = {
    TRIANGLES: 4,
    TEXTURE_2D: 3553,
    TEXTURE0: 33984,
    TEXTURE1: 33985,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    COLOR_BUFFER_BIT: 16384,
    FRAMEBUFFER: 36160,
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    LINEAR: 9729,
    CLAMP_TO_EDGE: 33071,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    UNPACK_FLIP_Y_WEBGL: 37440,

    viewport: vi.fn(),
    pixelStorei: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    useProgram: vi.fn(),
    getUniformLocation,
    getAttribLocation: vi.fn(() => 0),
    uniform1i: vi.fn(),
    uniform1f,
    uniform2f,
    uniform3fv: vi.fn(),
    createTexture,
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    activeTexture: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawArrays,
    finish: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteTexture,
    deleteShader: vi.fn(),
    deleteProgram,
    deleteBuffer,
    deleteFramebuffer: vi.fn(),
  };
  lastGLContext = gl; // Track the latest context
  return gl as unknown as WebGLRenderingContext;
};

// Every OffscreenCanvas constructed, in order - lets tests assert what sizes were actually
// used to create canvases (e.g. that the WebGL canvas stays at the safe internal size even
// when a larger export size is requested).
let constructedCanvasSizes: Array<{ width: number; height: number }> = [];
// Every 2D drawImage() call, in order, across every 2D context created (image pre-render onto
// the internal canvas, and the upscale pass onto the output-sized canvas) - lets tests assert
// exactly where the image was drawn, e.g. that an offset gets scaled to internal-canvas space.
let drawImageCalls: Array<{ dx: number; dy: number; dw: number; dh: number }> = [];

// Mock OffscreenCanvas
class MockOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    constructedCanvasSizes.push({ width, height });
  }

  getContext(type: string) {
    if (type === 'webgl' || type === 'experimental-webgl') {
      return createMockWebGLContext();
    }
    if (type === '2d') {
      return {
        clearRect: vi.fn(),
        drawImage: vi.fn((_img: unknown, dx: number, dy: number, dw: number, dh: number) => {
          drawImageCalls.push({ dx, dy, dw, dh });
        }),
      };
    }
    return null;
  }

  async convertToBlob() {
    return new Blob(['mock'], { type: 'image/png' });
  }
}

// Mock globals
(global as any).OffscreenCanvas = MockOffscreenCanvas;

describe('renderAvatarWebGL', () => {
  let mockImage: ImageBitmap;
  let mockFlag: FlagSpec;
  let renderOptions: RenderOptions;

  beforeEach(() => {
    callLog = [];
    textureIdCounter = 0;
    constructedCanvasSizes = [];
    drawImageCalls = [];

    // Mock ImageBitmap
    mockImage = {
      width: 512,
      height: 512,
      close: vi.fn(),
    } as unknown as ImageBitmap;

    // Mock flag spec
    mockFlag = {
      id: 'test-flag',
      name: 'Test Flag',
      modes: {
        ring: {
          colors: ['#e40c0c', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982'],
        },
      },
    } as FlagSpec;

    // Base render options
    renderOptions = {
      size: 512,
      thicknessPct: 10,
      paddingPct: 0,
      presentation: 'ring',
      backgroundColor: null,
      pngQuality: 0.92,
    };
  });

  describe('Ring Mode', () => {
    it('should render successfully with ring mode', async () => {
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.sizeKB).toBeDefined();
    });

    it('should use ring gradient shader for ring mode', async () => {
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      // Verify shader creation was called on the actual GL context used
      expect(lastGLContext.createShader).toHaveBeenCalled();
      expect(lastGLContext.createProgram).toHaveBeenCalled();
    });

    it('should handle different color counts', async () => {
      // Test with 3 colors
      mockFlag.modes!.ring!.colors = ['#ff0000', '#00ff00', '#0000ff'];
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);
      expect(result.blob).toBeInstanceOf(Blob);

      // Test with 8 colors
      mockFlag.modes!.ring!.colors = [
        '#ff0000',
        '#ff7f00',
        '#ffff00',
        '#00ff00',
        '#0000ff',
        '#4b0082',
        '#9400d3',
        '#ffffff',
      ];
      const result2 = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);
      expect(result2.blob).toBeInstanceOf(Blob);
    });
  });

  describe('Segment Mode', () => {
    beforeEach(() => {
      renderOptions.presentation = 'segment';
    });

    it('should render successfully with segment mode', async () => {
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should handle segment rotation', async () => {
      renderOptions.segmentRotation = 90;
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should handle rotation at different angles', async () => {
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];

      for (const angle of angles) {
        renderOptions.segmentRotation = angle;
        const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);
        expect(result.blob).toBeInstanceOf(Blob);
      }
    });
  });

  describe('Cutout Mode', () => {
    let mockFlagImage: ImageBitmap;

    beforeEach(() => {
      renderOptions.presentation = 'cutout';

      // Mock flag image bitmap
      mockFlagImage = {
        width: 2048,
        height: 1024,
        close: vi.fn(),
      } as unknown as ImageBitmap;

      renderOptions.borderImageBitmap = mockFlagImage;
    });

    it('should render successfully with cutout mode', async () => {
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result).toBeDefined();
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should delete the flag texture AFTER drawArrays, not before', async () => {
      // Regression test: deleting a texture before the draw call that uses it rebinds
      // the unit to the default 1x1 black texture per the WebGL spec, blanking the flag.
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const drawIndex = callLog.findIndex((c) => c.fn === 'drawArrays');
      const flagDeleteIndex = callLog.findIndex((c) => c.fn === 'deleteTexture');

      expect(drawIndex).toBeGreaterThanOrEqual(0);
      expect(flagDeleteIndex).toBeGreaterThan(drawIndex);
    });

    it('should size the flag rect from ring diameter and flag aspect ratio, not circumference', async () => {
      // With size=512, thicknessPct=10, paddingPct=0: ringOuterRadius=255.
      // mockFlagImage is 2048x1024 (aspect ratio 2).
      // Diameter-based (correct): flagRectHeight = 255*2 = 510, flagRectWidth = 510*2 = 1020.
      // Circumference-based (the bug): would produce flagWidth ~= 1441.3, flagHeight = 51.2 -
      // a completely different, wrong shape that this assertion would catch.
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const flagSizeCall = callLog.find((c) => c.fn === 'uniform2f' && c.args[0] === 'u_flagSize');
      const flagPosCall = callLog.find((c) => c.fn === 'uniform2f' && c.args[0] === 'u_flagPos');

      expect(flagSizeCall?.args).toEqual(['u_flagSize', 1020, 510]);
      expect(flagPosCall?.args).toEqual(['u_flagPos', -254, 1]);
    });

    it('should delete the program, image texture, and quad buffer after export', async () => {
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(lastGLContext.deleteProgram).toHaveBeenCalledTimes(1);
      expect(lastGLContext.deleteBuffer).toHaveBeenCalledTimes(1);
      // Two textures created this call (image + flag), both must be deleted.
      expect(lastGLContext.deleteTexture).toHaveBeenCalledTimes(2);
    });

    it('should handle flag offset', async () => {
      renderOptions.flagOffsetPct = { x: 25, y: 10 };
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should handle negative flag offset', async () => {
      renderOptions.flagOffsetPct = { x: -20, y: -15 };
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should fallback to ring mode if no flag image provided', async () => {
      renderOptions.borderImageBitmap = undefined;
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      // Should still render successfully (fallback to ring mode)
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('Geometry Calculations', () => {
    it('should handle different canvas sizes', async () => {
      const sizes: Array<512 | 1024> = [512, 1024];

      for (const size of sizes) {
        renderOptions.size = size;
        const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);
        expect(result.blob).toBeInstanceOf(Blob);
      }
    });

    it('should handle different border thicknesses', async () => {
      const thicknesses = [5, 10, 15, 20];

      for (const thickness of thicknesses) {
        renderOptions.thicknessPct = thickness;
        const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);
        expect(result.blob).toBeInstanceOf(Blob);
      }
    });

    it('should handle padding', async () => {
      renderOptions.paddingPct = 5;
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if WebGL context creation fails', async () => {
      // Mock OffscreenCanvas to return null for getContext
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      (global as any).OffscreenCanvas = class {
        getContext() {
          return null;
        }
      };

      await expect(renderAvatarWebGL(mockImage, mockFlag, renderOptions)).rejects.toThrow(
        'Failed to create WebGL context',
      );

      // Restore
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });

    it('should handle missing flag colors gracefully', async () => {
      mockFlag.modes = {};
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      // Should render with empty color array (fallback)
      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('Output', () => {
    it('should return blob with correct metadata', async () => {
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.blob.type).toBe('image/png');
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.sizeKB).toMatch(/^\d+\.\d{2}$/); // Should be formatted to 2 decimal places
    });

    it('should respect PNG quality setting', async () => {
      renderOptions.pngQuality = 0.5;
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
    });
  });

  describe('High-Res Export Upscaling (WebKit only)', () => {
    // Regression test for a WebKit-only bug: an OffscreenCanvas+WebGL context at 1024px only
    // rendered/read back correctly within a small central region (confirmed via a radial pixel
    // sample profile in CI - correct out to ~20% of the radius, solid black beyond). Reproduced
    // identically under forced WebGL1 at native resolution, ruling out a WebGL2-specific path -
    // it's a genuine WebKit large-canvas limitation, not something fixable in how the API is
    // used. Chromium/Firefox never exhibit it, so the downscale/upscale below is scoped to
    // WebKit via isWebKitEngine() rather than applied universally.
    const SAFARI_UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const originalUserAgent = navigator.userAgent;

    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', { value: SAFARI_UA, configurable: true });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    it('creates the WebGL canvas at the safe internal size, not the requested export size', async () => {
      renderOptions.size = 1024;
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      // First canvas constructed is the WebGL one - must stay at 512 even though a 1024
      // export was requested.
      expect(constructedCanvasSizes[0]).toEqual({ width: 512, height: 512 });
    });

    it('upscales onto a second canvas at the full requested size for a 1024 export', async () => {
      renderOptions.size = 1024;
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const outputSizedCanvas = constructedCanvasSizes.find((c) => c.width === 1024);
      expect(outputSizedCanvas).toEqual({ width: 1024, height: 1024 });
    });

    it('does not create an upscale canvas when the requested size already matches the safe internal size', async () => {
      renderOptions.size = 512;
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      // The WebGL canvas and the image pre-processing canvas are both expected at 512 - no
      // extra upscale-sized canvas since the requested size already equals the internal size.
      expect(constructedCanvasSizes.every((c) => c.width === 512 && c.height === 512)).toBe(true);
    });

    it('still produces a valid blob for a 1024 export', async () => {
      renderOptions.size = 1024;
      const result = await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.sizeBytes).toBeGreaterThan(0);
    });

    it('computes ring geometry relative to the internal canvas, not the requested export size', async () => {
      // Regression test for a real bug hit while adding this fix: padding/thickness were left
      // computed from options.size (the originally-requested 1024) while radius/center used
      // the new smaller canvas (512) - the two must agree, or the ring comes out ~2x too thick
      // relative to the actual canvas once upscaled. thicknessPct: 10 against a 512 canvas
      // (padding defaults to 0, floored to 1) should give exactly these values, not double them.
      renderOptions.size = 1024;
      renderOptions.thicknessPct = 10;
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const outerRadiusCall = callLog.find(
        (c) => c.fn === 'uniform1f' && c.args[0] === 'u_ringOuterRadius',
      );
      const innerRadiusCall = callLog.find(
        (c) => c.fn === 'uniform1f' && c.args[0] === 'u_ringInnerRadius',
      );

      expect(outerRadiusCall?.args[1]).toBeCloseTo(255, 5); // 512/2 - max(1, 0)
      expect(innerRadiusCall?.args[1]).toBeCloseTo(203.8, 5); // 255 - (10% of 512)
    });

    it('scales imageOffsetPx to the internal canvas, not the requested export size', async () => {
      // Regression test for a real bug found via a real downloaded avatar: useAvatarRenderer.ts
      // computes imageOffsetPx as an absolute pixel offset scaled for a canvas of options.size
      // (1024 for a HIGH_RES export) - the size it assumed renderAvatarWebGL would render at.
      // Left unscaled against the new smaller internal canvas, the image lands shifted by the
      // difference between the two sizes (visibly: image not filling the ring, offset toward
      // one edge, exactly as reported). thicknessPct: 10, no circleSize/originalImageDimensions
      // set (mockImage is already 512x512, so the cover-scale fallback is exact) should give
      // these values; the unscaled (buggy) offset would be exactly double (100/50 instead of
      // 50/25), landing dx/dy 50px off in each axis.
      renderOptions.size = 1024;
      renderOptions.thicknessPct = 10;
      renderOptions.imageOffsetPx = { x: 100, y: 50 };
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const imageDraw = drawImageCalls[0];
      expect(imageDraw.dx).toBeCloseTo(102.2, 5);
      expect(imageDraw.dy).toBeCloseTo(77.2, 5);
      expect(imageDraw.dw).toBeCloseTo(407.6, 5);
      expect(imageDraw.dh).toBeCloseTo(407.6, 5);
    });
  });

  describe('High-Res Export on non-WebKit engines', () => {
    // Companion regression test: Chromium/Firefox never showed the WebKit large-canvas bug, so
    // they must render at the full requested size directly - no downscale, no upscale, no
    // quality loss. Only WebKit should pay for the workaround above.
    it('renders directly at the requested export size with no upscale canvas', async () => {
      renderOptions.size = 1024;
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      expect(constructedCanvasSizes[0]).toEqual({ width: 1024, height: 1024 });
      expect(constructedCanvasSizes.every((c) => c.width === 1024 && c.height === 1024)).toBe(true);
    });

    it('does not scale imageOffsetPx away from the requested values', async () => {
      renderOptions.size = 1024;
      renderOptions.thicknessPct = 10;
      renderOptions.imageOffsetPx = { x: 100, y: 50 };
      await renderAvatarWebGL(mockImage, mockFlag, renderOptions);

      const imageDraw = drawImageCalls[0];
      // No offsetScale applied (internalSize === outputW), so imageOffsetPx is used exactly as
      // requested - not scaled down, and not the halved values from the WebKit-path test above.
      expect(imageDraw.dx).toBeCloseTo(203.4, 5);
      expect(imageDraw.dy).toBeCloseTo(153.4, 5);
      expect(imageDraw.dw).toBeCloseTo(817.2, 5);
      expect(imageDraw.dh).toBeCloseTo(817.2, 5);
    });
  });
});
