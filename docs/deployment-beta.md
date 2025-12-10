# Beta Deployment

## Workflow

File: `.github/workflows/deploy-pr.yml`

## Invocation

- `workflow_dispatch` with optional `branch` input
- Adding a `deploy-beta` label to a pull request

## Process

1. Determine branch & derive semantic version via `scripts/get-version.cjs`
2. Build with `BASE_URL=/beta/<semver>/` (for custom domain)
3. Commit build into `gh-pages` under `beta/<semver>/`
4. Generate/refresh index page enumerating all beta versions

## URLs

- **Custom Domain (Primary):**
  - **Beta URL pattern:** `https://wearebeyondborders.com/beta/<semver>/`
  - **Beta index page:** `https://wearebeyondborders.com/beta/`
- **GitHub Pages (Fallback):**
  - **Beta URL pattern:** `https://<owner>.github.io/<repo>/beta/<semver>/`
  - **Beta index page:** `https://<owner>.github.io/<repo>/beta/`

## Cleanup

Workflow: `.github/workflows/cleanup-pr-deployments.yml`

Removes a specific version directory and regenerates the beta index.

## Benefits

- Multiple parallel preview versions preserved simultaneously
- Simple static hosting coexisting with production
- Enables testers to compare versions side-by-side
- Consistent deployment method with production

## Manual Deployment

Trigger a manual beta deployment of your current branch:

```bash
gh workflow run deploy-pr.yml
```

## Checklist

- [ ] Beta workflow unchanged from defaults
- [ ] Beta deployments accessible
- [ ] Version numbers calculated correctly
