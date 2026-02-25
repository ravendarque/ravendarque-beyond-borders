# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Beyond Borders is a **client-side-only** React + TypeScript + Vite SPA. There is no backend, no database, and no Docker. The only service to run is the Vite dev server.

### Running the application

- `pnpm dev` starts the dev server on `http://localhost:5173` (add `--host 0.0.0.0` if you need external access).
- E2E tests require the dev server to be running first (`pnpm test:e2e` checks for it automatically).

### Key commands

All standard commands are in `package.json` scripts. The important ones:

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Type check | `pnpm typecheck` |
| Unit + integration tests | `pnpm test` (runs typecheck first, then vitest) |
| E2E tests (Chromium only) | `pnpm test:e2e:fast` |
| E2E tests (all browsers) | `pnpm test:e2e` |
| Build | `pnpm build` |
| Format check | `pnpm format:check` |

### Gotchas

- **sharp build scripts**: pnpm will warn about ignored build scripts for `sharp`. The `pnpm.onlyBuiltDependencies` field in `package.json` allowlists sharp so its native binaries install correctly. Without this, `sharp`-dependent scripts (e.g., `fetch-flags.js`) will fail.
- **Playwright browsers**: Only Chromium is needed for fast E2E testing (`pnpm test:e2e:fast`). Install with `pnpm exec playwright install --with-deps chromium`. The full suite (`pnpm test:e2e`) needs all browsers: `pnpm exec playwright install --with-deps`.
- **E2E tests need dev server**: Start `pnpm dev` before running any `test:e2e*` commands. The test runner will error if the dev server is not reachable on port 5173.
- **Test fixtures**: Sample images for manual and E2E testing live in `test/fixtures/` (e.g., `avatar-sample.png`).
- **PowerShell scripts**: The repo's CI/validation scripts (`.github/scripts/`) use PowerShell Core (`pwsh`). These are optional for local development but may be needed for full validation runs.
