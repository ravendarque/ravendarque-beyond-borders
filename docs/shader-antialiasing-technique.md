# Shader Anti-Aliasing Technique for Concentric Color Rings

## Problem

Rendering concentric colored rings with smooth edges but distinct color bands. Need to avoid:

- Jagged edges on circles (especially at cardinal points)
- Overly blurry color transitions
- Performance issues from multi-pass rendering

## Solution: Narrow Transition Zones with Smoothstep

### Key Techniques

#### 1. Smooth Inner & Outer Edges (The Ring Border)

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

### Complete Shader Implementation

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

### Results

- ✅ Buttery smooth inner circle edge
- ✅ Buttery smooth outer circle edge
- ✅ Beautiful distinct color bands inside the ring
- ✅ Smooth transitions between colors (not too blurry)
- ✅ No jagged edges at cardinal points
- ✅ Fast single-pass rendering
- ✅ Resolution-independent

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

### References

- Working implementation: `webgl-test.html` - RING_SHADER
- SmoothStep reference: https://smoothstep.io/anim/6c214a0d19e4
