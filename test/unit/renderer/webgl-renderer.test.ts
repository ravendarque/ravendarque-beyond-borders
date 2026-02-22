import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderAvatarWebGL } from '@/renderer/render-webgl';
import type { FlagSpec } from '@/flags/schema';
import type { RenderOptions } from '@/renderer/render';

// Mock WebGL context
let lastGLContext: any = null;

const createMockWebGLContext = () => {
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
    getUniformLocation: vi.fn(() => ({})),
    getAttribLocation: vi.fn(() => 0),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3fv: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    activeTexture: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawArrays: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteTexture: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
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
