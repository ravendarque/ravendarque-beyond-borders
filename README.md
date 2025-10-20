# Beyond Borders

![CI](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/deploy-pages.yml/badge.svg)

Add a circular, flag-colored border to your profile picture to show support for marginalized groups and selected causes.

🌐 **Live App**: [https://ravendarque.github.io/ravendarque-beyond-borders/](https://ravendarque.github.io/ravendarque-beyond-borders/)

## Overview

Beyond Borders uses a simple **three-step workflow** to create your flag-bordered profile picture:

### Step 1: Choose Your Image
- Upload an image (JPG/PNG, max 10MB)
- Drag and drop or click to browse
- See an instant circular preview
- All processing happens locally in your browser - no uploads!

### Step 2: Choose Your Flag
- Browse flags organized by category:
  - **Oppressed Groups** (Pride, Trans, Non-binary, etc.)
  - **Occupied / Disputed Territories** (Palestine, Tibet, Western Sahara, etc.)
  - **Stateless Nations** (Kurdistan, Uyghur/Kokbayraq, etc.)
  - **Authoritarian States** (Eritrea, North Korea, Iran)
- Search by name or keyword
- See each flag's context and meaning
- Preview updates instantly as you select

### Step 3: Preview & Save
- Adjust border thickness with a slider
- Fine-tune image and flag positioning
- Choose export size (512px or 1024px)
- Download your customized avatar as PNG

## Status
**✅ Live and deployed!** The app is built with Vite + React + TypeScript and automatically deployed to GitHub Pages on every push to main.

PRD is defined in `beyond-borders-prd-0.1.md`.

## Tech Stack
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

## Project Structure

```
src/
├── components/         # React components (StepProgressIndicator, FlagDropdown, etc.)
├── pages/             # Page components (AppStepWorkflow)
├── hooks/             # Custom React hooks (useStepWorkflow, useAvatarRenderer, etc.)
├── renderer/          # Canvas rendering engine + flag processing
├── flags/             # Flag data (flags.ts generated from flags.json)
├── utils/             # Utilities (EXIF handling, validation, etc.)
└── types/             # TypeScript type definitions

test/
├── unit/              # Unit tests (Vitest + React Testing Library)
├── integration/       # Integration tests
├── e2e/               # End-to-end tests (Playwright)
└── fixtures/          # Test fixtures and data

scripts/
├── fetch-and-extract.cjs  # Fetch and process flag images
├── validate-flags.cjs     # Validate flag data integrity
└── sync-flags-ts.cjs      # Generate flags.ts from flags.json
```

## Flags Library Governance

Our flag collection is carefully curated to support awareness and solidarity:

- **Oppressed groups**: Pride, transgender, non-binary, and other identity flags
- **Occupied territories**: Flags representing peoples under occupation or disputed governance
- **Stateless nations**: Flags of peoples without recognized nation-states
- **Authoritarian states**: Flags highlighting regions under authoritarian rule

Each flag includes:
- Accurate colors, proportions, and design (validated sources)
- Context explaining the group or cause
- Multiple sources for verification
- Status tracking (active/hidden/deprecated)

All flag data is versioned in `flags.json` with full attribution.

## Privacy & Accessibility
- Client-side processing; no images uploaded to servers
- WCAG 2.1 AA targets; keyboard navigation and reduced-motion support

## Roadmap (high-level)
- v0: Scaffold app, load flags.json, basic renderer, 512/1024 PNG export
- v1: A11y polish, performance budgets, basic e2e
- v1.x: Additional patterns, PWA, localization

## License
TBD
