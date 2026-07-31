/**
 * Single-pass avatar shader for cutout mode with buttery smooth anti-aliasing
 *
 * This shader combines image masking and flag PNG clipping in a single pass,
 * eliminating the need for multiple framebuffers and compositing.
 *
 * Features:
 * - Circular image mask with 4-pixel smoothstep
 * - Flag PNG sampling with circular clipping
 * - Position offset support
 * - Resolution-independent anti-aliasing
 */

export const AVATAR_CUTOUT_SHADER = `
precision mediump float;

uniform sampler2D u_image;
uniform sampler2D u_flagTexture;
uniform vec2 u_center;
uniform float u_imageRadius;
uniform float u_ringInnerRadius;
uniform float u_ringOuterRadius;
uniform vec2 u_resolution;
uniform vec2 u_flagSize;
uniform vec2 u_flagPos;

varying vec2 v_texCoord;

void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  
  // === IMAGE LAYER ===
  vec4 imageColor = texture2D(u_image, v_texCoord);
  float imageAlpha = 1.0 - smoothstep(u_imageRadius - 2.0, u_imageRadius + 2.0, radius);
  imageColor.a *= imageAlpha;
  
  // === FLAG LAYER ===
  float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
  // Smoothstep on both edges — the outer edge must be anti-aliased here rather than relying
  // on CSS clipping, since this shader also renders to a bare OffscreenCanvas for PNG export.
  float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
  float ringAlpha = ringInnerAlpha * ringOuterAlpha;
  
  vec4 flagColor = vec4(0.0);
  if (ringAlpha > 0.001) {
    // Map to flag rectangle UV
    vec2 flagUV = (pixelCoord - u_flagPos) / u_flagSize;
    
    // Sample flag texture if within bounds
    if (flagUV.x >= 0.0 && flagUV.x <= 1.0 && flagUV.y >= 0.0 && flagUV.y <= 1.0) {
      flagColor = texture2D(u_flagTexture, flagUV);
      flagColor.a *= ringAlpha;
    }
  }
  
  // === COMPOSITE ===
  // Flag on top of image
  vec3 finalColor = imageColor.rgb * imageColor.a * (1.0 - flagColor.a) + flagColor.rgb * flagColor.a;
  float finalAlpha = imageColor.a + flagColor.a * (1.0 - imageColor.a);
  
  // Early exit if fully transparent
  if (finalAlpha < 0.001) {
    discard;
  }
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;
