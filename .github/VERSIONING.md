# Versioning Strategy

This project uses **GitVersion-style automatic semantic versioning** based on git tags and commit history.

## Overview

Versions are calculated automatically using the `scripts/get-version.cjs` script:

- **Major.Minor**: From latest git tag (e.g., `v0.1`, `v1.0`)
- **Patch**: Commit count since the tag
- **Prerelease**: Suffix based on branch type (alpha, beta, rc)

## Version Format

```
<major>.<minor>.<patch>[-<prerelease>.<build>]
```

### Examples

| Git Tag | Branch | Commits Since Tag | Calculated Version |
|---------|--------|-------------------|-------------------|
| `v0.1` | `main` | 5 | `0.1.5` |
| `v0.1` | `feature/auth` | 3 | `0.1.3-alpha.3` |
| `v0.2` | `beta/new-ui` | 7 | `0.2.7-beta.7` |
| `v1.0` | `release/v1.0` | 2 | `1.0.2-rc.2` |
| `v0.1` | `hotfix/security` | 1 | `0.1.1-rc.1` |

## Branch-Based Prerelease Suffixes

| Branch Pattern | Suffix | Description |
|----------------|--------|-------------|
| `main`, `master` | _(none)_ | Stable releases |
| `feature/*`, `feat/*`, `fix/*`, `bugfix/*` | `alpha` | Development features |
| `beta/*` | `beta` | Beta testing |
| `release/*`, `hotfix/*` | `rc` | Release candidates |
| Other branches | `alpha` | Default for unlisted patterns |

## Creating Version Tags

### Initial Setup

If no tags exist, create the first one:

```bash
git tag v0.1
git push origin v0.1
```

### Incrementing Major Version

When introducing breaking changes:

```bash
git tag v1.0
git push origin v1.0
```

### Incrementing Minor Version

When adding new features (backwards compatible):

```bash
git tag v0.2
git push origin v0.2
```

### Patch Version

**Patch numbers are calculated automatically** from commit count since the last tag. You don't need to create patch tags.

## Using the Version Script

### Get Current Version

```bash
node scripts/get-version.cjs
```

Output: `0.1.5-alpha.5`

### Update package.json

To sync `package.json` with the calculated version:

```bash
node scripts/get-version.cjs --update
```

This updates `package.json` to match the calculated version.

## Beta Deployment Workflow

The beta deployment system uses the calculated version automatically:

1. **Create feature branch**: `feature/new-feature`
2. **Make commits**: Each commit increments the patch/build number
3. **Add deploy-beta label**: Triggers deployment
4. **Version is calculated**: e.g., `0.1.7-alpha.7`
5. **Deployed to**: `/beta/0.1.7-alpha.7/`

### Multiple Versions Example

```bash
# Create v0.2 tag for new minor version
git tag v0.2
git push origin v0.2

# Work on feature branch
git checkout -b feature/dashboard

# After 3 commits, deploy
# Version: 0.2.3-alpha.3
# URL: /beta/0.2.3-alpha.3/

# Continue work, 2 more commits
# Next deployment version: 0.2.5-alpha.5
# URL: /beta/0.2.5-alpha.5/
```

Both versions coexist for comparison!

## Version Calculation Logic

```javascript
// Pseudocode
function calculateVersion() {
  const latestTag = getLatestTag();        // e.g., "v0.1"
  const [major, minor] = parseTag(latestTag); // [0, 1]
  const patch = getCommitsSinceTag();      // e.g., 7
  const branch = getCurrentBranch();       // e.g., "feature/auth"
  const prerelease = getPrerelease(branch); // e.g., "alpha"
  
  if (prerelease) {
    return `${major}.${minor}.${patch}-${prerelease}.${patch}`;
    // Result: "0.1.7-alpha.7"
  } else {
    return `${major}.${minor}.${patch}`;
    // Result: "0.1.7" (main branch)
  }
}
```

## Best Practices

### 1. Tag Meaningful Milestones

Create tags when you complete significant work:

- After merging a major feature set
- Before starting a new development phase
- When reaching a release candidate state

### 2. Use Semantic Tag Names

- `v0.1` → Initial development
- `v0.2` → First working prototype
- `v1.0` → First production release
- `v1.1` → New features added
- `v2.0` → Breaking changes

### 3. Let Patch Increment Automatically

Don't create tags like `v0.1.1`, `v0.1.2`, etc. The patch number is calculated from commits.

### 4. Branch Naming Matters

Use standard prefixes for correct prerelease suffixes:

- `feature/` → alpha versions
- `beta/` → beta versions
- `release/` → rc versions

### 5. Tag from Main Branch

Create version tags on `main` branch after merging:

```bash
git checkout main
git pull
git tag v0.2
git push origin v0.2
```

## Troubleshooting

### "Version is 0.0.X" (No Tags)

Create your first tag:

```bash
git tag v0.1
git push origin v0.1
```

### Version Not Incrementing

Ensure you're fetching tags:

```bash
git fetch --tags
```

The workflow uses `fetch-depth: 0` to get full history.

### Wrong Prerelease Suffix

Check your branch name matches the patterns:

- `feature/my-feature` → alpha
- `beta/testing` → beta
- `release/v1.0` → rc

### Same Version for Different Branches

This is normal! If two branches are at the same commit count since the last tag, they'll have the same base version. The prerelease suffix differentiates them:

- `feature/auth`: `0.1.5-alpha.5`
- `beta/auth`: `0.1.5-beta.5`

## CI/CD Integration

### Beta Deployments

The `deploy-beta.yml` workflow automatically:

1. Checks out with full git history (`fetch-depth: 0`)
2. Runs `node scripts/get-version.cjs`
3. Uses calculated version for deployment path
4. Deploys to `/beta/<calculated-version>/`

### Production Deployments

For production, deploy from tagged commits on `main`:

```bash
# Create production tag
git checkout main
git tag v1.0
git push origin v1.0

# Trigger production deployment
# Version will be: 1.0.0 (no prerelease suffix)
```

## Migration from Manual Versioning

If you previously used manual `package.json` versioning:

1. **Create initial tag** matching current version:
   ```bash
   git tag v0.1  # or whatever major.minor you're on
   git push origin v0.1
   ```

2. **Start using calculated versions**:
   ```bash
   node scripts/get-version.cjs --update
   ```

3. **Commit updated package.json**:
   ```bash
   git add package.json
   git commit -m "chore: sync version with git tags"
   ```

## Examples

### Starting a New Feature

```bash
# Create tag for current state
git tag v0.2
git push origin v0.2

# Create feature branch
git checkout -b feature/user-profiles

# Check version
node scripts/get-version.cjs
# Output: 0.2.0-alpha.0

# Make 3 commits
git commit -m "feat: add profile model"
git commit -m "feat: add profile API"
git commit -m "feat: add profile UI"

# Check version again
node scripts/get-version.cjs
# Output: 0.2.3-alpha.3

# Deploy to beta
# Adds deploy-beta label to PR
# Deploys to: /beta/0.2.3-alpha.3/
```

### Preparing a Release

```bash
# Create release branch
git checkout -b release/v1.0

# Check version
node scripts/get-version.cjs
# Output: 0.9.5-rc.5 (assuming v0.9 tag, 5 commits after)

# Deploy to beta for final testing
# URL: /beta/0.9.5-rc.5/

# After approval, merge to main and tag
git checkout main
git merge release/v1.0
git tag v1.0
git push origin v1.0

# Version on main is now: 1.0.0
```

---

**Last Updated**: November 1, 2025  
**Maintained By**: Development Team
