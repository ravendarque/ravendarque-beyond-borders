# Product Requirements Document (PRD)

## Title
Beyond Borders: Flag-Colored Image Border Web Application

## Overview & Purpose
Create a simple web app that lets people add a circular border to their profile picture using the colors and patterns of a selected flag. The primary use is to show support for marginalized groups (e.g., Pride variants, Trans, Non-binary, etc.) and, when appropriate, selected national flags related to specific conflicts.

## Goals
- Frictionless, privacy-respecting image upload and border creation
- Faithful rendering of flag colors/patterns as circular borders
- Fast, accessible, and mobile-friendly experience

## Out of Scope (V1)
- Text overlays, stickers, filters beyond borders
- User accounts or galleries
- Generative/AI edits of the user image

## Users & Core Use Cases
- Individuals wanting to show solidarity/support on social platforms
- Use: upload profile picture, choose a flag, preview circular border, download/export optimized avatar

## Functional Requirements
1) Image Upload & Prep
- Accept JPG/PNG (V1). Preserve transparency if present. Max file size: 10 MB.
- Handle EXIF orientation. Show live preview.
- Optional circular crop preview to match social media avatars.

2) Flag Library & Selection
- Curated library categorized as:
  - Marginalized group flags: Pride, Progress Pride, Trans, Non-binary, Bi, Lesbian, Ace, Pan, Intersex (expandable list)
  - Selected national flags relevant to specific conflicts (tightly governed list)
- Search/filter by name/category. Show thumbnail preview.
- Governance: flags are defined via a versioned configuration (JSON) with name, source, palette/pattern definition, and review metadata.

3) Border Generation (Circular Avatar Focus)
- Circular border styles:
  - Stripe ring (concentric or radial segmentation based on flag stripes)
  - Continuous band with segmented color arcs (respect flag order and proportions)
  - Solid single-color (primary flag color)
- Controls: border thickness (px/% of diameter), inner/outer padding, optional outer stroke.
- Maintain aspect ratio; support non-square images by fitting within a circular mask.

4) Download & Share
- Export sizes: 512x512, 1024x1024 (V1); keep original as optional.
- Formats: PNG (default, preserves transparency), JPG (optional, white background).
- One-click download; copy-friendly filename with flag identifier.

5) Accessibility & Localization
- WCAG 2.1 AA for color contrast, keyboard nav, focus states, alt text.
- Clear labels and help text; motion/reduced motion respected.
- English (V1); architecture ready for more locales.

## Non-Functional Requirements
- Performance: generate preview in < 2s on mid-range mobile; export in < 3s.
- Privacy: process images client-side in browser; do not upload/store user images on server.
- Compatibility: Latest Chrome/Edge/Firefox/Safari (last 2 versions), mobile and desktop.
- Availability: Static hosting; no backend required for V1.

## Ethics, Safety, and Governance
- Inclusion-first: prioritize marginalized group flags and maintain accuracy (colors, order, proportions).
- Sensitive content: exclude hate symbols, extremist content, or flags violating platform policies.
- Review process: any new flag entry requires documented source, community reference, and maintainer approval.
- Removals/updates: provide a mechanism to deprecate or hide flags quickly if needed.

## Data & Privacy
- No persistent storage of user images; processing happens in browser Canvas/WebGL.
- Optional anonymous telemetry for feature usage (toggle; off by default in V1).

## UX Requirements
- Simple 3-step flow: Upload -> Choose Flag -> Adjust -> Download.
- Live circular preview showing final avatar.
- Safe defaults: medium border thickness, accurate stripe order.
- Error handling: unsupported format/oversized file with clear guidance.

## Technical Approach (V1)
- Frontend only (SPA): HTML/CSS/TypeScript; Canvas 2D (or OffscreenCanvas) for rendering.
- Flag definitions: JSON with either palette+proportions (e.g., [stripe: color, weight]) or simple palette for solid/gradient.
- Rendering pipeline: mask to circle -> compute ring geometry -> paint segments -> composite over uploaded image.
- Testing: unit tests for palette parsing, segment math, and export sizing.

## Success Metrics
- TTFP preview median < 1.5s; export median < 2.5s
- Completion rate (upload -> download)
- Accuracy checks: visual parity to reference flags (internal QA checklist)

## Risks & Mitigations
- Flag accuracy drift: use centralized JSON, checksum tests, community review.
- Performance on low-end devices: limit max export size; use incremental rendering.
- Content disputes: documented governance and change log.

## Future Enhancements
- More border patterns (chevrons/waves), gradients respecting flag semantics
- Batch image support; preset social platform crops
- PWA offline mode; share sheets; localization expansion

## Acceptance Criteria (V1)
- User can upload an image, select a Pride/Trans flag, adjust thickness, preview circular border, and download a 1024x1024 PNG with correct stripe order and proportions.
- Processing is local; no image leaves the browser.
- Keyboard-only flow is fully operable; color contrast passes AA.

## Tech Stack & Architecture

- Framework: React + TypeScript with Vite (SPA, static hosting)
- Styling: Tailwind CSS; accessible primitives via Radix/Headless UI
- State: Minimal (Zustand) or React Context for controls and selection
- Rendering: HTML Canvas 2D; OffscreenCanvas + Web Worker fallback to main thread
- Image I/O: createImageBitmap, exifr (orientation), canvas.toBlob for PNG/JPG export
- Validation: Zod for flags.json and user options
- Testing: Vitest + React Testing Library (unit), Playwright (e2e)
- Accessibility: @axe-core/react in development; focus-visible; reduced-motion support
- Deploy: Static hosting (Vercel/Netlify/GitHub Pages). No backend required in V1

### Key Modules (Contracts)
- Renderer API
  - Input: ImageBitmap | HTMLImageElement, FlagSpec, Options { size: 512|1024, thicknessPct: number, paddingPct?: number, outerStroke?: { color: string; widthPx: number } }
  - Output: Promise<Blob> (PNG default)
  - Behavior: apply circular mask, compute ring segments from FlagSpec, draw respecting proportions/order
- Flag Library
  - Source: versioned flags.json
  - Validated on load; invalid entries are skipped with visible warning in dev

### Suggested Directory Layout
- src/
  - components/ (Uploader, FlagPicker, Controls, Preview)
  - renderer/ (canvas renderer, worker, geometry utils)
  - flags/ (flags.json, schema.ts)
  - lib/ (exif, file utils, a11y helpers)
  - pages/ (App)
  - tests/

## flags.json Schema (Draft) and Examples

This schema supports stripe-based flags in V1 (horizontal/vertical). Complex shapes (chevrons, coats of arms) are out of scope for V1 but can be modeled later with an overlays array.

### Field Definitions
- id: string (kebab-case unique key)
- displayName: string
- category: "marginalized" | "national"
- sources: { referenceUrl?: string; authorNote?: string }
- status: "active" | "hidden" | "deprecated"
- pattern:
  - type: "stripes"
  - orientation: "horizontal" | "vertical"
  - stripes: Array<{ color: string (hex), weight: number (relative), label?: string }>
- recommended:
  - borderStyle: "ring-stripes" | "ring-solid"
  - primaryColor?: string (if ring-solid)
  - defaultThicknessPct: number (e.g., 10)

### Example (Trans Pride)
```json
{
  "id": "trans-pride",
  "displayName": "Trans Pride",
  "category": "marginalized",
  "sources": {
    "referenceUrl": "https://en.wikipedia.org/wiki/Transgender_flags"
  },
  "status": "active",
  "pattern": {
    "type": "stripes",
    "orientation": "horizontal",
    "stripes": [
      { "color": "#5BCEFA", "weight": 1, "label": "light blue" },
      { "color": "#F5A9B8", "weight": 1, "label": "light pink" },
      { "color": "#FFFFFF", "weight": 1, "label": "white" },
      { "color": "#F5A9B8", "weight": 1, "label": "light pink" },
      { "color": "#5BCEFA", "weight": 1, "label": "light blue" }
    ]
  },
  "recommended": {
    "borderStyle": "ring-stripes",
    "defaultThicknessPct": 12
  }
}
```

### Example (Progress Pride – simplified stripes only for V1)
Note: the chevron overlay is out of V1 scope; this example uses the rainbow stripes for ring rendering.
```json
{
  "id": "progress-pride-simplified",
  "displayName": "Progress Pride (Simplified)",
  "category": "marginalized",
  "sources": {
    "referenceUrl": "https://en.wikipedia.org/wiki/Rainbow_flag_(LGBT)"
  },
  "status": "active",
  "pattern": {
    "type": "stripes",
    "orientation": "horizontal",
    "stripes": [
      { "color": "#E40303", "weight": 1, "label": "red" },
      { "color": "#FF8C00", "weight": 1, "label": "orange" },
      { "color": "#FFED00", "weight": 1, "label": "yellow" },
      { "color": "#008026", "weight": 1, "label": "green" },
      { "color": "#004DFF", "weight": 1, "label": "blue" },
      { "color": "#750787", "weight": 1, "label": "violet" }
    ]
  },
  "recommended": {
    "borderStyle": "ring-stripes",
    "defaultThicknessPct": 10
  }
}
```

### Example (National Flag – Ukraine)
```json
{
  "id": "ua",
  "displayName": "Ukraine",
  "category": "national",
  "sources": {
    "referenceUrl": "https://en.wikipedia.org/wiki/Flag_of_Ukraine"
  },
  "status": "active",
  "pattern": {
    "type": "stripes",
    "orientation": "horizontal",
    "stripes": [
      { "color": "#0057B7", "weight": 1, "label": "blue" },
      { "color": "#FFD700", "weight": 1, "label": "yellow" }
    ]
  },
  "recommended": {
    "borderStyle": "ring-stripes",
    "defaultThicknessPct": 12
  }
}
```

### Zod Schema (TypeScript, indicative)
```ts
import { z } from "zod";

export const Stripe = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  weight: z.number().positive(),
  label: z.string().optional(),
});

export const FlagSpec = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.enum(["marginalized", "national"]),
  sources: z.object({ referenceUrl: z.string().url().optional(), authorNote: z.string().optional() }),
  status: z.enum(["active", "hidden", "deprecated"]).default("active"),
  pattern: z.object({
    type: z.literal("stripes"),
    orientation: z.enum(["horizontal", "vertical"]),
    stripes: z.array(Stripe).min(2),
  }),
  recommended: z.object({
    borderStyle: z.enum(["ring-stripes", "ring-solid"]),
    primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
    defaultThicknessPct: z.number().min(5).max(20),
  }),
});
```

### Governance Notes for flags.json
- New entries require: accurate colors, order, proportions; citation link; maintainer review.
- Use status:"hidden" for pending review; "deprecated" for removals with rationale.
- Changes are versioned; provide a CHANGELOG entry for any palette or order update.
