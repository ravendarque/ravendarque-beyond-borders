/**
 * Fragment shader for compositing the image and border layers
 *
 * Combines the masked image layer with the flag border layer using
 * GPU-accelerated alpha blending.
 */

export const RING_COMPOSITE_SHADER = `
precision mediump float;

uniform sampler2D u_imageLayer;
uniform sampler2D u_borderLayer;

varying vec2 v_texCoord;

void main() {
  vec4 imageColor = texture2D(u_imageLayer, v_texCoord);
  vec4 borderColor = texture2D(u_borderLayer, v_texCoord);
  
  float alpha = borderColor.a + imageColor.a * (1.0 - borderColor.a);
  vec3 rgb = borderColor.rgb * borderColor.a + imageColor.rgb * imageColor.a * (1.0 - borderColor.a);
  
  if (alpha > 0.0) {
    rgb /= alpha;
  }
  
  gl_FragColor = vec4(rgb, alpha);
}
`;
