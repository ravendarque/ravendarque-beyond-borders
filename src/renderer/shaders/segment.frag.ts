/**
 * Fragment shader for angular segment rendering with buttery smooth anti-aliasing
 *
 * Renders colored angular wedges (pie slices) with:
 * - 4-pixel smoothstep on inner/outer radial edges for smooth circular boundaries
 * - Hard color boundaries between angular segments (no blending) for crisp wedge edges
 * - Rotation support for dynamic orientation
 * - Dynamic color array support from flag specifications
 *
 * Segment mode displays the flag colors as angular wedges radiating from the center.
 */

export const SEGMENT_SHADER = `
precision mediump float;

#define PI 3.14159265359

uniform vec2 u_center;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform vec2 u_resolution;
uniform float u_rotation;
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
  float angle = atan(pos.y, pos.x);
  
  // Smooth anti-aliasing on BOTH radial edges (inner and outer)
  // Use wider smoothstep (2 pixels on each side = 4 pixels total) for buttery smoothness
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float radialAlpha = innerAlpha * outerAlpha;
  
  // Early exit if outside the annulus
  if (radialAlpha < 0.001) {
    discard;
  }
  
  // Apply rotation and normalize angle to 0 to 2*PI
  float rotatedAngle = angle - u_rotation + PI;
  if (rotatedAngle < 0.0) rotatedAngle += 2.0 * PI;
  if (rotatedAngle >= 2.0 * PI) rotatedAngle -= 2.0 * PI;
  
  // Equal angular segments based on color count
  float segmentAngle = 2.0 * PI / float(u_colorCount);
  float segmentIndex = floor(rotatedAngle / segmentAngle);
  
  // Hard color boundaries - no blending between segments for crisp edges
  vec3 color = getColor(segmentIndex, u_colorCount);
  
  // Only apply radial alpha smoothing (no angular smoothing - keep wedge edges sharp)
  gl_FragColor = vec4(color, radialAlpha);
}
`;
