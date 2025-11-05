# Production Deployment

## Workflow

File: `.github/workflows/deploy-pages.yml`

## Triggers

- Push to `main` (ignores docs, markdown, and local files)
- Manual `workflow_dispatch`

## Process

1. Build app with `BASE_URL=/` (for custom domain)
2. Checkout `gh-pages` branch
3. Preserve existing `beta/*` directories
4. Deploy build to root of `gh-pages`
5. Include `CNAME` file automatically (from `public/CNAME`)
6. Commit and push to `gh-pages`

## Key Features

- Preserves beta deployments during production updates
- Supports custom domain via `CNAME` file
- Creates provenance artifact retained for 30 days
- Single source of truth (`gh-pages` branch)

## Permissions

```yaml
permissions:
  contents: write
```

## URLs

- **Custom Domain:** <https://wearebeyondborders.com>
- **GitHub Pages:** `https://<owner>.github.io/<repo>/`

## Deployment Checklist

**Initial Setup:**

- [ ] GitHub Pages set to "Deploy from a branch" (gh-pages)
- [ ] `public/CNAME` file contains custom domain
- [ ] DNS records configured for custom domain
- [ ] Production workflow `BASE_URL` set to `/`

**Per Deployment:**

- [ ] Workflow completes successfully
- [ ] Production preserves beta directories
- [ ] Custom domain resolves correctly
- [ ] All assets load properly
