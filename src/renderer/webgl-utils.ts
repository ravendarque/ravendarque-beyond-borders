/**
 * WebGL utility functions for GPU-accelerated rendering
 * Handles context creation, shader compilation, program linking, and texture loading
 */

/**
 * Create a WebGL context with proper fallback to WebGL 1 if WebGL 2 is not available
 */
export function createWebGLContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): WebGLRenderingContext | null {
  const contextOptions = {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    antialias: true,
  };

  // Try WebGL 2 first (better performance, more features)
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext(
    'webgl2',
    contextOptions,
  ) as WebGL2RenderingContext | null;

  if (gl) return gl;

  // Fallback to WebGL 1
  gl = canvas.getContext('webgl', contextOptions) as WebGLRenderingContext | null;

  if (gl) return gl;

  // Last resort: try experimental-webgl (old browsers) - only works on HTMLCanvasElement
  if (canvas instanceof HTMLCanvasElement) {
    return canvas.getContext('experimental-webgl', contextOptions) as WebGLRenderingContext | null;
  }

  return null;
}

/**
 * Compile a GLSL shader
 */
export function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error(`Failed to create shader of type ${type}`);
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${log}`);
  }

  return shader;
}

/**
 * Link a shader program from vertex and fragment shaders
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
): WebGLProgram {
  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  if (!program) {
    throw new Error('Failed to create program');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${log}`);
  }

  // Clean up shaders (no longer needed after linking)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Create and bind a texture from an ImageBitmap
 */
export function createTexture(
  gl: WebGLRenderingContext,
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Upload image data
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Set texture parameters
  // Use LINEAR filtering for smooth scaling
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Clamp to edge to prevent artifacts at borders
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}

/**
 * Create a framebuffer for off-screen rendering
 */
export function createFramebuffer(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    throw new Error('Failed to create framebuffer');
  }

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create framebuffer texture');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  // Check framebuffer completeness
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer is not complete: ${status}`);
  }

  // Unbind
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { framebuffer, texture };
}

/**
 * Create a quad geometry (two triangles covering the entire canvas)
 * Used for full-screen rendering passes
 */
export function createQuadBuffer(gl: WebGLRenderingContext): WebGLBuffer {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error('Failed to create quad buffer');
  }

  // Two triangles forming a quad covering normalized device coordinates (-1 to 1)
  const vertices = new Float32Array([
    -1,
    -1, // Bottom-left
    1,
    -1, // Bottom-right
    -1,
    1, // Top-left
    -1,
    1, // Top-left
    1,
    -1, // Bottom-right
    1,
    1, // Top-right
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return buffer;
}

/**
 * Standard vertex shader for full-screen quad rendering
 * Passes through position and generates texture coordinates
 */
export const QUAD_VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);
  
  // Convert from -1..1 to 0..1 for texture coordinates
  v_texCoord = a_position * 0.5 + 0.5;
}
`;

/**
 * Check if WebGL is supported in the current environment
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = createWebGLContext(canvas);
    return gl !== null;
  } catch {
    return false;
  }
}
