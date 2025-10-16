# Motion & Animation Accessibility

## Overview

This document describes the implementation of motion accessibility features to support users with vestibular disorders or motion sensitivity, in compliance with **WCAG 2.1 Level AAA Success Criterion 2.3.3** (Animation from Interactions).

## Why Motion Accessibility Matters

Users with vestibular disorders, seizure disorders, or motion sensitivity can experience:
- Nausea and dizziness from animations
- Headaches from excessive motion
- Disorientation from parallax or zoom effects
- Seizures from flashing or rapid motion

Supporting `prefers-reduced-motion` is a **critical accessibility feature**.

## Implementation

### 1. CSS Media Query (Automatic)

All animations and transitions are automatically reduced when the user has enabled reduced motion in their system settings:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**What this does:**
- Reduces all animation durations to near-instant (0.01ms)
- Limits animations to single iteration (no loops)
- Converts all transitions to near-instant
- Disables smooth scrolling behavior

**Coverage:**
- ✅ Form control transitions (box-shadow, border-color)
- ✅ Focus indicator animations
- ✅ Skip link transitions (inline styles)
- ✅ Any future animations/transitions

### 2. React Hook (JavaScript Detection)

For cases where you need to conditionally render or disable animations in JavaScript:

```typescript
import { usePrefersReducedMotion } from '@/hooks';

function MyComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  if (prefersReducedMotion) {
    // Disable animations, use instant transitions
    return <StaticVersion />;
  }
  
  return <AnimatedVersion />;
}
```

**Hook Features:**
- ✅ Detects system preference on mount
- ✅ Listens for changes in real-time
- ✅ Handles browser compatibility (checks for `matchMedia` support)
- ✅ Returns boolean: `true` if user prefers reduced motion

**Use Cases:**
- Conditionally rendering animated vs static components
- Disabling JavaScript-based animations
- Providing alternative feedback for motion-based UI
- Loading different assets based on preference

### 3. Current Motion in App

**Transitions Used:**
- Form controls: `box-shadow` and `border-color` transitions (150ms, 120ms)
- Focus indicators: Outline changes (handled by CSS media query)
- Skip links: Inline style changes on focus/blur

**All transitions are automatically disabled** when `prefers-reduced-motion: reduce` is active.

## Testing

### Windows
1. Open **Settings** → **Accessibility** → **Visual effects**
2. Turn **off** "Animation effects"
3. Reload the app
4. Verify all transitions are instant

### macOS
1. Open **System Preferences** → **Accessibility** → **Display**
2. Check **"Reduce motion"**
3. Reload the app
4. Verify all transitions are instant

### iOS
1. Open **Settings** → **Accessibility** → **Motion**
2. Turn **on** "Reduce Motion"
3. Open the app in Safari
4. Verify all transitions are instant

### Android
1. Open **Settings** → **Accessibility**
2. Remove animations (varies by device)
3. Open the app in Chrome
4. Verify all transitions are instant

### Browser DevTools
You can also test in browser DevTools:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "reduce"

**Firefox:**
1. Open DevTools (F12)
2. Click the settings gear icon
3. Under "Advanced settings" check "prefers-reduced-motion: reduce"

## Verification Checklist

- [x] CSS media query implemented for all motion
- [x] `usePrefersReducedMotion` hook created
- [x] Hook exported from `@/hooks`
- [x] All transitions covered by media query
- [x] No vestibular triggers (parallax, zoom, rotation)
- [x] Alternative feedback: Instant visual changes replace animations
- [x] Tested on Windows (Settings → Animation effects off)
- [x] Tested on macOS (System Preferences → Reduce motion on)
- [x] Tested in browser DevTools emulation

## WCAG Compliance

✅ **WCAG 2.1 Level AAA - 2.3.3 Animation from Interactions**
> Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed.

**Compliance Status:**
- ✅ All non-essential animations can be disabled via system preference
- ✅ Alternative instant feedback provided
- ✅ No functionality lost when animations disabled
- ✅ Information conveyed through immediate visual changes

## Future Considerations

If adding new animations:
1. **Always** use CSS transitions/animations (covered by media query)
2. **Or** check `usePrefersReducedMotion()` before applying JavaScript animations
3. **Provide** instant alternatives for motion-based feedback
4. **Avoid** parallax, auto-play videos, or excessive motion
5. **Test** with reduced motion enabled

## Resources

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [A11y Project: Reduced Motion](https://www.a11yproject.com/posts/understanding-vestibular-disorders/)
- [Web.dev: prefers-reduced-motion](https://web.dev/prefers-reduced-motion/)

---

**Last Updated:** October 14, 2025
**Status:** ✅ Complete - All animations respect user preferences
