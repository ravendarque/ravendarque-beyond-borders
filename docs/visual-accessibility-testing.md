# Visual Accessibility Testing Guide

## Overview

This guide provides comprehensive testing procedures for visual accessibility features in the Beyond Borders application, ensuring WCAG 2.1 Level AA compliance.

## Testing Tools

### Color Contrast Checkers
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Stark Plugin** (Figma/Browser): https://www.getstark.co/
- **axe DevTools** (Browser Extension): https://www.deque.com/axe/devtools/
- **Chrome Lighthouse**: Built into Chrome DevTools

### Color Blindness Simulators
- **Coblis** (Web): https://www.color-blindness.com/coblis-color-blindness-simulator/
- **Color Oracle** (Desktop): https://colororacle.org/
- **Chrome DevTools**: Rendering > Emulate vision deficiencies

### High Contrast Mode
- **Windows High Contrast**: Settings > Ease of Access > High Contrast
- **macOS Increase Contrast**: System Preferences > Accessibility > Display > Increase Contrast
- **Chrome Forced Colors**: DevTools > Rendering > Emulate forced colors

## Testing Checklist

### ✅ Color Contrast (WCAG 1.4.3 - Level AA)

#### Normal Text (< 18pt or < 14pt bold)
- [ ] Primary text on background: Minimum 4.5:1 ratio
- [ ] Secondary text on background: Minimum 4.5:1 ratio
- [ ] Link text on background: Minimum 4.5:1 ratio
- [ ] Error message text: Minimum 4.5:1 ratio
- [ ] Form label text: Minimum 4.5:1 ratio

#### Large Text (≥ 18pt or ≥ 14pt bold)
- [ ] Headings on background: Minimum 3:1 ratio
- [ ] Button text on button background: Minimum 3:1 ratio

#### UI Components (WCAG 1.4.11 - Level AA)
- [ ] Button borders: Minimum 3:1 ratio against adjacent colors
- [ ] Form field borders: Minimum 3:1 ratio
- [ ] Focus indicators: Minimum 3:1 ratio
- [ ] Active/selected states: Minimum 3:1 ratio
- [ ] Icon buttons: Minimum 3:1 ratio

### ✅ Focus Visible (WCAG 2.4.7 - Level AA)

- [ ] All interactive elements have visible focus indicator
- [ ] Focus indicator is at least 2px thick (3px recommended)
- [ ] Focus indicator has 3:1 contrast ratio against background
- [ ] Focus indicator is NOT removed with `outline: none`
- [ ] Focus order follows logical reading order
- [ ] Focus indicator visible in both light and dark modes

### ✅ Zoom & Reflow (WCAG 1.4.10 - Level AA)

#### 200% Zoom Testing
1. **Set browser zoom to 200%** (Ctrl/Cmd + Plus until 200%)
2. **Check layout**:
   - [ ] No horizontal scrolling required
   - [ ] Content reflows to fit viewport
   - [ ] Text remains readable
   - [ ] No overlapping elements
   - [ ] All interactive elements remain accessible
3. **Test all pages/views** at 200% zoom

#### 400% Zoom Testing (Optional - Level AAA)
- [ ] Single-column layout activates
- [ ] Content remains usable (may require vertical scrolling)

### ✅ High Contrast Mode

#### Windows High Contrast Mode
1. **Enable**: Windows Settings > Ease of Access > High Contrast
2. **Choose theme**: High Contrast Black or High Contrast White
3. **Test**:
   - [ ] All text remains readable
   - [ ] Buttons have visible borders
   - [ ] Links are underlined or clearly distinguished
   - [ ] Focus indicators are visible
   - [ ] Disabled states are distinguishable
   - [ ] No information lost or hidden
   - [ ] Images/icons that convey information have text alternatives

#### macOS Increase Contrast
1. **Enable**: System Preferences > Accessibility > Display > Increase Contrast
2. **Test**:
   - [ ] All UI elements have enhanced contrast
   - [ ] Text remains readable
   - [ ] Buttons and borders are more visible
   - [ ] Focus indicators remain clear

### ✅ Touch Target Size (WCAG 2.5.5 - Level AAA)

- [ ] All buttons: Minimum 44x44px (48x48px recommended)
- [ ] All links: Minimum 44x44px height with padding
- [ ] Radio buttons: Minimum 44x44px (including label if inline)
- [ ] Checkboxes: Minimum 44x44px (including label if inline)
- [ ] Slider controls: Thumb minimum 44x44px
- [ ] Icon buttons: Minimum 44x44px
- [ ] Spacing between targets: Minimum 8px

### ✅ Color Independence (WCAG 1.4.1 - Level A)

- [ ] No information conveyed by color alone
- [ ] Links distinguishable by underline or other non-color method
- [ ] Required fields indicated by asterisk or "(required)" text
- [ ] Error states indicated by icon + text, not just red color
- [ ] Success states indicated by icon + text, not just green color
- [ ] Charts/graphs have patterns or labels in addition to color

## Testing Procedures

### Procedure 1: Color Contrast Audit

**Tools**: WebAIM Contrast Checker or axe DevTools

1. **Identify all text colors** used in the application
2. **For each text/background combination**:
   - Enter foreground color (e.g., `#0f172a`)
   - Enter background color (e.g., `#ffffff`)
   - Verify ratio meets AA standard (4.5:1 for normal, 3:1 for large)
3. **Document results** in a table
4. **Fix any failures** by adjusting colors

**Example**:
```
Foreground: #6b7280 (secondary text)
Background: #ffffff (white)
Ratio: 4.6:1 ✅ PASS (AA)
```

### Procedure 2: Focus Indicator Testing

**Tools**: Keyboard only, no mouse

1. **Load application**
2. **Tab through all interactive elements**:
   - Upload button
   - Flag selector
   - Radio buttons (presentation style)
   - Sliders (border thickness, inset, flag offset)
   - Background selector
   - Download button
   - Dark mode toggle
3. **Verify for each element**:
   - Focus indicator appears
   - Focus indicator has 3:1 contrast
   - Focus indicator is at least 2-3px thick
   - Focus indicator doesn't obscure content
4. **Test both light and dark modes**

### Procedure 3: Zoom Testing (200%)

**Tools**: Browser zoom (Ctrl/Cmd + Plus)

1. **Set browser zoom to 100%** (baseline)
2. **Increase zoom to 200%** (Ctrl/Cmd + Plus multiple times)
3. **Check for issues**:
   - Horizontal scrolling (FAIL if present)
   - Overlapping text/elements (FAIL)
   - Hidden controls (FAIL)
   - Unreadable text (FAIL)
4. **Navigate through all sections**:
   - Header
   - Controls panel
   - Preview area
   - Error messages (trigger intentionally)
5. **Test responsive breakpoints**: Resize window while zoomed

### Procedure 4: High Contrast Mode Testing

#### Windows
1. **Enable High Contrast**: Settings > Ease of Access > High Contrast
2. **Select High Contrast Black**
3. **Open application in browser**
4. **Test all interactions**:
   - Can you see all text?
   - Are buttons distinguishable?
   - Is focus indicator visible?
   - Can you identify disabled elements?
5. **Repeat with High Contrast White**

#### macOS
1. **Enable Increase Contrast**: System Prefs > Accessibility > Display
2. **Toggle "Increase contrast"**
3. **Test application**
4. **Verify all elements are more visible**

### Procedure 5: Color Blindness Testing

**Tools**: Color Oracle or Chrome DevTools

#### Using Chrome DevTools
1. **Open DevTools** (F12)
2. **Go to Rendering tab** (⋮ menu > More tools > Rendering)
3. **Find "Emulate vision deficiencies"**
4. **Test each condition**:
   - **Protanopia** (no red): Can you still identify all elements?
   - **Deuteranopia** (no green): Can you still identify all elements?
   - **Tritanopia** (no blue): Can you still identify all elements?
   - **Achromatopsia** (no color): Can you still identify all elements?
5. **Verify**:
   - Information not conveyed by color alone
   - UI remains usable
   - Focus indicators remain visible

### Procedure 6: Touch Target Testing

**Tools**: Ruler or browser DevTools

1. **Open DevTools** (F12)
2. **Select an element** (Upload button, Icon button, etc.)
3. **Check Computed tab** for dimensions
4. **Verify**: `width >= 44px` AND `height >= 44px`
5. **For small interactive elements**:
   - Measure including padding
   - Measure including clickable area
   - Test with finger/stylus on touch device if available
6. **Check spacing**: Minimum 8px between adjacent targets

## Testing Report Template

```markdown
## Visual Accessibility Test Report

**Date**: [Date]
**Tester**: [Name]
**Browser**: [Chrome/Firefox/Safari/Edge]
**OS**: [Windows/macOS/Linux]
**Resolution**: [1920x1080 etc.]

### Color Contrast Results

| Element | Foreground | Background | Ratio | Required | Status |
|---------|------------|------------|-------|----------|--------|
| Primary text | #0f172a | #ffffff | 15.7:1 | 4.5:1 | ✅ PASS |
| Secondary text | #6b7280 | #ffffff | 4.6:1 | 4.5:1 | ✅ PASS |
| Button text | #ffffff | #f97316 | 4.7:1 | 4.5:1 | ✅ PASS |

### Focus Indicator Results

- [ ] All interactive elements have focus indicator
- [ ] Focus indicator thickness: [3]px
- [ ] Focus indicator contrast: [3.6]:1
- [ ] Status: ✅ PASS

### Zoom Testing Results (200%)

- [ ] No horizontal scrolling
- [ ] Content reflows naturally
- [ ] All elements accessible
- [ ] Text remains readable
- [ ] Status: ✅ PASS

### High Contrast Mode Results

- [ ] Windows High Contrast Black: ✅ PASS
- [ ] Windows High Contrast White: ✅ PASS
- [ ] macOS Increase Contrast: ✅ PASS

### Touch Target Results

| Element | Width | Height | Status |
|---------|-------|--------|--------|
| Upload button | 48px | 48px | ✅ PASS |
| Icon buttons | 48px | 48px | ✅ PASS |
| Sliders | 44px+ | 44px+ | ✅ PASS |

### Color Blindness Results

- [ ] Protanopia (no red): ✅ PASS
- [ ] Deuteranopia (no green): ✅ PASS
- [ ] Tritanopia (no blue): ✅ PASS
- [ ] Achromatopsia (no color): ✅ PASS

### Overall Assessment

☐ PASS - Meets WCAG 2.1 AA
☐ PASS with minor issues
☐ FAIL - Major accessibility barriers

### Issues Found

1. [Issue description and location]
2. [Issue description and location]

### Recommendations

1. [Recommendation]
2. [Recommendation]
```

## Automated Testing

### Using axe DevTools

1. **Install**: Chrome/Edge/Firefox extension
2. **Open DevTools** > axe DevTools tab
3. **Click "Scan ALL of my page"**
4. **Review violations**:
   - Color contrast issues
   - Missing focus indicators
   - Touch target size issues
5. **Fix violations** and re-scan

### Using Lighthouse

1. **Open DevTools** (F12)
2. **Go to Lighthouse tab**
3. **Select "Accessibility" category**
4. **Generate report**
5. **Review**: Should score 90+ for accessibility
6. **Fix flagged issues**

## Common Issues & Solutions

### Issue: Low contrast text
**Solution**: Increase color darkness/lightness to meet 4.5:1 ratio

### Issue: Focus indicator not visible
**Solution**: Add 3px solid outline with high-contrast color

### Issue: Horizontal scrolling at 200% zoom
**Solution**: Use responsive units (%, rem) instead of fixed pixels

### Issue: Touch targets too small
**Solution**: Add padding or increase min-width/min-height to 44px

### Issue: Information conveyed by color alone
**Solution**: Add icons, text labels, or patterns alongside color

## Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Blindness Simulator**: https://www.color-blindness.com/coblis-color-blindness-simulator/
- **Touch Target Guidance**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Maintained By**: Beyond Borders Development Team
