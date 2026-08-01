# Shader Anti-Aliasing Technique

## Problem

Rendering smooth geometric shapes (circles, rings, segments) with WebGL while maintaining:

- Smooth edges without jagged pixels (especially at cardinal points)
- Distinct color boundaries where needed
- High performance with single-pass rendering
- Correct output on **both** the live `<canvas>` preview and a bare `OffscreenCanvas` export target (no DOM/CSS clipping available on export)

## Universal technique: 4-pixel smoothstep on both edges

All three production shaders (`src/renderer/shaders/avatar-ring.frag.ts`, `avatar-segment.frag.ts`, `avatar-cutout.frag.ts`) apply the same edge anti-aliasing to both the inner and outer ring radius:

```glsl
float ringInnerAlpha = smoothstep(u_ringInnerRadius - 2.0, u_ringInnerRadius + 2.0, radius);
float ringOuterAlpha = 1.0 - smoothstep(u_ringOuterRadius - 2.0, u_ringOuterRadius + 2.0, radius);
float ringAlpha = ringInnerAlpha * ringOuterAlpha;
```

- 4-pixel transition (2px each side) is wide enough for smooth anti-aliasing, narrow enough to stay sharp
- Works identically for both consumers of these shaders: `LiveAvatarRenderer` (`src/renderer/live-renderer.ts`, persistent context, live preview) and `renderAvatarWebGL` (`src/renderer/render-webgl.ts`, one-shot context, PNG export)
- No hard `discard` on the ring edges — smooth alpha blending instead

The outer edge previously used a hard `step()` instead, on the assumption that CSS `border-radius` on the live preview's `<canvas>` element would provide the circular clip. That's true for the DOM canvas (`AvatarPreviewCanvas.tsx` still applies it as a harmless redundant safety net) but not for the export path's bare `OffscreenCanvas`, which has no DOM/CSS at all — so a hard outer edge meant exported PNGs had a jagged, non-anti-aliased outer boundary. Both shaders now anti-alias identically; there's no per-consumer special-casing.

## Per-mode details

### Ring mode (`avatar-ring.frag.ts`)

Concentric color gradient. Narrow color-band transitions use a separate technique — only the last 10% of each band blends into the next:

```glsl
float t = smoothstep(0.9, 1.0, localPos);
vec3 color = mix(color1, color2, t);
```

Each band is solid for 90% of its width for distinct, clear colors, with a smooth 10% transition preventing hard edges between colors.

### Segment mode (`avatar-segment.frag.ts`)

Angular wedges radiating from center. Radial edges (inner/outer circle) use the same smoothstep technique above; angular boundaries between wedges are intentionally hard (`floor(rotatedAngle / segmentAngle)`, no blending) — segments should read as distinct wedges, not gradients.

### Cutout mode (`avatar-cutout.frag.ts`)

Samples a flag PNG through the same ring-shaped alpha mask (smoothstep on both edges), mapping screen pixels to flag-texture UV via `u_flagPos`/`u_flagSize`. Those uniforms are computed from the ring's **outer diameter and the flag image's own aspect ratio** (not the ring's circumference — an earlier version of `render-webgl.ts` used circumference-based sizing, which visibly mis-scaled the flag; `live-renderer.ts` and `render-webgl.ts` now share the same diameter-based formula).

## Color lookup pattern

WebGL 1.0 doesn't allow indexing a uniform array with a non-constant index, so color lookup uses a loop-based function instead of `u_colors[index]`:

```glsl
vec3 getColor(float index, int count) {
  int idx = int(clamp(index, 0.0, float(count - 1)));
  for (int i = 0; i < 16; i++) {
    if (i == idx && i < count) {
      return u_colors[i];
    }
  }
  return vec3(0.0);
}
```

## References

- Production implementation: `src/renderer/shaders/avatar-ring.frag.ts`, `avatar-segment.frag.ts`, `avatar-cutout.frag.ts`
- Consumers: `src/renderer/live-renderer.ts` (live preview), `src/renderer/render-webgl.ts` (export)
- Tests: `test/unit/renderer/webgl-renderer.test.ts`
