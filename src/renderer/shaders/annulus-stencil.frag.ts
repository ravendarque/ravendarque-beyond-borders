/**
 * Fragment shader for annulus stencil mask with buttery smooth anti-aliasing
 *
 * Creates a smooth alpha mask for the annulus (ring) shape used in cutout mode.
 * This shader:
 * - Outputs an alpha mask with 4-pixel smoothstep on inner/outer edges
 * - Used as a stencil/mask to clip flag images to the ring shape
 * - Enables smooth anti-aliasing on both circular boundaries
 */

export const ANNULUS_STENCIL_SHADER = `
precision mediump float;

uniform vec2 u_center;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  float dist = distance(pixelCoord, u_center);
  
  // Smooth anti-aliasing on BOTH edges (inner and outer)
  // Use wider smoothstep (2 pixels on each side = 4 pixels total) for buttery smoothness
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, dist);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, dist);
  float alpha = innerAlpha * outerAlpha;
  
  // Early exit if completely transparent
  if (alpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`;
