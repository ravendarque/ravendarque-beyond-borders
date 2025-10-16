# Beyond Borders

![CI](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/ci-validate-flags.yml/badge.svg)

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

## Local Development
- **Requirements**: Node 18+ (or 20+), pnpm or npm
- **Install dependencies**: `pnpm install`
- **Start dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Preview**: `pnpm preview`
- **Run tests**: `pnpm test`

### Contributing

The `main` branch is protected. All changes must be made via pull requests:

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Make changes and commit**: Follow [conventional commits](https://www.conventionalcommits.org/)
3. **Push and create PR**: `git push -u origin feature/your-feature`
4. **Wait for CI checks** to pass (build, tests, flag validation)
5. **Request review**: At least 1 approval required
6. **Merge** after approval and passing checks

  ## Flag validation & fetching

  This project requires SVG flag assets to live in `public/flags` for accurate previews and exports. A validator is provided to ensure every `svgFilename` referenced in `src/flags/flags.ts` has a corresponding file in `public/flags`.

  - Run the validator locally:

  ```bash
  node scripts/validate-flags.cjs
  ```

  - Fetch or refresh flags (recommended to run from CI or with `--push` to commit the results):

  ```bash
  node scripts/fetch-and-extract.cjs --ci
  # or for interactive/local run that commits/pushes:
  node scripts/fetch-and-extract.cjs --push
  ```

  The GitHub Actions workflow runs the validator before the build so missing SVGs will fail CI with a clear message.

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
