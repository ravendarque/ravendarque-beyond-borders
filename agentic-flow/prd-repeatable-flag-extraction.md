# PRD: Repeatable Flag SVG → App Stripe Extraction

## Summary
Make the process that converts official flag SVG assets into canonical stripe colour specs for `src/flags/flags.ts` repeatable, automated, and auditable. This PRD defines goals, scope, data shapes, scripts, CI automation, acceptance criteria, and a runbook for failures.

## Goals
- Reliable extraction of flag colours and canonical stripe ordering from SVG assets.
- Produce machine-readable outputs under `agentic-flow/outputs/` (colour counts and ordered stripe lists).
- Provide a repeatable CLI + CI workflow to re-run extraction and propose updates to `src/flags/flags.ts` as a PR.
- Maintain human review and override capability (manual edits to `src/flags/flags.ts`).

## Non-Goals
- Perfect visual rendering of complex emblems (this focuses on stripe colours and dominant fills, not complex emblem recolouring).
- Legal clearance for flag use; this is a technical pipeline only.

## Stakeholders
- Product owner: defines which flags to include.
- Engineering: implements scripts and CI.
- Designer/reviewer: verifies extracted colours and ordering.

## Success Criteria
- Running the extractor produces `agentic-flow/outputs/flag-colors.json` and `agentic-flow/outputs/flag-stripe-order.json` for all SVGs in the canonical flags location.
- `npx -y tsc -b --noEmit` and unit tests pass after proposed flag updates.
- A CI pipeline can run the extractor, commit outputs, and open a draft PR with suggested `src/flags/flags.ts` changes.

## Data shapes
- Input: SVG files (UTF-8) in `public/flags/*.svg` (the repository's canonical, public-facing flags directory).
- Outputs (current):
  - `agentic-flow/outputs/flag-colors.json` — map filename → colour frequency list.
  - `agentic-flow/outputs/flag-stripe-order.json` — map filename → ordered array of hex colours or named tokens.
- App model: `src/flags/flags.ts` entries conform to `FlagSpec` in `src/flags/schema.ts`.

## Pipeline Overview
1. Place authoritative SVGs inside `public/flags/` (filenames should be stable and descriptive). `public/flags/` is the single source of truth for flag artwork and is served at `/flags/<name>.svg` in development and production static hosting.
2. Run extractor(s):
   - `agentic-flow/scripts/extract-svg-colors.cjs` — counts hex/rgb occurrences.
   - `agentic-flow/scripts/extract-svg-stripes.cjs` — infers element-order stripe lists and resolves simple gradients.
3. Validate outputs under `agentic-flow/outputs/`.
4. Run a script to map extracted ordered colours to `FlagSpec` entries.
5. Typecheck, run tests, and open a commit/PR with the proposed `src/flags/flags.ts` changes for human review.

## CLI commands (local run)
Run these in the repository root (PowerShell shown):

```pwsh
# extract colours and ordered stripes
node agentic-flow/scripts/extract-svg-colors.cjs
node agentic-flow/scripts/extract-svg-stripes.cjs

# (optional) run typecheck
npx -y tsc -b --noEmit
```

## Automation & CI
- Create a GitHub Actions workflow `/.github/workflows/flag-extract.yml` that:
  - Triggers: manual workflow_dispatch, schedule (optional), and on push to a `assets/flags` path.
  - Steps:
    1. Checkout repository.
    2. Setup Node.js (use project Node version).
    3. Run the extractors.
    4. Run `npx -y tsc -b --noEmit` and unit tests.
    5. If successful, commit `agentic-flow/outputs/*` to a new branch and open a Draft PR proposing updates to `src/flags/flags.ts` (use GitHub API or `gh` CLI) with a human reviewer.
- Security: CI should run in a controlled environment and must not fetch arbitrary third-party content without review. If fetching remote SVGs from public sources, isolate and log sources.

## Mapping & Human Review
- The mapping script should prefer:
  1. Explicit element-order fill colours (top-to-bottom) when shapes are simple rectangles.
  2. Gradient first-stop if fill references a gradient.
  3. Frequency-based colours as fallback.
- The output PR must include `agentic-flow/outputs/*` artifacts and a summary table (filename → extracted colours) to make review easy.
- Reviewer tasks: verify colour hex values and stripe order; edit `src/flags/flags.ts` if needed.

## Runbook: common failures
- No SVGs found in `public/flags`:
  - Action: ensure files are present and readable; filenames should end with `.svg`.
- Extractor fails (syntax error or unknown tokens):
  - Action: open failing SVG and inspect non-standard CSS or embedded scripts; report to engineering.
- Typecheck/tests fail after mapping:
  - Action: revert proposed `src/flags/flags.ts` changes and open an issue; run `npx -y tsc -b --noEmit` locally to debug.

## Acceptance tests
- Happy path: with the current assets, running the CLI produces the two JSON outputs and a green typecheck.
- Edge case: flags with gradients still produce reasonable hex outputs (first-stop fallback).

## Security & License
- Store a manifest `agentic-flow/outputs/sources.json` containing the provenance (URLs or local sources) for every SVG.
- Verify license/attribution requirements for using/redistributing any downloaded SVG assets.

## Implementation plan & timeline
1. (T+0) Add this PRD to repo (`agentic-flow/prd-repeatable-flag-extraction.md`).
2. (T+1) Add a mapping script that ingests `flag-stripe-order.json` and writes a `src/flags/flags.ts` proposal file.
3. (T+2) Add GH Actions workflow to run extractor and propose a PR.
4. (T+3) Add unit tests: sample SVGs → expected stripe arrays.
5. (T+4) Iterate on mapping heuristics based on reviewer feedback.

## Minimal implementation tasks (tickets)
- TASK-1: Add mapping script and example output.
- TASK-2: Add unit tests for extractor and mapping.
- TASK-3: Add CI workflow to run extractors and produce PR.
- TASK-4: Add a reviewer checklist for approving flag colour changes.

## Appendix — quick notes
- Scripts live under `agentic-flow/scripts/`.
- Outputs live under `agentic-flow/outputs/` and should be committed as CI artifacts.
