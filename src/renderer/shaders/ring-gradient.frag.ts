/**
 * Fragment shader for concentric ring gradient with buttery smooth anti-aliasing
 *
 * Renders a multi-color concentric ring pattern with:
 * - 4-pixel smoothstep on inner/outer edges for smooth circular boundaries
 * - Narrow (10%) color transitions for distinct bands with smooth blending
 * - Dynamic color array support from flag specifications
 *
 * This replaces the textured-annulus shader for better performance and smoother rendering.
 */

export const RING_GRADIENT_SHADER = `
precision mediump float;

uniform vec2 u_center;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform vec2 u_resolution;
uniform int u_colorCount;
uniform vec3 u_colors[16]; // Max 16 colors (sufficient for all flags)

varying vec2 v_texCoord;

vec3 getColor(float index, int count) {
  // Clamp index to valid range
  int idx = int(clamp(index, 0.0, float(count - 1)));
  
  // Return color from array (use if-else for WebGL 1.0 compatibility)
  for (int i = 0; i < 16; i++) {
    if (i == idx && i < count) {
      return u_colors[i];
    }
  }
  
  return vec3(0.0); // Fallback (should never reach)
}

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // Smooth anti-aliasing on BOTH edges (inner and outer)
  // Use wider smoothstep (2 pixels on each side = 4 pixels total) for buttery smoothness
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float edgeAlpha = innerAlpha * outerAlpha;
  
  // Early exit if completely transparent (optimization)
  if (edgeAlpha < 0.001) {
    discard;
  }
  
  // Concentric gradient from inner to outer
  float thickness = u_outerRadius - u_innerRadius;
  float ringPos = clamp((radius - u_innerRadius) / thickness, 0.0, 1.0);
  
  // Map ringPos (0-1) to color index (0 to colorCount-1)
  float colorRange = float(u_colorCount - 1);
  float colorIndex = ringPos * colorRange;
  float idx = floor(colorIndex);
  float localPos = fract(colorIndex);
  
  // Narrow transition: blend only in the last 10% of each band
  // This keeps colors distinct while preventing aliasing at boundaries
  float t = smoothstep(0.9, 1.0, localPos);
  
  // Blend between adjacent colors
  vec3 color1 = getColor(idx, u_colorCount);
  vec3 color2 = getColor(idx + 1.0, u_colorCount);
  vec3 color = mix(color1, color2, t);
  
  gl_FragColor = vec4(color, edgeAlpha);
}
`;
