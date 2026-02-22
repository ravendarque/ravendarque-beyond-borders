/**
 * Fragment shader for circular image masking with buttery smooth anti-aliasing
 *
 * Applies a smooth circular mask to an image texture using GPU smoothstep
 * with 4-pixel transition zone (2px on each side) for hardware-accelerated
 * anti-aliasing. This eliminates jagged edges and white artifacts that occur
 * with narrower transitions or CPU-based Canvas 2D masking.
 */

export const CIRCULAR_MASK_SHADER = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_center;
uniform float u_radius;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  vec2 pixelCoord = v_texCoord * u_resolution;
  float dist = distance(pixelCoord, u_center);
  
  // 4-pixel smoothstep (2px on each side) for buttery smooth edges
  float alpha = 1.0 - smoothstep(u_radius - 2.0, u_radius + 2.0, dist);
  
  gl_FragColor = vec4(color.rgb, color.a * alpha);
}
`;
