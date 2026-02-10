# Shader Anti-Aliasing Technique for Concentric Color Rings

## Problem
Rendering concentric colored rings with smooth edges but distinct color bands. Need to avoid:
- Jagged edges on circles (especially at cardinal points)
- Overly blurry color transitions
- Performance issues from multi-pass rendering

## Solution: Narrow Transition Zones with Smoothstep

### Key Technique
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

### Why This Works
1. **Each color band is solid for 90% of its width** - gives distinct, clear colors
2. **Smooth 10% transition zone** - prevents hard edges and aliasing between colors
3. **`smoothstep(0.9, 1.0, ...)` creates the narrow blend** - starts blending at 90% through the band
4. **No texture sampling** - pure mathematical gradient, resolution-independent

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

### Full Shader Example
See: `webgl-test.html` - RING_SHADER (lines ~239-280)

### Results
- ✅ Beautiful distinct color bands
- ✅ Smooth transitions between colors
- ✅ No jagged edges
- ✅ Fast single-pass rendering
- ✅ Resolution-independent

### Adjusting Transition Width
To make transitions wider/narrower, adjust the smoothstep range:
- **Narrower (5% transition):** `smoothstep(0.95, 1.0, localPos)`
- **Current (10% transition):** `smoothstep(0.9, 1.0, localPos)` ✅ PERFECT
- **Wider (20% transition):** `smoothstep(0.8, 1.0, localPos)`

### Date Discovered
2026-02-09

### References
- Working implementation: `webgl-test.html`
- SmoothStep reference: https://smoothstep.io/anim/6c214a0d19e4
