# Versioning Strategy

This project uses **GitVersion** for automatic semantic versioning based on
commit messages and git tags.

## Overview

Versions are calculated automatically using the **GitVersion tool** in CI/CD workflows:

- **Base Version**: From latest git tag (e.g., `v1.0.0`)
- **Version Bumps**: From commit messages (`feat:`, `fix:`, `+semver:`, etc.)
- **Patch**: Auto-increments from commit count (default behavior)
- **Prerelease**: Suffix based on branch type (`alpha`, `beta`, `rc`)

## Version Format

```text
<major>.<minor>.<patch>[-<prerelease>.<build>]
```

### Examples

| Git Tag | Branch | Commits | Commit Messages | Calculated Version |
| ------- | ------ | ------- | --------------- | ------------------ |
| `v1.0.0` | `main` | 5 | `chore:`, `docs:` (no patterns) | `1.0.5` |
| `v1.0.0` | `feature/auth` | 3 | `feat: login`, `feat: logout` | `1.1.0-alpha.3` |
| `v1.0.0` | `main` | 1 | `feat!: breaking change` | `2.0.0` |
| `v1.0.0` | `main` | 1 | `+semver: breaking` | `2.0.0` |
| `v1.0.0` | `beta/testing` | 2 | `feat: new feature` | `1.1.0-beta.2` |
| `v1.0.0` | `release/v1.1` | 1 | `fix: bug` | `1.0.1-rc.1` |

## Commit Message Patterns (GitVersion Standard)

### Major Version Bump

Triggers: `2.0.0` (resets minor and patch to 0)

```text
+semver: breaking
+semver: major
feat(scope)!: ...
feat!: ...
BREAKING CHANGE: ...
```

**Example:**

```text
feat(api)!: Refactor renderer API

BREAKING CHANGE: flagOffsetX parameter removed, use flagOffsetPct instead

+semver: breaking
```

### Minor Version Bump

Triggers: `1.1.0` (resets patch to 0)

```text
+semver: minor
+semver: feature
feat(scope): ...
feature(scope): ...
```

**Example:**

```text
feat(step1): Add zoom control for profile pic adjustment

+semver: minor
```

### Patch Version Bump

Triggers: `1.0.1` (default behavior, also explicit)

```text
+semver: patch
+semver: fix
fix(scope): ...
bugfix(scope): ...
```

**Example:**

```text
fix(workflow): Fix default flag offset calculation

+semver: patch
```

### No Version Bump (Patch Increment Only)

These commit types default to patch increments:

```text
chore: ...
docs: ...
style: ...
refactor: ... (unless +semver: specified)
test: ...
```

**Example:**

```text
chore: Update dependencies
docs: Update README
refactor: Clean up code
```

Result: `1.0.0` → `1.0.1` → `1.0.2` → `1.0.3` (patch increments)

## Branch-Based Prerelease Suffixes

| Branch Pattern | Suffix | Description |
|----------------|--------|-------------|
| `main`, `master` | _(none)_ | Stable releases |
| `feature/*`, `feat/*`, `fix/*`, `bugfix/*` | `alpha` | Development |
| `beta/*` | `beta` | Beta testing |
| `release/*`, `hotfix/*` | `rc` | Release candidates |
| Other branches | `alpha` | Default for unlisted |

## How Version Calculation Works

### Step 1: Get Base Version from Tag

```bash
Latest tag: v1.0.0
Base version: 1.0.0
```

### Step 2: Analyze Commit Messages

```bash
Commits since tag:
- feat(step1): Add zoom control
- fix(workflow): Fix offset calculation
- refactor: Clean up code
```

**Analysis:**

- `feat:` → Minor bump detected
- `fix:` → Patch increment
- `refactor:` → Patch increment (default)

**Result:** Minor bump (takes precedence)

### Step 3: Calculate New Version

```bash
Base: 1.0.0
Bump: minor
New version: 1.1.0
```

### Step 4: Add Prerelease Suffix (if not main)

```bash
Branch: feature/profile-pic-adjustment
Commits: 3
Result: 1.1.0-alpha.3
```

## Creating Version Tags

### Automatic Tag Creation

The `tag-release.yml` workflow automatically creates tags on `main` when:

- Major or minor version bumps are detected
- Commits contain `+semver:`, `feat:`, or `feat!:` patterns

**You don't need to manually create tags** for major/minor versions.

### Manual Tag Creation (Optional)

If you want to manually tag a release:

```bash
git tag v1.1.0
git push origin v1.1.0
```

**Note:** Patch versions are calculated automatically and don't need tags.

## Using GitVersion

### Get Current Version (Local)

Install GitVersion locally:

```bash
# Using dotnet tool
dotnet tool install -g GitVersion.Tool

# Or using Chocolatey (Windows)
choco install gitversion.portable

# Or using Homebrew (macOS)
brew install gitversion
```

Then run:

```bash
gitversion
```

Output includes:

- `FullSemVer`: `1.1.0-alpha.3`
- `Major`: `1`
- `Minor`: `1`
- `Patch`: `0`

### In CI/CD Workflows

GitVersion is automatically installed and executed in workflows. The version
is available as workflow outputs:

```yaml
- name: Calculate version
  id: gitversion
  uses: gittools/actions/gitversion/execute@v0.9.15

- name: Use version
  run: echo "Version: ${{ steps.gitversion.outputs.fullSemVer }}"
```

## Real-World Examples for This Codebase

### Example 1: Feature Branch with New Features

**Current state:**

- Latest tag: `v1.0.0`
- Branch: `feature/profile-pic-adjustment`
- Commits: 6

**Commits:**

```text
feat(step1): Add zoom control
feat(step1): Add image positioning controls
refactor(workflow): implement image capture approach
fix(workflow): fix default flag offset
refactor(download): change saved filename format
refactor(code-review): fix all issues
```

**Version calculation:**

```text
Base: 1.0.0
Analysis: feat: commits detected → minor bump
Result: 1.1.0-alpha.6
```

### Example 2: Breaking Changes

**Commits:**

```text
feat(api)!: Refactor renderer API

BREAKING CHANGE: flagOffsetX removed, use flagOffsetPct

+semver: breaking
```

**Version calculation:**

```text
Base: 1.0.0
Analysis: feat!: + BREAKING CHANGE + +semver: breaking → major bump
Result: 2.0.0 (on main) or 2.0.0-alpha.1 (on feature branch)
```

### Example 3: Patch-Only Changes

**Commits:**

```text
fix(renderer): Fix flag offset calculation
fix(ui): Fix button alignment
chore: Update dependencies
```

**Version calculation:**

```text
Base: 1.0.0
Analysis: Only fix: and chore: → patch increments
Result: 1.0.3 (on main) or 1.0.3-alpha.3 (on feature branch)
```

### Example 4: No Patterns (Default Behavior)

**Commits:**

```text
chore: Update dependencies
docs: Update README
refactor: Clean up code
```

**Version calculation:**

```text
Base: 1.0.0
Analysis: No version-bumping patterns → patch increments only
Result: 1.0.3 (on main) or 1.0.3-alpha.3 (on feature branch)
```

## Beta Deployment Workflow

The beta deployment system uses the calculated version automatically:

1. **Create feature branch**: `feature/new-feature`
2. **Make commits**: Use `feat:`, `fix:`, or `+semver:` syntax
3. **Add deploy-beta label**: Triggers deployment
4. **Version is calculated**: e.g., `1.1.0-alpha.3`
5. **Deployed to**: `/beta/1.1.0-alpha.3/`

### Multiple Versions Example

```bash
# Current: v1.0.0 tag exists
# Work on feature branch
git checkout -b feature/dashboard

# After 3 commits with feat: messages
# Version: 1.1.0-alpha.3
# URL: /beta/1.1.0-alpha.3/

# Continue work, 2 more commits
# Next deployment version: 1.1.0-alpha.5
# URL: /beta/1.1.0-alpha.5/
```

Both versions coexist for comparison!

## Best Practices

### 1. Use Semantic Commit Messages

Always use conventional commit format:

```bash
feat(scope): Description
fix(scope): Description
feat(scope)!: Breaking change
```

### 2. Use `+semver:` for Explicit Control

When you need explicit version control:

```bash
feat: New feature +semver: minor
fix: Bug fix +semver: patch
refactor: Major refactor +semver: breaking
```

### 3. Let Patch Increment Automatically

Don't create tags like `v1.0.1`, `v1.0.2`, etc. The patch number is calculated automatically.

### 4. Branch Naming Matters

Use standard prefixes for correct prerelease suffixes:

- `feature/` → alpha versions
- `beta/` → beta versions
- `release/` → rc versions

### 5. Tags Are Created Automatically

The workflow creates tags on `main` when major/minor bumps are detected. You
only need to manually tag for special releases.

## Troubleshooting

### "Version is 0.0.0" (No Tags)

Create your first tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Version Not Bumping as Expected

Check your commit messages:

```bash
# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Ensure you're using:
# - feat: for minor bumps
# - feat!: or +semver: breaking for major bumps
# - fix: for patch bumps
```

### Wrong Prerelease Suffix

Check your branch name matches the patterns:

- `feature/my-feature` → alpha
- `beta/testing` → beta
- `release/v1.0` → rc

### Same Version for Different Branches

This is normal! If two branches are at the same commit count since the last
tag and have the same commit message patterns, they'll have the same base
version. The prerelease suffix differentiates them:

- `feature/auth`: `1.1.0-alpha.3`
- `beta/auth`: `1.1.0-beta.3`

## CI/CD Integration

### Beta Deployments

The `deploy-pr.yml` workflow automatically:

1. Checks out with full git history (`fetch-depth: 0`)
2. Installs and runs GitVersion tool
3. Uses calculated version (`fullSemVer`) for deployment path
4. Deploys to `/beta/<calculated-version>/`

### Production Deployments

For production, deploy from tagged commits on `main`:

```bash
# Workflow automatically creates tag when merging to main
# Tag: v1.1.0 (if feat: commits detected)
# Version: 1.1.0 (no prerelease suffix)
```

## Migration from Old Strategy

If you were using the old tag-based strategy:

1. **Existing tags are preserved**: `v1.0.0` tags still work
2. **New versioning is automatic**: Just use semantic commit messages
3. **No manual tag creation needed**: Workflow handles it

## Usage Examples

### Starting a New Feature

```bash
# Current: v1.0.0 tag exists
# Create feature branch
git checkout -b feature/user-profiles

# Check version
gitversion
# Output: 1.0.1-alpha.1 (patch increment, no feat: commits yet)

# Make commits with feat: messages
git commit -m "feat(profiles): Add profile model"
git commit -m "feat(profiles): Add profile API"
git commit -m "feat(profiles): Add profile UI"

# Check version again
gitversion
# Output: 1.1.0-alpha.3 (minor bump from feat: commits)

# Deploy to beta
# Adds deploy-beta label to PR
# Deploys to: /beta/1.1.0-alpha.3/
```

### Preparing a Release

```bash
# Create release branch
git checkout -b release/v1.1.0

# Check version
gitversion
# Output: 1.1.0-rc.1 (release candidate)

# Deploy to beta for final testing
# URL: /beta/1.1.0-rc.1/

# After approval, merge to main
git checkout main
git merge release/v1.1.0

# Workflow automatically creates tag: v1.1.0
# Version on main is now: 1.1.0
```

---

**Last Updated**: Based on GitVersion standard approach  
**Maintained By**: Development Team
