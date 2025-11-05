# Beta Deployment

## Workflow

File: `.github/workflows/deploy-beta.yml`

## Invocation

- `workflow_dispatch` with optional `branch` input
- Adding a `deploy-beta` label to a pull request

## Process

1. Determine branch & derive semantic version via `scripts/get-version.cjs`
2. Build with `BASE_URL=/<repo>/beta/<semver>/`
3. Commit build into `gh-pages` under `beta/<semver>/`
4. Generate/refresh index page enumerating all beta versions

## URLs

- **Beta URL pattern:** `https://<owner>.github.io/<repo>/beta/<semver>/`
- **Beta index page:** `https://<owner>.github.io/<repo>/beta/`

## Cleanup

Workflow: `.github/workflows/cleanup-beta.yml`

Removes a specific version directory and regenerates the beta index.

## Benefits

- Multiple parallel preview versions preserved simultaneously
- Simple static hosting coexisting with production
- Enables testers to compare versions side-by-side
- Consistent deployment method with production

## Manual Deployment

Trigger a manual beta deployment of your current branch:

```bash
gh workflow run deploy-beta.yml -f branch=$(git rev-parse --abbrev-ref HEAD)
```

## Checklist

- [ ] Beta workflow unchanged from defaults
- [ ] Beta deployments accessible
- [ ] Version numbers calculated correctly
