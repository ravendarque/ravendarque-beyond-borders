import { describe, it, expect, beforeEach, vi } from 'vitest';
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

    viewport: vi.fn(),
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
    uniform1f: vi.fn(),
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

// Mock OffscreenCanvas
class MockOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(type: string) {
    if (type === 'webgl' || type === 'experimental-webgl') {
      return createMockWebGLContext();
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
});
