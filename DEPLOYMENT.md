# Deployment Architecture

This project uses a **unified GitHub Pages deployment strategy** where
both production and beta deployments push to the `gh-pages` branch.

## Overview

- **Production** – deploys to the root of `gh-pages` branch
- **Beta** – deploys versioned builds to `gh-pages/beta/<semver>/`

Both use the same deployment method for consistency and reliability.

## GitHub Pages Configuration

**CRITICAL:** GitHub Pages must be configured to deploy from `gh-pages`:

1. Go to: **Settings → Pages**
2. Under "Build and deployment" → "Source"
3. Select: **"Deploy from a branch"**
4. Branch: **`gh-pages`**
5. Folder: **`/ (root)`**

## Deployment Types

- [Production Deployment](docs/deployment-production.md)
- [Beta Deployment](docs/deployment-beta.md)
- [Custom Domain Setup](docs/deployment-custom-domain.md)

## Quick Links

- [Troubleshooting](docs/deployment-troubleshooting.md)
- [Architecture Decision](docs/deployment-architecture-decision.md)

## Architecture Decision

**Why both use `gh-pages` branch?**

Previously attempted using GitHub Actions deployment for production while
beta used `gh-pages` branch. This failed because GitHub Pages can only
use ONE deployment method.

Current unified approach:

- ✅ Both production and beta accessible
- ✅ Consistent deployment method
- ✅ Production preserves beta versions
- ✅ Single Pages configuration
- ✅ Custom domain works correctly

See [full architecture decision](docs/deployment-architecture-decision.md)
for details.
