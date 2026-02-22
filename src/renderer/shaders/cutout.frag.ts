/**
 * Fragment shader for flag image cutout with buttery smooth anti-aliasing
 *
 * Renders a flag PNG image clipped to an annulus shape with:
 * - 4-pixel smoothstep on inner/outer radial edges for smooth circular boundaries
 * - Flag image sampling with UV mapping
 * - Position offset support for flag alignment
 *
 * Cutout mode displays the actual flag image (PNG) in the ring area, clipped to
 * a smooth annulus shape. The user's image appears in the center circle.
 */

export const CUTOUT_SHADER = `
precision mediump float;

uniform sampler2D u_flagTexture;
uniform vec2 u_center;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform vec2 u_resolution;
uniform vec2 u_flagSize; // Width and height of flag rectangle
uniform vec2 u_flagPos;  // Top-left position of flag rectangle

varying vec2 v_texCoord;

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // Smooth anti-aliasing on BOTH radial edges (inner and outer)
  // Use wider smoothstep (2 pixels on each side = 4 pixels total) for buttery smoothness
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float radialAlpha = innerAlpha * outerAlpha;
  
  // Early exit if outside the annulus
  if (radialAlpha < 0.001) {
    discard;
  }
  
  // Map pixel position to flag rectangle UV coordinates
  // The flag is drawn as a rectangle, then clipped to the annulus
  vec2 flagUV = (pixelCoord - u_flagPos) / u_flagSize;
  
  // If outside flag rectangle bounds, discard
  if (flagUV.x < 0.0 || flagUV.x > 1.0 || flagUV.y < 0.0 || flagUV.y > 1.0) {
    discard;
  }
  
  vec4 color = texture2D(u_flagTexture, flagUV);
  
  gl_FragColor = vec4(color.rgb, color.a * radialAlpha);
}
`;
