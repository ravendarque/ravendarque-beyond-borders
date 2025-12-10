# Git Hooks

This directory contains Git hooks for the Beyond Borders project.

## Available Hooks

### pre-push

Runs validation checks before allowing a push to proceed. This helps catch issues locally before they reach CI.

**Checks performed:**
- Secret scanning (TruffleHog)
- Security audit (Trivy)
- Markdown linting
- YAML linting
- TODO/FIXME detection (warning only)
- File permission validation
- Large file detection (>1MB warning)
- Privacy check (Google Fonts, tracking scripts, external CDNs)
- Conditional build/test (if production code changed)

## Installation

To install the pre-push hook, run from the repository root:

### Windows (PowerShell):
```powershell
# Create hooks directory if it doesn't exist
New-Item -Path .git\hooks -ItemType Directory -Force

# Copy the hook
Copy-Item -Path .github\hooks\pre-push -Destination .git\hooks\pre-push -Force

# Make executable (if using Git Bash)
git update-index --chmod=+x .git/hooks/pre-push
```

### Linux/macOS:
```bash
# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy the hook
cp .github/hooks/pre-push .git/hooks/pre-push

# Make executable
chmod +x .git/hooks/pre-push
```

## Bypassing the Hook

If you need to push without running validation (not recommended):

```bash
git push --no-verify
```

## Manual Validation

You can also run validation manually without pushing:

### All platforms (PowerShell Core - required):
```powershell
pwsh .github/scripts/validate-local.ps1
```

### Windows (Windows PowerShell):
```powershell
.\.github\scripts\validate-local.ps1
```

**Note:** PowerShell Core (pwsh) is required and works on all platforms. Install from https://github.com/PowerShell/PowerShell

## Required Tools

The validation scripts will check for required tools and provide installation instructions if any are missing:

- **PowerShell Core (pwsh)** - Recommended for all platforms (install from https://github.com/PowerShell/PowerShell)
- **TruffleHog** - Secret scanning
- **Trivy** - Security audit
- **markdownlint-cli2** - Markdown linting
- **yamllint** - YAML linting
- **Node.js & pnpm** - For build/test (conditional)

## Troubleshooting

If the hook fails to run:

1. Verify the hook is executable: `ls -l .git/hooks/pre-push`
2. Check the hook file has correct line endings (LF, not CRLF)
3. Ensure PowerShell or Bash is available in your PATH
4. Try running validation manually to see detailed error messages

For more information, see `.github/scripts/validate-local.ps1`.
