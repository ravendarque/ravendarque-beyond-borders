# Deployment Architecture Decision

## Problem

Previously attempted using GitHub Actions deployment (`actions/deploy-pages`)
for production while beta used `gh-pages` branch.

## Why It Failed

GitHub Pages can only use **ONE** deployment method:

- **"GitHub Actions"** method → Ignores gh-pages branch entirely
- **"Deploy from a branch"** method → Uses gh-pages branch content

When production used Actions deployment:

- Production deployed via Actions artifacts
- Beta pushed to `gh-pages/beta/*` subdirectories
- **But** GitHub Pages ignored the `gh-pages` branch
- Result: Beta deployments became inaccessible

## Solution: Unified Approach

Both production and beta now push to `gh-pages` branch:

- **Production** → pushes to root of `gh-pages`
- **Beta** → pushes to `gh-pages/beta/<semver>/`
- **GitHub Pages** → set to "Deploy from a branch" (gh-pages)

## Benefits

- ✅ Both production and beta accessible
- ✅ Consistent deployment method
- ✅ Production preserves beta versions during updates
- ✅ Single Pages configuration
- ✅ Custom domain works correctly via CNAME file
- ✅ Simpler mental model (one deployment target)

## Trade-offs

**What we gave up:**

- GitHub Actions deployment provenance features
- Separate artifact-based deployment for production

**What we gained:**

- Unified, predictable deployment process
- Beta and production coexist reliably
- Easier to understand and debug
- Custom domain support without conflicts
