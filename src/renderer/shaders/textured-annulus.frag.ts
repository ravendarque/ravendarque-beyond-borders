/**
 * Fragment shader for flag texture wrapping around an annulus
 *
 * Replaces the extremely slow CPU-based drawTexturedAnnulus() pixel loop
 * with GPU-accelerated texture sampling.
 */

export const TEXTURED_ANNULUS_SHADER = `
precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

uniform sampler2D u_flagTexture;
uniform vec2 u_center;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  float angle = atan(pos.y, pos.x);
  
  if (radius < u_innerRadius || radius > u_outerRadius) {
    discard;
  }
  
  float u = (angle + PI) / TWO_PI;
  float thickness = u_outerRadius - u_innerRadius;
  float v = (radius - u_innerRadius) / thickness;
  
  vec4 color = texture2D(u_flagTexture, vec2(u, v));
  gl_FragColor = color;
}
`;
