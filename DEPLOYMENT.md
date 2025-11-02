## Deployment Architecture

This project uses two distinct GitHub Pages deployment strategies:

1. **Production (Workflow Mode)** – artifact-based deployment via `actions/upload-pages-artifact` and `actions/deploy-pages`.
2. **Beta (Legacy Commit Mode)** – versioned static builds committed directly into the `gh-pages` branch under `beta/<semver>/`.

### 1. Production Deployment (Workflow Mode)

Workflow: `.github/workflows/deploy-pages.yml`

Triggers:
- Push to `main`
- Manual `workflow_dispatch`

Key steps:
- Install & build (`pnpm build`) with `BASE_URL=/<repo>/`.
- Add `.nojekyll` to prevent Jekyll processing.
- Upload build output (`dist/`) as a Pages artifact.
- Deploy artifact using `actions/deploy-pages@v4`.

Benefits:
- Clear deployment status surfaced in the workflow run.
- No direct writes to `gh-pages` for production (immutability & provenance).
- Automatic rebuilds without manual API trigger.
- Uses OIDC (`id-token: write`) for provenance.

Permissions configured:
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Environment URL:
```
https://<owner>.github.io/<repo>/
```

### 2. Beta Deployments (Versioned Previews)

Workflow: `.github/workflows/deploy-beta.yml`

Invocation:
- `workflow_dispatch` with optional `branch` input.
- Adding a `deploy-beta` label to a pull request.

Process:
1. Determine branch & derive semantic version via `scripts/get-version.cjs`.
2. Build with `BASE_URL=/<repo>/beta/<semver>/`.
3. Commit build into `gh-pages` under `beta/<semver>/` preserving existing versions.
4. Generate/refresh an index page enumerating all beta versions.

Beta URL pattern:
```
https://<owner>.github.io/<repo>/beta/<semver>/
```

Cleanup Workflow: `.github/workflows/cleanup-beta.yml` – removes a specific version directory and regenerates the beta index.

Rationale for keeping commit-based beta:
- Multiple parallel preview versions preserved simultaneously.
- Simple static hosting without artifact retention limits.
- Enables testers to compare versions side-by-side.

### Manual Beta Deployment (Example)
You can trigger a manual beta deployment of your current branch:
```bash
gh workflow run deploy-beta.yml -f branch=$(git rev-parse --abbrev-ref HEAD)
```

### Switching Pages to Workflow Mode
The repository's GitHub Pages setting must be set to "Workflow" (not "Deploy from branch"). This is a one-time change performed in **Settings → Pages**.

### Adding a New Deployment Type
For additional staged environments (e.g., `staging/`), prefer artifact-based workflow mode unless you need multiple concurrent versions. Follow production pattern, adjusting `BASE_URL`.

### Common Issues & Troubleshooting
- 404 after deploy: Ensure Pages setting is workflow mode and artifact step ran successfully.
- Missing assets: Verify `BASE_URL` matches production root (`/<repo>/`).
- Beta version collision: Re-run beta deploy; directory is fully replaced each time.
- Cache issues: Append a query string (e.g., `?v=<semver>`) when sharing fresh builds.

### Acceptance Criteria Mapping (Issue #111)
- Uses `actions/deploy-pages@v4` – DONE.
- Deployment status visible – Provided by deploy job & environment.
- No manual POST trigger – Artifact workflow handles build & deploy automatically.
- Beta strategy unchanged – Workflows untouched.
- Automatic rebuild on `main` push – Push trigger configured.

### Next Steps
- Monitor initial production deploy under workflow mode.
- Optionally migrate beta deployments to artifact model when single-version previews become acceptable.
