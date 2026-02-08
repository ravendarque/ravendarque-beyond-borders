/**
 * Fragment shader for circular image masking with hardware anti-aliasing
 *
 * Applies a smooth circular mask to an image texture using GPU smoothstep
 * for hardware-accelerated anti-aliasing. This eliminates the white artifacts
 * that occur with CPU-based Canvas 2D masking.
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
  float alpha = 1.0 - smoothstep(u_radius - 1.0, u_radius, dist);
  gl_FragColor = vec4(color.rgb, color.a * alpha);
}
`;
