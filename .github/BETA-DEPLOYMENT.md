# Beta Deploym### Manual Workflow Dispatch (Optional)

If you need to deploy a branch without opening a PR:

1. Go to **Actions** → **Deploy to Beta** workflow
2. Click **Run workflow**
3. Select your branch (or leave empty for current branch)
4. Click **Run workflow**
5. Your branch will be deployed to betacess

This document explains how to deploy feature branches to the beta environment for manual testing before merging to production. Beta deployments are version-based using semantic versioning from `package.json`.

## Quick Start

### Automatic Deployment (Default)

1. Create your feature branch and open a PR to `main`
2. GitHub Actions will **automatically deploy** your branch to beta
3. A comment will appear on the PR with the deployment URL
4. Every push to the PR updates the beta deployment
5. Beta deployments persist and must be manually cleaned up when no longer needed

### Manual Workflow Dispatch

1. Go to **Actions** → **Deploy to Beta** workflow
2. Click **Run workflow**
3. Select your branch (or leave empty for current branch)
4. Click **Run workflow**
5. Your branch will be deployed to beta using the version from `package.json`

## Beta URLs

- **Beta Index**: `https://ravendarque.github.io/ravendarque-beyond-borders/beta/`
- **Version Deployment**: `https://ravendarque.github.io/ravendarque-beyond-borders/beta/<semver>/`

Example: `https://ravendarque.github.io/ravendarque-beyond-borders/beta/0.1.0/`

## Version Management

Beta deployments use **GitVersion-style automatic semantic versioning**:

- **Major.Minor**: From git tags (e.g., `v0.1`, `v1.0`)
- **Patch**: Calculated from commit count since tag
- **Prerelease**: Automatic suffix based on branch name
  - `feature/*`, `fix/*` → `alpha`
  - `beta/*` → `beta`
  - `release/*`, `hotfix/*` → `rc`
  - `main` → no suffix (stable)

**Example**: If you have tag `v0.2` and are 3 commits ahead on `feature/auth`:
- Calculated version: `0.2.3-alpha.3`
- Beta URL: `/beta/0.2.3-alpha.3/`

See [VERSIONING.md](./VERSIONING.md) for complete details.

### Quick Version Check

```bash
node scripts/get-version.cjs
```

### Creating Version Tags

To start a new major/minor version:

```bash
git tag v0.2
git push origin v0.2
```

Patch numbers increment automatically with each commit

## Use Cases

### 1. Manual Testing Before Merge
Deploy your feature branch to beta to test in a production-like environment:
```bash
# Update version in package.json, then create PR
gh pr create --title "New feature" --body "Description"
gh pr edit <PR_NUMBER> --add-label deploy-beta
```

### 2. Stakeholder Review
Share the versioned beta URL with stakeholders for feedback:
- Non-technical reviewers can test the feature
- Design review in production-like environment
- Cross-browser/device testing without local setup
- Stable URL that persists across iterations

### 3. Complex Feature Validation
Test features that require:
- Real deployment environment
- Service worker behavior
- PWA installation
- Production build optimizations

### 4. Multiple Version Testing
Test multiple versions simultaneously:
- Deploy `0.2.0-alpha.1` for early testing
- Deploy `0.2.0-beta.1` for feature testing
- Compare side-by-side before promoting to production

## Workflow Details

### Deploy to Beta Workflow

**Triggers:**
- Manual: Workflow dispatch from Actions tab
- Automatic: When `deploy-beta` label is added to a PR

**Process:**
1. Checks out the specified branch
2. Extracts version from `package.json`
3. Installs dependencies
4. Builds the app with beta base path (includes version)
5. Deploys to `gh-pages` branch in `beta/<semver>/` directory
6. Updates beta index page with all versions
7. Comments on PR with deployment URL (if triggered by label)

**Environment:** Uses GitHub Environment named `beta` (requires setup)

### Cleanup Beta Workflow

**Triggers:**
- Manual: Workflow dispatch from Actions tab (requires version input)

**Process:**
1. Removes the specified version directory from beta
2. Updates beta index page
3. Provides cleanup summary

**Note:** Beta deployments are NOT automatically cleaned up when PRs close. This allows versions to persist for ongoing testing. Clean up manually when no longer needed.

## Configuration

### GitHub Environment Setup

1. Go to **Settings** → **Environments**
2. Create environment named `beta`
3. (Optional) Add protection rules:
   - Required reviewers for manual deployments
   - Deployment branches (limit which branches can deploy)

### Vite Configuration

The build uses the `BASE_URL` environment variable to set the base path with version. The configuration in `vite.config.ts`:

```typescript
export default defineConfig({
  base: process.env.BASE_URL || 
        (process.env.NODE_ENV === 'production' ? '/ravendarque-beyond-borders/' : '/'),
  // ... rest of config
});
```

The workflow sets `BASE_URL=/ravendarque-beyond-borders/beta/<semver>/` during build.

## Best Practices

### ✅ Do

- **Update version** in `package.json` before deploying
- Deploy to beta for manual testing before merge
- Share beta URLs for stakeholder review (they persist)
- Test on real devices using beta deployment
- Use prerelease versions (`-alpha`, `-beta`, `-rc`) for testing
- Clean up old beta versions periodically
- Use beta for cross-browser testing

### ❌ Don't

- Don't deploy without updating version (will overwrite existing deployment)
- Don't deploy every commit (wait until ready for review)
- Don't forget to clean up old versions
- Don't use production version numbers for testing
- Don't rely on beta for critical paths (use local dev for iteration)

## Troubleshooting

### Deployment Failed

**Check:**
1. Build logs in Actions tab
2. Version in `package.json` is valid semver
3. Vite configuration (base path)
4. GitHub Pages is enabled
5. `gh-pages` branch exists

### Beta URL Returns 404

**Possible causes:**
1. Deployment still in progress (check Actions)
2. GitHub Pages needs 1-2 minutes to update
3. Version was not deployed (check `beta/` index)
4. Wrong version number in URL

### Version Collision

If deploying overwrites an existing version:
- Update version in `package.json` to a new value
- Use prerelease suffixes (`-alpha.1`, `-beta.2`, etc.)

### Deployment Not Triggering

**Check:**
1. `deploy-beta` label is correctly spelled
2. Workflow permissions are set correctly
3. GitHub Actions are enabled for the repository
4. Version in `package.json` is valid

## Cleanup

### Manual Cleanup

To remove a beta deployment:

1. Go to **Actions** → **Cleanup Beta Deployment**
2. Click **Run workflow**
3. Enter the version to remove (e.g., `0.1.0`)
4. Click **Run workflow**

### No Automatic Cleanup

Beta deployments persist until manually removed. This is by design:
- Allows long-term testing of specific versions
- Stakeholders can revisit URLs
- Multiple versions can coexist
- Clean up when truly done with a version

## Cost and Limits

- **GitHub Pages**: Free for public repositories
- **GitHub Actions**: 2000 minutes/month free (public repos have unlimited minutes)
- **Storage**: GitHub Pages has 1GB soft limit

Beta deployments consume:
- ~50-100MB per version (depends on build size)
- ~2-5 minutes of Actions time per deployment
- Multiple versions accumulate (clean up old ones)

## Examples

### Deploy Current Branch to Beta
```bash
# From any branch (uses version from package.json)
gh workflow run deploy-beta.yml
```

### Deploy Specific Branch to Beta
```bash
gh workflow run deploy-beta.yml -f branch=feature/new-feature
```

### Deploy PR to Beta with Label
```bash
# First update version in package.json, commit, then:
gh pr edit 123 --add-label deploy-beta
```

### Remove Beta Deployment
```bash
# Manually remove a specific version
gh workflow run cleanup-beta.yml -f version=0.1.0
```

### View All Beta Deployments
Visit: `https://ravendarque.github.io/ravendarque-beyond-borders/beta/`

## Related Documentation

- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments)
- [GitHub Pages](https://docs.github.com/en/pages)
- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
