/**
 * Single-pass avatar shader for ring mode with buttery smooth anti-aliasing
 *
 * This shader combines image masking and ring gradient rendering in a single pass,
 * eliminating the need for multiple framebuffers and compositing.
 *
 * Features:
 * - Circular image mask with 4-pixel smoothstep
 * - Concentric ring gradient with 10% color transitions
 * - Alpha blending between image and border
 * - Resolution-independent anti-aliasing
 */

export const AVATAR_RING_SHADER = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
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
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === RING LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Hard cutoff at the outer boundary — CSS border-radius on the canvas element provides
  // the circular anti-aliased clip, so shader AA here only adds a semi-transparent colour halo.
  float ringOuterAlpha = 1.0 - step(u_ringOuterRadius, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec3 ringColor = vec3(0.0);
  if (ringAlpha > 0.001) {
    // Concentric gradient — reversed so color[0] is outermost, matching Canvas 2D renderer
    // which draws "outer->inner to preserve stripe order (top => outer)".
    float thickness = u_ringOuterRadius - u_ringInnerRadius;
    float ringPos = 1.0 - clamp((radius - u_ringInnerRadius) / thickness, 0.0, 1.0);
    
    // Divide ring into u_colorCount equal bands (not u_colorCount-1).
    // Using colorCount-1 shrinks the last band to a single anti-aliased pixel at the outer edge.
    float colorRange = float(u_colorCount);
    float colorIndex = ringPos * colorRange;
    float idx = floor(colorIndex);
    float localPos = fract(colorIndex);
    
    // 10% transition zone
    float t = smoothstep(0.9, 1.0, localPos);
    
    vec3 color1 = getColor(idx, u_colorCount);
    vec3 color2 = getColor(idx + 1.0, u_colorCount);
    ringColor = mix(color1, color2, t);
  }
  
  // === COMPOSITE ===
  // Ring on top of image (standard over operation)
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - ringAlpha) + ringColor * ringAlpha;
  float finalAlpha = imageColor.a + ringAlpha * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;
