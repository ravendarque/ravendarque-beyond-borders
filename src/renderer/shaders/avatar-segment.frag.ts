/**
 * Single-pass avatar shader for segment mode with buttery smooth anti-aliasing
 *
 * This shader combines image masking and angular segment rendering in a single pass,
 * eliminating the need for multiple framebuffers and compositing.
 *
 * Features:
 * - Circular image mask with 4-pixel smoothstep
 * - Angular wedges with hard color boundaries
 * - Rotation support
 * - Resolution-independent anti-aliasing
 */

export const AVATAR_SEGMENT_SHADER = `
precision mediump float;

#define PI 3.14159265359

uniform sampler2D u_image;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
uniform float u_rotation;
uniform int u_colorCount;
uniform vec3 u_colors[16]; // Max 16 colors

varying vec2 v_texCoord;

vec3 getColor(float index, int count) {
  int idx = int(clamp(index, 0.0, float(count - 1)));
  
  for (int i = 0; i < 16; i++) {
    if (i == idx && i < count) {
      return u_colors[i];
    }
  }
  
  return vec3(0.0);
}

void main() {
  // Flip Y so pixelCoord matches standard top-down canvas convention (WebGL's v_texCoord/NDC
  // has Y increasing upward; all position uniforms from JS assume Y increasing downward, same
  // as Canvas 2D and every other coordinate the app computes).
  vec2 pixelCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y) * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  // pos.y now increases downward (top-down convention, same as pixelCoord above), so angles
  // increase clockwise from the positive-x axis, matching Canvas 2D's atan2(y, x) convention.
  // Use PI/2 offset so segment 0 starts at 12 o'clock (North), matching the
  // Canvas 2D renderer which uses start = -PI/2 + rotationRad.
  float angle = atan(pos.y, pos.x);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === SEGMENT LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Smoothstep on both edges — the outer edge must be anti-aliased here rather than relying
  // on CSS clipping, since this shader also renders to a bare OffscreenCanvas for PNG export.
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // +PI/2 shifts segment 0 to start at top (12 o'clock), matching Canvas 2D's -PI/2 start.
    // Subtracting u_rotation rotates clockwise, matching Canvas 2D's +rotationRad offset.
    float rotatedAngle = angle + (PI / 2.0) - u_rotation;
    if (rotatedAngle < 0.0) rotatedAngle += 2.0 * PI;
    if (rotatedAngle >= 2.0 * PI) rotatedAngle -= 2.0 * PI;
    
    // Calculate segment
    float segmentAngle = 2.0 * PI / float(u_colorCount);
    float segmentIndex = floor(rotatedAngle / segmentAngle);
    
    ringColor = getColor(segmentIndex, u_colorCount);
  }
  
  // === COMPOSITE ===
  // Ring on top of image
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - ringAlpha) + ringColor * ringAlpha;
  float finalAlpha = imageColor.a + ringAlpha * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;
