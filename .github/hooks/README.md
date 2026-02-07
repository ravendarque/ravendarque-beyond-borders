# Git Hooks

This directory contains Git hooks for the Beyond Borders project.

## Available Hooks

### pre-commit

Runs fast validation checks on staged files before allowing a commit. Catches lint/format issues early (< 5 seconds typically).

**Checks performed:**

- Lint staged code files (ESLint) - `.ts`, `.tsx`, `.js`, `.jsx`
- Format check staged files (Prettier) - `.ts`, `.tsx`, `.js`, `.jsx`, `.md`, `.yml`, `.yaml`, `.json`

### pre-push

Runs comprehensive validation checks before allowing a push to proceed. This helps catch issues locally before they reach CI.

**Checks performed:**

- Secret scanning (TruffleHog)
- Security audit (Trivy)
- YAML linting
- TODO/FIXME detection (warning only)
- File permission validation
- Large file detection (>1MB warning)
- Privacy check (Google Fonts, tracking scripts, external CDNs)
- **Lint (ESLint)** and **format check (Prettier)** when production code changed
- Conditional build/test (if production code changed)

## Installation

To install the hooks, run from the repository root:

### Windows (PowerShell):

```powershell
# Create hooks directory if it doesn't exist
New-Item -Path .git\hooks -ItemType Directory -Force

# Copy the hooks
Copy-Item -Path .github\hooks\pre-commit -Destination .git\hooks\pre-commit -Force
Copy-Item -Path .github\hooks\pre-push -Destination .git\hooks\pre-push -Force

# Make executable (if using Git Bash)
git update-index --chmod=+x .git/hooks/pre-commit
git update-index --chmod=+x .git/hooks/pre-push
```

### Linux/macOS:

```bash
# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the hooks
cp .github/hooks/pre-commit .git/hooks/pre-commit
cp .github/hooks/pre-push .git/hooks/pre-push

# Make executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
```

## Bypassing the Hooks

If you need to bypass validation (not recommended):

```bash
# Skip pre-commit checks
git commit --no-verify

# Skip pre-push checks
git push --no-verify
```

## Manual Validation

You can also run validation manually:

### Pre-commit checks (fast - staged files only):

```powershell
pwsh .github/scripts/pre-commit.ps1
```

### Pre-push checks (full validation):

### All platforms (PowerShell Core - required):

```powershell
pwsh .github/scripts/local-ci.ps1
```

### Windows (Windows PowerShell):

```powershell
.\.github\scripts\local-ci.ps1
```

**Note:** PowerShell Core (pwsh) is required and works on all platforms. Install from https://github.com/PowerShell/PowerShell

## Required Tools

The validation scripts will check for required tools and provide installation instructions if any are missing:

- **PowerShell Core (pwsh)** - Recommended for all platforms (install from https://github.com/PowerShell/PowerShell)
- **TruffleHog** - Secret scanning
- **Trivy** - Security audit
- **yamllint** - YAML linting
- **Node.js & pnpm** - Lint (ESLint), format check (Prettier), build/test (conditional)

## Troubleshooting

If a hook fails to run:

1. Verify the hooks are executable: `ls -l .git/hooks/`
2. Check the hook files have correct line endings (LF, not CRLF)
3. Ensure PowerShell Core (pwsh) is available in your PATH
4. Try running validation manually to see detailed error messages

For more information, see:

- Pre-commit: `.github/scripts/pre-commit.ps1`
- Pre-push: `.github/scripts/local-ci.ps1`
