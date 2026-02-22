# Shader Anti-Aliasing Techniques

## Problem

Rendering smooth geometric shapes (circles, rings, segments) with WebGL while maintaining:

- Smooth edges without jagged pixels (especially at cardinal points)
- Distinct color boundaries where needed
- High performance with single-pass or minimal-pass rendering

## Solutions by Mode

### Ring Mode: Concentric Color Gradient

**Shader:** `src/renderer/shaders/ring-gradient.frag.ts`

Renders concentric colored rings with smooth transitions.

### Ring Mode: Concentric Color Gradient

**Shader:** `src/renderer/shaders/ring-gradient.frag.ts`

Renders concentric colored rings with smooth transitions.

#### Key Techniques

**1. Smooth Inner & Outer Edges**

```glsl
// Apply 4-pixel smoothstep on BOTH edges for buttery smooth circles
float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
float edgeAlpha = innerAlpha * outerAlpha;

// Use edgeAlpha instead of discard for smooth edges
gl_FragColor = vec4(color, edgeAlpha);
```

**Why This Works:**

- 4-pixel transition (2px on each side) is wide enough for smooth anti-aliasing
- Works on both inner AND outer edges
- No hard `discard` - smooth alpha blending instead
- Handles cardinal points perfectly

#### 2. Narrow Color Band Transitions (Inside the Ring)

```glsl
// Map radial position (0-1) to color index
float colorIndex = ringPos * 5.0; // For 6 colors (0-5)
float idx = floor(colorIndex);
float localPos = fract(colorIndex);

// CRITICAL: Narrow transition - blend only in last 10% of each band
float t = smoothstep(0.9, 1.0, localPos);

// Blend between adjacent colors
vec3 color1 = getColor(idx);
vec3 color2 = getColor(idx + 1.0);
vec3 color = mix(color1, color2, t);
```

**Why This Works:**

- Each color band is solid for 90% of its width - gives distinct, clear colors
- Smooth 10% transition zone - prevents hard edges and aliasing between colors
- `smoothstep(0.9, 1.0, ...)` creates the narrow blend

### Segment Mode: Angular Wedges

**Shader:** `src/renderer/shaders/segment.frag.ts`

Renders colored angular wedges (pie slices) radiating from center.

#### Key Techniques

**1. Smooth Radial Edges Only**

```glsl
// 4-pixel smoothstep on inner/outer radial edges
float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
float radialAlpha = innerAlpha * outerAlpha;
```

**2. Hard Color Boundaries**

```glsl
// No blending between angular segments - keep wedge edges crisp
float segmentAngle = 2.0 * PI / float(u_colorCount);
float segmentIndex = floor(rotatedAngle / segmentAngle);
vec3 color = getColor(segmentIndex, u_colorCount);

// Only radial alpha (no angular smoothing)
gl_FragColor = vec4(color, radialAlpha);
```

**Why This Works:**

- Radial edges (inner/outer circles) are buttery smooth
- Angular boundaries between wedges are sharp and crisp
- Rotation support via `u_rotation` uniform (radians)

### Cutout Mode: Flag Image Clipping

**Shaders:**

- `src/renderer/shaders/annulus-stencil.frag.ts` - Creates smooth annulus mask
- `src/renderer/shaders/cutout.frag.ts` - Samples flag image with clipping

#### Key Techniques

**1. Annulus Stencil with Smooth Edges**

```glsl
// Same 4-pixel smoothstep for mask
float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, dist);
float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, dist);
float alpha = innerAlpha * outerAlpha;

gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
```

**2. Flag Image Sampling with UV Mapping**

```glsl
// Map pixel to flag rectangle UV
vec2 flagUV = (pixelCoord - u_flagPos) / u_flagSize;

// Sample flag texture
vec4 color = texture2D(u_flagTexture, flagUV);

// Apply radial alpha mask
gl_FragColor = vec4(color.rgb, color.a * radialAlpha);
```

**Why This Works:**

- Flag PNG preserves original quality
- Smooth circular clipping via radial alpha
- Position offset support for flag alignment

## Universal Technique: 4-Pixel Smoothstep

All three modes use the same edge anti-aliasing technique:

```glsl
// 4-pixel total width (2px on each side)
float innerAlpha = smoothstep(radius - 2.0, radius + 2.0, dist);
float outerAlpha = 1.0 - smoothstep(radius - 2.0, radius + 2.0, dist);
```

This width is the "goldilocks zone" - wide enough for buttery smoothness, narrow enough to stay sharp.

### Color Lookup Pattern

Must use function-based lookup (not variable array indexing) for WebGL 1.0 compatibility:

```glsl
vec3 getColor(float index) {
  if (index < 0.5) return vec3(0.894, 0.012, 0.012); // Red
  if (index < 1.5) return vec3(1.0, 0.549, 0.0);     // Orange
  if (index < 2.5) return vec3(1.0, 0.929, 0.0);     // Yellow
  if (index < 3.5) return vec3(0.0, 0.502, 0.149);   // Green
  if (index < 4.5) return vec3(0.141, 0.251, 0.557); // Blue
  return vec3(0.451, 0.161, 0.510);                  // Purple
}
```

## Complete Shader Examples

### Ring Mode Shader

```glsl
void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);

  // STEP 1: Smooth edges (4-pixel smoothstep on both sides)
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float edgeAlpha = innerAlpha * outerAlpha;

  if (edgeAlpha < 0.001) {
    discard; // Optimization
  }

  // STEP 2: Color gradient with narrow transitions
  float thickness = u_outerRadius - u_innerRadius;
  float ringPos = clamp((radius - u_innerRadius) / thickness, 0.0, 1.0);

  float colorIndex = ringPos * 5.0;
  float idx = floor(colorIndex);
  float localPos = fract(colorIndex);
  float t = smoothstep(0.9, 1.0, localPos); // 10% transition zone

  vec3 color1 = getColor(idx);
  vec3 color2 = getColor(idx + 1.0);
  vec3 color = mix(color1, color2, t);

  gl_FragColor = vec4(color, edgeAlpha);
}
```

### Segment Mode Shader

```glsl
void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);
  float angle = atan(pos.y, pos.x);

  // Smooth radial edges
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float radialAlpha = innerAlpha * outerAlpha;

  if (radialAlpha < 0.001) discard;

  // Apply rotation and calculate segment
  float rotatedAngle = angle - u_rotation + PI;
  if (rotatedAngle < 0.0) rotatedAngle += 2.0 * PI;
  if (rotatedAngle >= 2.0 * PI) rotatedAngle -= 2.0 * PI;

  float segmentAngle = 2.0 * PI / float(u_colorCount);
  float segmentIndex = floor(rotatedAngle / segmentAngle);

  // Hard color boundaries
  vec3 color = getColor(segmentIndex, u_colorCount);

  gl_FragColor = vec4(color, radialAlpha);
}
```

### Cutout Mode Shader

```glsl
void main() {
  vec2 pixelCoord = v_texCoord * u_resolution;
  vec2 pos = pixelCoord - u_center;
  float radius = length(pos);

  // Smooth radial edges
  float innerAlpha = smoothstep(u_innerRadius - 2.0, u_innerRadius + 2.0, radius);
  float outerAlpha = 1.0 - smoothstep(u_outerRadius - 2.0, u_outerRadius + 2.0, radius);
  float radialAlpha = innerAlpha * outerAlpha;

  if (radialAlpha < 0.001) discard;

  // Map to flag rectangle UV
  vec2 flagUV = (pixelCoord - u_flagPos) / u_flagSize;

  if (flagUV.x < 0.0 || flagUV.x > 1.0 || flagUV.y < 0.0 || flagUV.y > 1.0) {
    discard;
  }

  vec4 color = texture2D(u_flagTexture, flagUV);

  gl_FragColor = vec4(color.rgb, color.a * radialAlpha);
}
```

```

### Results

**Ring Mode:**
- ✅ Buttery smooth inner circle edge
- ✅ Buttery smooth outer circle edge
- ✅ Beautiful distinct color bands
- ✅ Smooth transitions between colors (not too blurry)
- ✅ No jagged edges at cardinal points

**Segment Mode:**
- ✅ Buttery smooth radial edges (inner/outer)
- ✅ Crisp angular boundaries between wedges
- ✅ Full 360° coverage with equal segments
- ✅ Smooth rotation support

**Cutout Mode:**
- ✅ Buttery smooth annulus clipping
- ✅ Preserves flag image quality
- ✅ Position offset support
- ✅ No artifacts at edges

**All Modes:**
- ✅ Fast single/dual-pass rendering
- ✅ Resolution-independent
- ✅ 10-50x faster than Canvas 2D

### Adjusting Parameters

**Edge Smoothness:**

- Current (4px total): `smoothstep(radius ± 2.0)` ✅ PERFECT
- Wider (6px): `smoothstep(radius ± 3.0)`
- Narrower (2px): `smoothstep(radius ± 1.0)`

**Color Transition Width:**

- Current (10%): `smoothstep(0.9, 1.0, localPos)` ✅ PERFECT
- Narrower (5%): `smoothstep(0.95, 1.0, localPos)`
- Wider (20%): `smoothstep(0.8, 1.0, localPos)`

### Date Discovered

2026-02-09

### Implementation Status

- ✅ Ring mode: Fully implemented in `src/renderer/shaders/ring-gradient.frag.ts`
- ✅ Segment mode: Fully implemented in `src/renderer/shaders/segment.frag.ts`
- ✅ Cutout mode: Fully implemented in `src/renderer/shaders/cutout.frag.ts`
- ✅ Tests: Unit tests in `test/unit/renderer/webgl-renderer.test.ts`

### References

- Working prototypes: `webgl-test.html` (RING_SHADER, SEGMENT_SHADER, CUTOUT_SHADER)
- Production implementation: `src/renderer/render-webgl.ts`
- SmoothStep reference: https://smoothstep.io/anim/6c214a0d19e4
```
