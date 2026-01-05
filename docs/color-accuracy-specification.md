# Color Accuracy Specification

## Overview

This document defines color space assumptions, accuracy requirements, and
testing procedures for flag color rendering in Beyond Borders.

## Color Space

### Standard: sRGB

All flag colors are assumed to be in the **sRGB color space** unless otherwise specified.

**Rationale:**

- sRGB is the default color space for the web
- Most displays are calibrated for sRGB or similar
- PNG default color space is sRGB
- Canvas 2D API uses sRGB by default

### Future Considerations

- **Display P3**: Wider gamut, supported by modern devices (iPhone 7+,
  MacBook Pro 2016+)
- **Canvas color space API**: Experimental support in some browsers
- **Color profile embedding**: Can embed ICC profiles in PNG exports

## Color Accuracy Requirements

### Tolerance

**±1 in RGB values** (on 0-255 scale)

**Rationale:**

- Sub-pixel variations are imperceptible to human eye
- Allows for rounding in integer arithmetic
- Accounts for color space conversion
- Canvas rendering may have minor variations

### Example

If flag specifies `#5BCEFA` (Trans Pride light blue):

- **Expected:** R=91, G=206, B=250
- **Acceptable:** R=90-92, G=205-207, B=249-251

## Flag Color Sources

### Official Specifications

All flag colors should match official specifications from authoritative sources:

1. **Pride Flags**: [Wikipedia - LGBT symbols](https://en.wikipedia.org/wiki/LGBT_symbols)
2. **Trans Pride**: [Wikipedia - Transgender flags](https://en.wikipedia.org/wiki/Transgender_flags)
3. **National Flags**: [Wikipedia flag pages](https://en.wikipedia.org/wiki/List_of_national_flags_by_design)
   or government sources

### Color Verification Process

1. Find official source (government, creator, Wikipedia)
2. Extract hex color codes
3. Verify against existing flags.json
4. Update if discrepancy found
5. Document source in flags.json

## Known Color Issues

### 1. Display Calibration

**Issue:** Different displays show colors differently
**Impact:** User sees slightly different colors than intended
**Mitigation:** Use sRGB as standard, provide color picker preview

### 2. Color Profiles

**Issue:** PNG export doesn't embed color profile by default
**Impact:** Colors may shift when opened in photo editors
**Mitigation:** Document assumption that sRGB is used

### 3. Monitor Brightness

**Issue:** Low brightness can make dark colors appear black
**Impact:** Color accuracy affected by user settings
**Mitigation:** Test at multiple brightness levels

### 4. Dark Mode

**Issue:** Dark mode may affect color perception
**Impact:** Colors appear different against dark background
**Mitigation:** Provide background color option

## Testing Procedures

### Manual Color Testing

1. Render flag at 1024x1024
2. Use color picker tool (e.g., browser DevTools, Photoshop)
3. Sample pixel from center of each stripe
4. Compare RGB values to specification
5. Verify within ±1 tolerance

### Automated Color Testing

Color accuracy testing utilities were removed as they were not integrated into
the test suite. Manual color testing procedures should be used instead.

### Visual Inspection

1. Display reference flag image side-by-side with rendered version
2. Check for visible color differences
3. Verify stripe order matches
4. Check stripe proportions are correct

## Color Accuracy Checklist

### Trans Pride Flag

- [ ] `#5BCEFA` - Light blue (R=91, G=206, B=250)
- [ ] `#F5A9B8` - Light pink (R=245, G=169, B=184)
- [ ] `#FFFFFF` - White (R=255, G=255, B=255)

### Progress Pride Flag (Rainbow stripes)

- [ ] `#E40303` - Red (R=228, G=3, B=3)
- [ ] `#FF8C00` - Orange (R=255, G=140, B=0)
- [ ] `#FFED00` - Yellow (R=255, G=237, B=0)
- [ ] `#008026` - Green (R=0, G=128, B=38)
- [ ] `#004DFF` - Blue (R=0, G=77, B=255)
- [ ] `#750787` - Violet (R=117, G=7, B=135)

### Non-Binary Flag

- [ ] `#FFF430` - Yellow (R=255, G=244, B=48)
- [ ] `#FFFFFF` - White (R=255, G=255, B=255)
- [ ] `#9C59D1` - Purple (R=156, G=89, B=209)
- [ ] `#2C2C2C` - Black (R=44, G=44, B=44)

### Bisexual Flag

- [ ] `#D60270` - Magenta (R=214, G=2, B=112)
- [ ] `#9B4F96` - Purple (R=155, G=79, B=150)
- [ ] `#0038A8` - Blue (R=0, G=56, B=168)

### Lesbian Flag

- [ ] `#D62900` - Dark orange (R=214, G=41, B=0)
- [ ] `#FF9B55` - Orange (R=255, G=155, B=85)
- [ ] `#FFFFFF` - White (R=255, G=255, B=255)
- [ ] `#D461A6` - Pink (R=212, G=97, B=166)
- [ ] `#A50062` - Dark rose (R=165, G=0, B=98)

### Pansexual Flag

- [ ] `#FF218C` - Magenta (R=255, G=33, B=140)
- [ ] `#FFD800` - Yellow (R=255, G=216, B=0)
- [ ] `#21B1FF` - Cyan (R=33, G=177, B=255)

### Asexual Flag

- [ ] `#000000` - Black (R=0, G=0, B=0)
- [ ] `#A3A3A3` - Gray (R=163, G=163, B=163)
- [ ] `#FFFFFF` - White (R=255, G=255, B=255)
- [ ] `#800080` - Purple (R=128, G=0, B=128)

## Color Space Conversion Notes

### Hex to RGB

```typescript
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex); // Expand #F00 to #FF0000
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}
```

### RGB to Hex

```typescript
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
```

### Color Distance (Euclidean)

```typescript
function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
// Distance of 1.732 ≈ tolerance of ±1 in each channel
```

## Recommendations

### For Developers

1. Always use hex colors from official sources
2. Test colors after any renderer changes
3. Use color validation utilities
4. Document color sources in flags.json

### For Designers

1. Use sRGB color space in design tools
2. Calibrate monitor for accurate colors
3. Test on multiple devices
4. Provide hex codes for all colors

### For Users

1. Use calibrated display for best results
2. Adjust brightness for accurate perception
3. Compare to official flag images
4. Report color inaccuracies via GitHub issues

## Future Enhancements

### Phase 1 (Optional)

- [ ] Add color picker to UI for custom colors
- [ ] Show color codes on hover
- [ ] Add "compare to reference" mode

### Phase 2 (Advanced)

- [ ] Support Display P3 color space
- [ ] Embed ICC color profile in PNG exports
- [ ] Use Canvas color space API when available
- [ ] Add color blindness simulation mode

### Phase 3 (Professional)

- [ ] HDR color support
- [ ] Wide gamut displays
- [ ] Lab color space for perceptual accuracy
- [ ] Professional color management

## References

- [sRGB - Wikipedia](https://en.wikipedia.org/wiki/SRGB)
- [Display P3 - Wikipedia](https://en.wikipedia.org/wiki/DCI-P3#Display_P3)
- [Canvas color space specification](https://www.w3.org/TR/css-color-4/)
- [ICC color profiles](https://www.color.org/icc_specs2.xalter)

## Version History

- **v1.0** (2025-10-09): Initial specification
  - Defined sRGB as standard color space
  - Set ±1 RGB tolerance
  - Created color accuracy checklist
  - Documented testing procedures
