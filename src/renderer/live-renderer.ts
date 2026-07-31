/**
 * LiveAvatarRenderer - Persistent WebGL renderer for low-latency live preview
 *
 * This is the gold-standard live preview architecture, mirroring the test page:
 * - WebGL context created ONCE at construction
 * - All three shaders (ring/segment/cutout) compiled ONCE at construction
 * - render() only does per-frame work: image pre-process, texture upload, uniforms, draw call
 * - Output via transferToImageBitmap() — zero async blob encoding overhead
 *
 * Compare to the export renderer (render-webgl.ts) which creates a new context and
 * compiles shaders on every call — acceptable for one-shot export, fatal for 60fps preview.
 */

import type { FlagSpec } from '../flags/schema';
import { createRenderCanvas, supportsOffscreenCanvas } from './canvas-utils';
import {
  createWebGLContext,
  createProgram,
  createTexture,
  createQuadBuffer,
  QUAD_VERTEX_SHADER,
  isWebGLSupported,
} from './webgl-utils';
import { AVATAR_RING_SHADER } from './shaders/avatar-ring.frag';
import { AVATAR_SEGMENT_SHADER } from './shaders/avatar-segment.frag';
import { AVATAR_CUTOUT_SHADER } from './shaders/avatar-cutout.frag';

export interface LiveRenderOptions {
  thicknessPct: number;
  imageOffsetPx?: { x: number; y: number };
  imageZoom?: number;
  circleSize?: number;
  originalImageDimensions?: { width: number; height: number };
  flagOffsetPct?: { x: number; y: number };
  presentation?: 'ring' | 'segment' | 'cutout';
  segmentRotation?: number;
  borderImageBitmap?: ImageBitmap;
}

export class LiveAvatarRenderer {
  private offscreen: OffscreenCanvas;
  /** Persistent 2D canvas for image pre-processing — reused every frame, no alloc per frame */
  private imageCanvas: OffscreenCanvas;
  private imageCtx: OffscreenCanvasRenderingContext2D;
  private gl: WebGLRenderingContext;
  private programs: {
    ring: WebGLProgram;
    segment: WebGLProgram;
    cutout: WebGLProgram;
  };
  private quadBuffer: WebGLBuffer;
  readonly size: number;

  constructor(size: number) {
    this.size = size;

    // This class relies on OffscreenCanvas.transferToImageBitmap() for its synchronous
    // per-frame output, which HTMLCanvasElement doesn't have — so unlike the 2D render
    // path, there's no HTMLCanvasElement fallback here. isSupported() checks this too;
    // callers must use it before constructing. This check makes that contract explicit
    // rather than failing later with a confusing "transferToImageBitmap is not a function".
    if (!supportsOffscreenCanvas()) {
      throw new Error('OffscreenCanvas not supported — required for LiveAvatarRenderer');
    }

    this.offscreen = createRenderCanvas(size, size) as OffscreenCanvas;
    this.imageCanvas = createRenderCanvas(size, size) as OffscreenCanvas;

    const imageCtx = this.imageCanvas.getContext('2d');
    if (!imageCtx) throw new Error('Failed to create 2D context for image pre-processing');
    this.imageCtx = imageCtx;

    const gl = createWebGLContext(this.offscreen);
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    // === COMPILE ALL SHADERS ONCE ===
    // This is the core architectural difference vs the export renderer.
    // On a mid-range device, compilation takes 5–50ms — acceptable once, catastrophic per-frame.
    this.programs = {
      ring: createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_RING_SHADER),
      segment: createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_SEGMENT_SHADER),
      cutout: createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_CUTOUT_SHADER),
    };

    this.quadBuffer = createQuadBuffer(gl);
  }

  /**
   * Render one frame. Only per-frame work is done here:
   * image pre-processing (2D canvas), texture upload, uniform updates, draw call.
   * Returns an ImageBitmap synchronously via transferToImageBitmap() — no blob, no async.
   */
  render(image: ImageBitmap, flag: FlagSpec, options: LiveRenderOptions): ImageBitmap {
    const gl = this.gl;
    const size = this.size;
    const cx = size / 2;
    const cy = size / 2;

    const thickness = Math.max(1, (options.thicknessPct * size) / 100);
    const r = size / 2;
    const ringOuterRadius = r;
    const ringInnerRadius = Math.max(0, ringOuterRadius - thickness);
    const imageRadius = ringInnerRadius;

    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Pre-render image with position/zoom into the persistent 2D canvas, then upload as texture.
    // This is the same pattern as the test page's renderImageToCanvas().
    // It also fixes the missing position/zoom support in the raw-bitmap upload path.
    const imageCanvas = this.preRenderImage(image, imageRadius, options);
    // Explicitly set TEXTURE0 active before createTexture so subsequent calls to createTexture
    // for other textures (e.g. cutout flag on TEXTURE1) don't clobber this binding.
    gl.activeTexture(gl.TEXTURE0);
    const imageTexture = createTexture(gl, imageCanvas);

    const presentation = options.presentation ?? 'ring';
    let program: WebGLProgram;
    if (presentation === 'segment') {
      program = this.programs.segment;
    } else if (presentation === 'cutout' && options.borderImageBitmap) {
      program = this.programs.cutout;
    } else {
      program = this.programs.ring;
    }

    gl.useProgram(program);

    // Bind image texture (unit 0)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    // Common uniforms for all modes
    gl.uniform2f(gl.getUniformLocation(program, 'u_center'), cx, cy);
    gl.uniform1f(gl.getUniformLocation(program, 'u_imageRadius'), imageRadius);
    gl.uniform1f(gl.getUniformLocation(program, 'u_ringInnerRadius'), ringInnerRadius);
    gl.uniform1f(gl.getUniformLocation(program, 'u_ringOuterRadius'), ringOuterRadius);
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), size, size);

    // Flag colors (ring/segment modes)
    const ringColors = flag.modes?.ring?.colors ?? [];
    const colorVec3: number[] = [];
    for (const hex of ringColors) {
      colorVec3.push(
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
      );
    }

    // Hoisted so it can be cleaned up after the draw call regardless of mode.
    let flagTexture: WebGLTexture | null = null;

    if (presentation === 'segment') {
      const rotRad = ((options.segmentRotation ?? 0) * Math.PI) / 180;
      gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), rotRad);
      gl.uniform1i(gl.getUniformLocation(program, 'u_colorCount'), ringColors.length);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_colors'), new Float32Array(colorVec3));
    } else if (presentation === 'cutout' && options.borderImageBitmap) {
      const flagOffsetPct = options.flagOffsetPct ?? { x: 0, y: 0 };

      const flagRectHeight = ringOuterRadius * 2;
      const flagAspectRatio = options.borderImageBitmap.width / options.borderImageBitmap.height;
      const flagRectWidth = flagRectHeight * flagAspectRatio;

      const flagExtension = Math.max(0, (flagRectWidth - flagRectHeight) / 2);
      const offsetPx = -(flagOffsetPct.x / 50) * flagExtension;
      const flagPosX = cx - flagRectWidth / 2 + offsetPx;
      const flagPosY = cy - flagRectHeight / 2;

      // Switch to TEXTURE1 BEFORE createTexture so it binds there, not to TEXTURE0.
      gl.activeTexture(gl.TEXTURE1);
      flagTexture = createTexture(gl, options.borderImageBitmap);
      gl.bindTexture(gl.TEXTURE_2D, flagTexture);
      gl.uniform1i(gl.getUniformLocation(program, 'u_flagTexture'), 1);
      gl.uniform2f(gl.getUniformLocation(program, 'u_flagSize'), flagRectWidth, flagRectHeight);
      gl.uniform2f(gl.getUniformLocation(program, 'u_flagPos'), flagPosX, flagPosY);
    } else {
      // Ring mode
      gl.uniform1i(gl.getUniformLocation(program, 'u_colorCount'), ringColors.length);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_colors'), new Float32Array(colorVec3));
    }

    // Draw full-screen quad
    const posAttrib = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Cleanup per-frame textures AFTER the draw — deleting before drawArrays would rebind
    // the unit to the default 1×1 black texture (WebGL spec) causing incorrect rendering.
    gl.deleteTexture(imageTexture);
    if (flagTexture) gl.deleteTexture(flagTexture);

    // Return ImageBitmap — synchronous, no PNG encode, no blob URL round-trip
    return this.offscreen.transferToImageBitmap();
  }

  /**
   * Pre-render the user image with position, zoom, and cover-scaling into
   * the persistent 2D canvas. Reuses the canvas allocation every frame.
   *
   * Mirrors the same scale/offset logic as render.ts so preview matches export exactly.
   */
  private preRenderImage(
    image: ImageBitmap,
    imageRadius: number,
    options: LiveRenderOptions,
  ): OffscreenCanvas {
    const size = this.size;
    const ctx = this.imageCtx;

    ctx.clearRect(0, 0, size, size);

    const iw = image.width;
    const ih = image.height;
    const target = imageRadius * 2;
    const zoomMultiplier = 1 + (options.imageZoom ?? 0) / 100;
    const originalWidth = options.originalImageDimensions?.width ?? iw;
    const originalHeight = options.originalImageDimensions?.height ?? ih;

    let scale: number;
    if (options.circleSize && options.circleSize > 0) {
      const step1CoverScale = Math.max(
        options.circleSize / originalWidth,
        options.circleSize / originalHeight,
      );
      scale = (step1CoverScale * zoomMultiplier * target) / options.circleSize;
    } else {
      scale = Math.max(target / originalWidth, target / originalHeight) * zoomMultiplier;
    }

    const dw = iw * scale;
    const dh = ih * scale;
    const cx = size / 2 + (options.imageOffsetPx?.x ?? 0);
    const cy = size / 2 + (options.imageOffsetPx?.y ?? 0);

    // Pre-flip Y before uploading as a WebGL texture.
    // transferToImageBitmap() applies its own Y-flip (matching what the browser would do
    // when compositing the WebGL canvas to screen). Pre-flipping here cancels it so the
    // final drawImage() call on the visible HTML canvas shows the image right-side up.
    // This mirrors the test page's renderImageToCanvas() approach.
    ctx.save();
    ctx.translate(0, size);
    ctx.scale(1, -1);
    ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();

    return this.imageCanvas;
  }

  static isSupported(): boolean {
    return isWebGLSupported() && supportsOffscreenCanvas();
  }

  destroy(): void {
    const gl = this.gl;
    gl.deleteProgram(this.programs.ring);
    gl.deleteProgram(this.programs.segment);
    gl.deleteProgram(this.programs.cutout);
    gl.deleteBuffer(this.quadBuffer);
  }
}
