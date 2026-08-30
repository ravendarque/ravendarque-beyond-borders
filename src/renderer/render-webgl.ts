/**
 * WebGL-based avatar rendering for GPU-accelerated performance
 *
 * This module provides a WebGL implementation of the avatar rendering pipeline,
 * offering significant performance improvements over the Canvas 2D approach:
 * - 10-50x faster rendering via GPU parallel processing
 * - Hardware anti-aliasing eliminates white artifacts
 * - Smooth 60fps preview updates during slider drag
 *
 * The WebGL renderer uses a SINGLE-PASS rendering approach:
 * - One unified shader per mode combines image masking and border rendering
 * - Eliminates framebuffer overhead and compositing pass
 * - Direct rendering to canvas for maximum performance
 *
 * Falls back to Canvas 2D on browsers without WebGL support (< 4% of users).
 */

import { RENDER_SIZES } from '@/constants';
import type { FlagSpec } from '../flags/schema';
import type { RenderOptions, RenderResult } from './render';
import {
  canvasToBlob,
  computeImageDrawRect,
  createCanvas,
  createRenderCanvas,
} from './canvas-utils';
import {
  createWebGLContext,
  createProgram,
  createTexture,
  createQuadBuffer,
  QUAD_VERTEX_SHADER,
} from './webgl-utils';
import { AVATAR_RING_SHADER } from './shaders/avatar-ring.frag';
import { AVATAR_SEGMENT_SHADER } from './shaders/avatar-segment.frag';
import { AVATAR_CUTOUT_SHADER } from './shaders/avatar-cutout.frag';

/**
 * Render avatar using WebGL for GPU acceleration
 *
 * @param image - User's image as ImageBitmap
 * @param flag - Flag specification for border
 * @param options - Rendering options (size, thickness, etc.)
 * @returns Rendered avatar as blob with metadata
 */
export async function renderAvatarWebGL(
  image: ImageBitmap,
  flag: FlagSpec,
  options: RenderOptions,
): Promise<RenderResult> {
  const outputW = options.size;
  const outputH = options.size;

  // Render internally at a fixed, proven-safe resolution and upscale afterward, rather than
  // creating the WebGL context at the full requested export size. On WebKit specifically, an
  // OffscreenCanvas+WebGL context at 1024px only renders/reads back correctly within a small
  // central region — confirmed via CI diagnostics: a radial pixel sample profile on a 1024px
  // export showed correct content out to ~20% of the radius from center, then solid black
  // everywhere beyond that, on webkit/webkit-mobile only (chromium/firefox unaffected). 512 is
  // exactly what LiveAvatarRenderer already uses for the live preview every single frame with
  // zero issues, so it's a known-safe upper bound, not a guess.
  const internalSize = Math.min(outputW, RENDER_SIZES.STANDARD);
  const canvasW = internalSize;
  const canvasH = internalSize;

  // Create canvas for WebGL rendering (Safari/WebKit-safe fallback)
  const canvas = createRenderCanvas(canvasW, canvasH);
  // preserveDrawingBuffer: true — this context's only readback is the async canvasToBlob()
  // call below, which crosses an await boundary after the draw call. On WebKit specifically,
  // the drawing buffer can be discarded at that boundary when this is left false (its default,
  // fine for live-renderer.ts's synchronous transferToImageBitmap() readback), producing a
  // fully blank export. This alone didn't fix the bug above (that's the internalSize clamp),
  // but it's a real, separate hazard for an async-readback context, so it stays regardless.
  const gl = createWebGLContext(canvas, true);

  if (!gl) {
    throw new Error('Failed to create WebGL context');
  }

  // Calculate geometry
  const padding = Math.max(1, ((options.paddingPct ?? 0) * options.size) / 100);
  const thickness = Math.max(1, (options.thicknessPct * options.size) / 100);
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const r = Math.min(canvasW, canvasH) / 2;
  const ringOuterRadius = r - Math.max(1, padding);
  const ringInnerRadius = Math.max(0, ringOuterRadius - thickness);
  const imageRadius = ringInnerRadius; // No overlap hack needed with WebGL!

  // Setup viewport
  gl.viewport(0, 0, canvasW, canvasH);

  // Determine presentation mode (ring, segment, or cutout)
  const presentation = options.presentation ?? 'ring';

  // Create appropriate shader program based on mode
  let program: WebGLProgram;
  if (presentation === 'segment') {
    program = createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_SEGMENT_SHADER);
  } else if (presentation === 'cutout' && options.borderImageBitmap) {
    program = createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_CUTOUT_SHADER);
  } else {
    // Default to ring mode
    program = createProgram(gl, QUAD_VERTEX_SHADER, AVATAR_RING_SHADER);
  }

  // Create quad geometry for full-screen pass
  const quadBuffer = createQuadBuffer(gl);

  // Pre-render the user image with position/zoom/cover-scaling onto a square 2D canvas before
  // uploading as a texture — the shader samples the full texture across the whole canvas with
  // no scaling of its own, so uploading the raw bitmap directly (as this used to) stretches
  // whatever aspect ratio/size the source image happens to have across the entire output,
  // ignoring Step 1's position/zoom entirely. Mirrors live-renderer.ts's preRenderImage, minus
  // the Y-flip that's only needed to cancel out transferToImageBitmap()'s own flip on that path
  // — this one goes straight to canvasToBlob, so no compensating flip is needed here.
  const { canvas: imageCanvas, ctx: imageCtx } = createCanvas(canvasW, canvasH);
  const { dx, dy, dw, dh } = computeImageDrawRect(image, canvasW, imageRadius, options);
  imageCtx.clearRect(0, 0, canvasW, canvasH);
  imageCtx.drawImage(image, dx, dy, dw, dh);

  // Create image texture
  const imageTexture = createTexture(gl, imageCanvas);

  // Get ring colors from flag specification
  const ringColors = flag.modes?.ring?.colors ?? [];

  // Convert hex colors to vec3 arrays (RGB 0-1 range)
  const colorVec3Array: number[] = [];
  for (const hexColor of ringColors) {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    colorVec3Array.push(r, g, b);
  }

  // === SINGLE-PASS RENDERING ===
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Render directly to canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // Set common uniforms (all modes)
  const uniforms = {
    u_image: gl.getUniformLocation(program, 'u_image'),
    u_center: gl.getUniformLocation(program, 'u_center'),
    u_imageRadius: gl.getUniformLocation(program, 'u_imageRadius'),
    u_ringInnerRadius: gl.getUniformLocation(program, 'u_ringInnerRadius'),
    u_ringOuterRadius: gl.getUniformLocation(program, 'u_ringOuterRadius'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
  };

  // Bind image texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.uniform1i(uniforms.u_image, 0);

  // Set common uniforms
  gl.uniform2f(uniforms.u_center, cx, cy);
  gl.uniform1f(uniforms.u_imageRadius, imageRadius);
  gl.uniform1f(uniforms.u_ringInnerRadius, ringInnerRadius);
  gl.uniform1f(uniforms.u_ringOuterRadius, ringOuterRadius);
  gl.uniform2f(uniforms.u_resolution, canvasW, canvasH);

  // Hoisted so it can be cleaned up after the draw call regardless of mode.
  let flagTexture: WebGLTexture | null = null;

  // Set mode-specific uniforms
  if (presentation === 'segment') {
    // Segment mode uniforms
    const rotationRad = ((options.segmentRotation ?? 0) * Math.PI) / 180;
    const u_rotation = gl.getUniformLocation(program, 'u_rotation');
    const u_colorCount = gl.getUniformLocation(program, 'u_colorCount');
    const u_colors = gl.getUniformLocation(program, 'u_colors');

    gl.uniform1f(u_rotation, rotationRad);
    gl.uniform1i(u_colorCount, ringColors.length);
    gl.uniform3fv(u_colors, new Float32Array(colorVec3Array));
  } else if (presentation === 'cutout' && options.borderImageBitmap) {
    // Cutout mode uniforms — sized from the ring's outer diameter and the flag's own
    // aspect ratio (matching render.ts and live-renderer.ts), not the ring circumference.
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
    // Ring mode uniforms (default)
    const u_colorCount = gl.getUniformLocation(program, 'u_colorCount');
    const u_colors = gl.getUniformLocation(program, 'u_colors');

    gl.uniform1i(u_colorCount, ringColors.length);
    gl.uniform3fv(u_colors, new Float32Array(colorVec3Array));
  }

  // Draw full-screen quad
  const positionAttrib = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Block until the GPU has actually finished executing the draw, not just accepted it into
  // the command queue, before the async canvasToBlob() readback below. Cheap insurance against
  // a genuinely incomplete draw on a one-shot export call; the WebKit blank-export bug itself
  // turned out to be the internalSize clamp above, not this.
  gl.finish();

  // If the requested export size is larger than the safe internal render size, upscale onto a
  // plain 2D canvas at the actual requested size before encoding. Keeps the WebGL context
  // itself within the size WebKit handles correctly while still producing a full-resolution
  // export — a 2D canvas drawImage upscale is universally supported, unlike the WebGL context
  // size itself.
  let outputCanvas: OffscreenCanvas | HTMLCanvasElement = canvas;
  if (outputW !== internalSize) {
    const { canvas: scaledCanvas, ctx: scaledCtx } = createCanvas(outputW, outputH);
    scaledCtx.imageSmoothingEnabled = true;
    scaledCtx.imageSmoothingQuality = 'high';
    scaledCtx.drawImage(canvas, 0, 0, outputW, outputH);
    outputCanvas = scaledCanvas;
  }

  // Convert canvas to blob
  const pngQuality = options.pngQuality ?? 0.92;
  const blob = await canvasToBlob(outputCanvas, 'image/png', pngQuality);

  // Cleanup AFTER the draw — deleting before drawArrays would rebind the unit to the
  // default 1×1 black texture (WebGL spec), causing incorrect rendering. This is a
  // one-shot export call (unlike the persistent LiveAvatarRenderer), so everything
  // created for this call is deleted here rather than reused across frames.
  if (flagTexture) gl.deleteTexture(flagTexture);
  gl.deleteTexture(imageTexture);
  gl.deleteBuffer(quadBuffer);
  gl.deleteProgram(program);

  return {
    blob,
    sizeBytes: blob.size,
    sizeKB: (blob.size / 1024).toFixed(2),
  };
}
