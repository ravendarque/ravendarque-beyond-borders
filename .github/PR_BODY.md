This PR makes two small but important repository maintenance changes:

1) Add CODEOWNERS
- Adds `.github/CODEOWNERS` with a global rule: `* @ravendarque`
- Purpose: enable automatic reviewer assignment and prepare for branch protection rules that require owner review.

2) Standardize on pnpm
- Replaces npm usages with pnpm across CI workflows, docs, and dev tooling:
  - `.github/workflows/ci.yml`: use `pnpm install --frozen-lockfile`, cache `pnpm-lock.yaml`
  - `.github/workflows/fetch-flags.yml`: use `pnpm install --frozen-lockfile`, `pnpm test`
  - `playwright.config.ts`: webServer command -> `pnpm dev`
  - `README.md`, `scripts/README.md`, `scripts/validate-flags.cjs`, and docs updated to prefer `pnpm` commands
- Removes `package-lock.json` and adds `pnpm-lock.yaml` (generated with `pnpm install --lockfile-only`).
- Rationale: align developer workflow and CI on a single package manager (pnpm) for deterministic installs and faster local installs via pnpm's caching.

Additional changes
- Minor docs updates to reflect pnpm usage.
- Committed `pnpm-lock.yaml` and pushed branch `chore/add-codeowners`.

CI & compatibility notes
- CI now uses pnpm; the workflow change ensures reproducible installs via `--frozen-lockfile`. If your org-wide tooling expects npm, we can either:
  - Keep both lockfiles (not recommended), or
  - Update any external tooling/templates to support pnpm.

Local branch cleanup & lockfile work (performed)
- Deleted several local branches whose upstreams were gone: feature/trigger-fetch, feature/ux-combined, feature/ux-development, fix/restore-fetch-script, feature/test-workflow-validation, feature/ux-visual-improvements, prune
- Generated and committed a `package-lock.json` earlier to unblock CI, but then migrated to pnpm and removed the npm lockfile in favor of `pnpm-lock.yaml`.

Acceptance criteria
- [x] `.github/CODEOWNERS` added and pushed
- [x] CI workflows use pnpm and refer to `pnpm-lock.yaml`
- [x] `pnpm-lock.yaml` is present and committed
- [x] Docs updated to prefer pnpm
- [x] No remaining references to `npm ci` or `package-lock.json` in CI workflows

Suggested labels: chore, infra, ci
Suggested reviewers: @ravendarque
