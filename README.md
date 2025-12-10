# Beyond Borders

![CI](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/ci.yml/badge.svg)
[![Fetch flags and generate metadata](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/fetch-flags.yml/badge.svg)](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/fetch-flags.yml)
![Deploy](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/deploy-main.yml/badge.svg)
![Beta Deploy](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/deploy-pr.yml/badge.svg)
![Beta Cleanup](https://github.com/ravendarque/ravendarque-beyond-borders/actions/workflows/cleanup-pr-deployments.yml/badge.svg)

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
- Search by name or keyword
- See each flag's context and meaning
- Preview updates instantly as you select

### Step 3: Preview & Save
- Adjust border thickness with a slider
- Fine-tune image and flag positioning
- Choose export size (512px or 1024px)
- Download your customized avatar as PNG

## Status
**✅ Live and deployed!** Production uses GitHub Pages **workflow mode** (artifact deployment) on every push to `main`. Versioned **beta previews** are committed under `gh-pages/beta/<semver>/` and managed by dedicated workflows.

See `DEPLOYMENT.md` for full details on production vs beta infrastructure.

PRD is defined in `beyond-borders-prd-0.1.md`.

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS + accessible primitives
- Canvas 2D for rendering (OffscreenCanvas/Worker when available)
- Zod for flag data validation
- Vitest/RTL + Playwright for tests

## Local Development

### Quick Setup (Automated)

We provide setup scripts that automatically install all required tools and dependencies:

**Windows (PowerShell):**
```powershell
.\.github\scripts\setup-dev-env.ps1
```

**Linux/macOS (PowerShell Core):**
```powershell
pwsh .github/scripts/setup-dev-env.ps1
```

See [.github/scripts/SETUP.md](.github/scripts/SETUP.md) for detailed setup instructions and troubleshooting.

### Manual Setup

- **Requirements**: Node 18+ (or 20+), pnpm, Python 3
- **Install dependencies**: `pnpm install`
- **Install Playwright browsers**: `pnpm exec playwright install --with-deps`
- **Start dev server**: `pnpm dev`
- **Build**: `pnpm build`
- **Preview**: `pnpm preview`
- **Run tests**: `pnpm test`

### Validation Tools (Optional)

For pre-push validation, you may also want to install:
- **Trivy**: Security scanning ([installation](https://aquasecurity.github.io/trivy/latest/getting-started/installation/))

**Note**: TruffleHog secret scanning is used in CI but not in local validation to keep pre-push checks fast.

### Contributing

The `main` branch is protected. All changes must be made via pull requests:

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Make changes and commit**: Follow [conventional commits](https://www.conventionalcommits.org/)
3. **Run local validation** (optional but recommended):
   - All platforms: `pwsh .github/scripts/local-ci.ps1` (PowerShell Core - required)
   - Windows: `.\.github\scripts\local-ci.ps1` (Windows PowerShell)
   - Or install the pre-push git hook (see [.github/hooks/README.md](.github/hooks/README.md))
4. **Push and create PR**: `git push -u origin feature/your-feature`
5. **Wait for CI checks** to pass (validation, build, tests)
6. **Request review**: At least 1 approval required
7. **Merge** after approval and passing checks

#### Validation Workflow

We use a three-tier validation approach to catch issues early:

1. **Local validation** (optional): Run validation scripts before pushing
   - Security audit (Trivy)
   - Markdown/YAML linting
   - TODO/FIXME detection
   - File validation and large file detection
   - Conditional build/test (only if production code changed)

2. **PR validation** (always runs): Lightweight checks on every PR
   - Same checks as local validation
   - Prevents PR blocking when full CI doesn't run

3. **Full CI** (conditional): Complete build and test suite
   - Only runs when production code changes (src/, config files, etc.)
   - Secret scanning (TruffleHog) - runs in CI only for speed
   - Full linting, type checking, unit and E2E tests
   - Node.js 18.x and 20.x matrix

**Running validation locally:**

All platforms (PowerShell Core - required):
```powershell
# Full validation
pwsh .github/scripts/local-ci.ps1

# Skip build/test for faster feedback
pwsh .github/scripts/local-ci.ps1 -SkipBuild
```

Windows (Windows PowerShell):
```powershell
# Full validation
.\.github\scripts\local-ci.ps1

# Skip build/test for faster feedback
.\.github\scripts\local-ci.ps1 -SkipBuild
```

**Note:** PowerShell Core (pwsh) is required and works on all platforms. Install from https://github.com/PowerShell/PowerShell

**Installing the git pre-push hook:**

This automatically runs validation before every push. See [.github/hooks/README.md](.github/hooks/README.md) for setup instructions.

**Bypass validation** (not recommended):
```bash
git push --no-verify
```

  ## Flag validation & fetching

  This project requires PNG flag assets to live in `public/flags` for accurate previews and exports. A validator is provided to ensure every flag referenced in `src/flags/flags.ts` has corresponding PNG files in `public/flags`.

  - Run the validator locally:

  ```bash
  node scripts/validate-flags.cjs
  ```

  - Fetch or refresh flags (recommended to run from CI or with `--push` to commit the results):

  ```bash
  node scripts/fetch-flags.cjs --ci
  # or for interactive/local run that commits/pushes:
  node scripts/fetch-flags.cjs --push
  ```

  This script fetches SVG flags, generates PNG assets, and creates the TypeScript manifest (`src/flags/flags.ts`) in one step.

  The GitHub Actions workflow runs the validator before the build so missing PNGs will fail CI with a clear message.

## Project Structure

```
src/
├── components/         # React components (StepProgressIndicator, FlagDropdown, etc.)
├── pages/             # Page components (AppStepWorkflow)
├── hooks/             # Custom React hooks (useStepWorkflow, useAvatarRenderer, etc.)
├── renderer/          # Canvas rendering engine + flag processing
├── flags/             # Flag data (flags.ts generated by fetch-flags script)
├── utils/             # Utilities (EXIF handling, validation, etc.)
└── types/             # TypeScript type definitions

test/
├── unit/              # Unit tests (Vitest + React Testing Library)
├── integration/       # Integration tests
├── e2e/               # End-to-end tests (Playwright)
└── fixtures/          # Test fixtures and data

scripts/
├── fetch-flags.cjs        # Fetch flags, generate PNGs, create TypeScript manifest
└── validate-flags.cjs     # Validate flag data integrity

docs/
├── code-standards.md       # Code standards and review guidelines (for AI agents)
├── renderer-api.md         # Renderer API documentation
└── [other documentation]   # Additional docs
```

**See [docs/code-standards.md](docs/code-standards.md) for comprehensive code standards, UI patterns, and review guidelines.**

## Flags Library Governance

Our flag collection is carefully curated to support awareness and solidarity:

- **Oppressed groups**: Pride, transgender, non-binary, and other identity flags
- **Occupied territories**: Flags representing peoples under occupation or disputed governance
- **Stateless nations**: Flags of peoples without recognized nation-states

Each flag includes:
- Accurate colors, proportions, and design (validated sources)
- Context explaining the group or cause
- Multiple sources for verification
- Status tracking (active/hidden/deprecated)

All flag data is versioned in `src/flags/flags.ts` with full attribution.

## Privacy & Accessibility
- Client-side processing; no images uploaded to servers
- WCAG 2.1 AA targets; keyboard navigation and reduced-motion support

## Roadmap (high-level)
- v0: Scaffold app, load flags.json, basic renderer, 512/1024 PNG export
- v1: A11y polish, performance budgets, basic e2e
- v1.x: Additional patterns, PWA, localization

## License
TBD
