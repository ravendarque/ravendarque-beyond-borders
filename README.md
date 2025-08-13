# Beyond Borders

Add a circular, flag-colored border to your profile picture to show support for marginalized groups and selected causes.

## Overview
- Upload an image (JPG/PNG)
- Pick a flag (Pride, Trans, Non-binary, selected national flags, etc.)
- Adjust border thickness and preview a circular avatar
- Download as PNG (512/1024)

## Status
PRD is defined in `beyond-borders-prd-0.1.md`. App scaffolding to be created (Vite + React + TypeScript).

## Tech Stack (planned)
- React + TypeScript + Vite
- Tailwind CSS + accessible primitives
- Canvas 2D for rendering (OffscreenCanvas/Worker when available)
- Zod for `flags.json` validation
- Vitest/RTL + Playwright for tests

## Local Development (once scaffolded)
- Requirements: Node 18+ (or 20+), pnpm or npm
- Steps (to be run after scaffolding):
  - Install deps: `pnpm install` or `npm install`
  - Start dev server: `pnpm dev` or `npm run dev`
  - Build: `pnpm build` or `npm run build`
  - Preview: `pnpm preview` or `npm run preview`

## Project Structure (planned)
- src/
  - components/ Uploader, FlagPicker, Controls, Preview
  - renderer/ canvas renderer + worker
  - flags/ flags.json + schema
  - lib/ utils (exif, a11y)
  - tests/

## Flags Library Governance
- Primary focus: marginalized-group flags (accurate colors/order/proportions)
- Selected national flags for specific conflicts (curated)
- Versioned `flags.json` with sources and status (active/hidden/deprecated)

## Privacy & Accessibility
- Client-side processing; no images uploaded to servers
- WCAG 2.1 AA targets; keyboard navigation and reduced-motion support

## Roadmap (high-level)
- v0: Scaffold app, load flags.json, basic renderer, 512/1024 PNG export
- v1: A11y polish, performance budgets, basic e2e
- v1.x: Additional patterns, PWA, localization

## License
TBD
