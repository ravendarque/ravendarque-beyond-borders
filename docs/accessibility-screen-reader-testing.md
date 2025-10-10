# Screen Reader Testing Guide

## Overview

This document provides comprehensive guidance for testing the Beyond Borders application with screen readers to ensure WCAG 2.1 AA compliance.

## Screen Readers to Test

### Windows
- **NVDA** (Free, Open Source)
  - Download: https://www.nvaccess.org/download/
  - Most commonly used free screen reader
  - Excellent for testing ARIA implementation

- **JAWS** (Commercial, Industry Standard)
  - Website: https://www.freedomscientific.com/products/software/jaws/
  - Most widely used commercial screen reader
  - Industry standard for accessibility testing

### macOS/iOS
- **VoiceOver** (Built-in)
  - Enable: System Preferences > Accessibility > VoiceOver
  - Keyboard shortcut: Command+F5
  - Native Apple screen reader

### Android
- **TalkBack** (Built-in)
  - Enable: Settings > Accessibility > TalkBack
  - Native Android screen reader

## Testing Checklist

### ✅ Navigation & Structure

- [ ] Page landmarks are properly announced (main, banner, navigation, complementary)
- [ ] Heading hierarchy is logical (H1 > H2 > H3)
- [ ] Skip links work (Skip to main content, Skip to controls, Skip to preview)
- [ ] All interactive elements are reachable via Tab key
- [ ] Tab order follows logical reading order

### ✅ Interactive Elements

- [ ] All buttons have descriptive labels
- [ ] Icon buttons announce their purpose (e.g., "Switch to dark mode")
- [ ] Form inputs have associated labels
- [ ] Radio buttons announce group label and individual options
- [ ] Sliders announce current value, min, max, and instructions
- [ ] Select dropdowns announce current selection and options
- [ ] Links announce destination

### ✅ Dynamic Content

- [ ] Live regions announce status changes ("Rendering avatar...")
- [ ] Progress indicators announce progress ("Rendering in progress")
- [ ] Success messages are announced ("Avatar rendered successfully")
- [ ] Error messages are announced assertively
- [ ] State changes are communicated (flag selection, style changes)

### ✅ Form Controls

- [ ] **Image Upload**: Announces file requirements and validation errors
- [ ] **Flag Selector**: Announces current flag and options
- [ ] **Presentation Style**: Announces style options and descriptions
- [ ] **Sliders**: Announce label, current value, and range
  - Border thickness (3-20%)
  - Inset/Outset (-10 to +10%)
  - Flag Offset (-200 to +200px)
- [ ] **Background Select**: Announces color options
- [ ] **Download Button**: Announces state (enabled/disabled) and purpose

### ✅ Content Descriptions

- [ ] Canvas announces "Avatar preview canvas" or current state
- [ ] Generated image has descriptive alt text
- [ ] Loading states are announced
- [ ] Empty states have helpful guidance
- [ ] Error states explain what went wrong and how to fix it

## Testing Procedure

### Basic Navigation Test

1. **Start screen reader** (NVDA: Ctrl+Alt+N, VoiceOver: Cmd+F5)
2. **Load the application**
3. **Listen to page announcement**: Should hear "Beyond Borders" and page description
4. **Navigate headings** (NVDA: H key, VoiceOver: VO+Cmd+H):
   - H1: "Beyond Borders"
   - H2: "Avatar Settings"
   - H2: "Preview"
5. **Test skip links**: Tab should reach skip links, Enter should jump to sections

### Form Interaction Test

1. **Tab to "Upload Image" button**
   - Should announce: "Upload image file, button"
   - Should describe file requirements
2. **Tab to Flag Selector**
   - Should announce: "Select a flag, combobox"
   - Arrow keys should read flag options
3. **Tab to Presentation Style radio group**
   - Should announce group label and current selection
   - Arrow keys should navigate options with descriptions
4. **Tab to Border Thickness slider**
   - Should announce: "Border thickness slider, 7 percent"
   - Left/Right arrows should adjust value
   - Value changes should be announced
5. **Tab to Download button**
   - Should announce state (enabled/disabled)
   - Should describe purpose

### Dynamic Content Test

1. **Upload an image**
   - Status should announce: "Rendering avatar..."
   - Progress should be communicated
   - Completion should announce: "Avatar rendered successfully"
2. **Change flag selection**
   - New flag should be announced
   - Rendering should be announced
3. **Adjust sliders**
   - Each value change should be announced
   - Current value should always be clear
4. **Toggle dark mode**
   - Mode change should be announced
   - Button state should update

### Error Handling Test

1. **Try to upload invalid file** (e.g., .txt file)
   - Error should be announced assertively
   - Recovery suggestion should be provided
   - Focus should move to error message
2. **Try to download without image**
   - Button should be disabled
   - Should announce why it's disabled

## ARIA Implementation Details

### Landmarks
```html
<main id="main-content" aria-labelledby="app-title">
<header role="banner">
<section aria-labelledby="controls-heading" id="controls">
<section aria-labelledby="preview-heading" id="preview">
```

### Live Regions
```html
<!-- Polite announcements (status updates) -->
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

<!-- Assertive announcements (errors) -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  {error ? `Error: ${error.message}` : ''}
</div>
```

### Progress Indicators
```html
<Box
  role="status"
  aria-live="polite"
  aria-busy="true"
  aria-label="Rendering avatar with flag border, please wait"
>
  <CircularProgress aria-label="Loading progress indicator" />
  <span class="visually-hidden">
    Rendering in progress. This may take a few seconds.
  </span>
</Box>
```

### Form Labels and Descriptions
```html
<!-- Slider with full ARIA -->
<Slider
  aria-labelledby="thickness-label"
  aria-valuetext="Border thickness 7 percent"
  aria-valuenow={7}
  aria-valuemin={3}
  aria-valuemax={20}
  aria-describedby="thickness-description"
/>
<span id="thickness-description" class="visually-hidden">
  Use left and right arrow keys to adjust border thickness.
  Current value is 7 percent. Range is from 3 to 20.
</span>

<!-- Select with description -->
<Select
  labelId="flag-select-label"
  aria-describedby="flag-select-description"
>
  <MenuItem>Rainbow Pride</MenuItem>
</Select>
<span id="flag-select-description" class="visually-hidden">
  Choose a flag to add as a border to your avatar.
</span>
```

### Button States
```html
<Button
  aria-label={disabled 
    ? "Download button. Please upload an image first." 
    : "Download generated avatar as PNG file"}
  aria-describedby="download-description"
  disabled={disabled}
>
  Download
</Button>
<span id="download-description" class="visually-hidden">
  {disabled 
    ? "The download button will be enabled after you upload an image." 
    : "Click to download your avatar with the flag border as a PNG file."}
</span>
```

## Common Issues and Solutions

### Issue: Screen reader reads too much/too little
**Solution**: Use `aria-hidden="true"` on decorative elements, `visually-hidden` class for screen-reader-only content

### Issue: Changes not announced
**Solution**: Check live region `aria-live` attribute (use "polite" for most updates, "assertive" for errors)

### Issue: Unclear context
**Solution**: Add `aria-describedby` with detailed descriptions in `visually-hidden` spans

### Issue: Slider values not announced
**Solution**: Use `aria-valuetext`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes

### Issue: Form fields confusing
**Solution**: Use `<label>` elements or `aria-labelledby` + `aria-describedby` for context

## Keyboard Shortcuts

Document all keyboard shortcuts for screen reader users:

- **Tab**: Navigate to next interactive element
- **Shift+Tab**: Navigate to previous interactive element
- **Enter/Space**: Activate buttons
- **Arrow keys**: Navigate radio buttons, adjust sliders, navigate select options
- **Escape**: Close modals/dropdowns (if applicable)
- **Ctrl+D**: Download avatar (custom shortcut)

## Testing Report Template

```markdown
## Screen Reader Test Report

**Date**: [Date]
**Tester**: [Name]
**Screen Reader**: [NVDA/JAWS/VoiceOver/TalkBack]
**Browser**: [Chrome/Firefox/Safari/Edge]
**OS**: [Windows/macOS/iOS/Android]

### Test Results

#### Navigation (Pass/Fail)
- [ ] Landmarks announced
- [ ] Heading hierarchy correct
- [ ] Skip links functional
- [ ] Tab order logical

#### Interactive Elements (Pass/Fail)
- [ ] All buttons labeled
- [ ] Form controls accessible
- [ ] Sliders announce values
- [ ] State changes communicated

#### Dynamic Content (Pass/Fail)
- [ ] Status updates announced
- [ ] Progress communicated
- [ ] Errors announced assertively
- [ ] Success messages clear

### Issues Found
1. [Issue description and location]
2. [Issue description and location]

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Overall Assessment
☐ Pass - Meets WCAG 2.1 AA
☐ Pass with minor issues
☐ Fail - Major accessibility barriers
```

## Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Screen Reader Keyboard Shortcuts**: 
  - NVDA: https://dequeuniversity.com/screenreaders/nvda-keyboard-shortcuts
  - JAWS: https://dequeuniversity.com/screenreaders/jaws-keyboard-shortcuts
  - VoiceOver: https://dequeuniversity.com/screenreaders/voiceover-keyboard-shortcuts
- **WebAIM Screen Reader Survey**: https://webaim.org/projects/screenreadersurvey9/

## Next Steps

After completing screen reader testing:

1. ✅ Fix any identified issues
2. ✅ Re-test with fixes applied
3. ✅ Document final test results
4. ✅ Update accessibility statement
5. ✅ Add automated accessibility tests to CI/CD

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Maintained By**: Beyond Borders Development Team
