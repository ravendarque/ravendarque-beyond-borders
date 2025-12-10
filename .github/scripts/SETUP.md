<!-- markdownlint-disable MD013 -->
# Development Environment Setup

This directory contains scripts to automate the setup of your development
environment for Beyond Borders.

## Package Manager Strategy

The setup scripts use **npm exclusively** for all development tools to ensure consistency and reliability:

### All Platforms

- **npm** - Package manager for pnpm installation only
- **npx** - On-demand execution for linting tools (markdownlint-cli2, yaml-lint)
- **pnpm** - Project dependencies
- **Manual installation** - Optional security tools (TruffleHog, Trivy) with clear instructions

This approach ensures:

- ✅ Consistent installation across all platforms
- ✅ No dependency on Python or other runtimes
- ✅ No global package installation issues (uses npx)
- ✅ Always uses latest tool versions via npx
- ✅ Simple troubleshooting (minimal global dependencies)

## Quick Start

### Windows (PowerShell)

```powershell
# Full setup (recommended for first-time setup)
.\.github\scripts\setup-dev-env.ps1

# Preview what would be installed
.\.github\scripts\setup-dev-env.ps1 -DryRun

# Install only essential tools (skip optional security tools)
.\.github\scripts\setup-dev-env.ps1 -SkipOptional
```

**⚠️ IMPORTANT:** After running the setup script, **restart your PowerShell terminal** to refresh the PATH environment variable. Newly installed tools won't be detected until you open a new terminal window.

### Linux/macOS (PowerShell Core)

```powershell
# Full setup (recommended for first-time setup)
pwsh .github/scripts/setup-dev-env.ps1

# Preview what would be installed
pwsh .github/scripts/setup-dev-env.ps1 -DryRun

# Install only essential tools (skip optional security tools)
pwsh .github/scripts/setup-dev-env.ps1 -SkipOptional
```

## What Gets Installed

The setup scripts install all tools needed for building, testing, and validating the project.

### Essential Tools (Always Installed)

| Tool | Purpose | Installation Method |
|------|---------|---------------------|
| **Git** | Version control | Checked (must be pre-installed) |
| **Node.js** (18.x or 20.x) | JavaScript runtime | Checked (must be pre-installed) |
| **pnpm** | Package manager | `npm install -g pnpm` |
| **Project dependencies** | React, Vite, etc. | `pnpm install` |
| **Playwright browsers** | E2E testing | `pnpm exec playwright install --with-deps` |
| **npx** | On-demand tool execution | Built into Node.js (no install needed) |
| **markdownlint-cli2** | Markdown linting | Via `npx` (downloaded on first use) |
| **yaml-lint** | YAML linting | Via `npx` (downloaded on first use) |

### Optional Tools (Skipped with `--skip-optional`)

| Tool | Purpose | Notes |
|------|---------|-------|
| **TruffleHog** | Secret scanning | CI-only (not used in local validation for speed) |
| **Trivy** | Security vulnerability scanning | Manual install or Docker |

## Prerequisites

Before running the setup scripts, you must have:

1. **Git** - [Download](https://git-scm.com/downloads)
2. **Node.js 18.x or 20.x** - [Download](https://nodejs.org/)

The scripts will check for these and provide installation instructions if missing.

## Detailed Setup Instructions

### Windows Setup

#### Using PowerShell (Recommended)

1. Clone the repository:

   ```powershell
   git clone <repository-url>
   cd beyond-borders
   ```

2. Run the setup script:

   ```powershell
   .\.github\scripts\setup-dev-env.ps1
   ```

3. Follow any manual installation instructions for missing tools

#### Package Managers (Optional)

If you have a Windows package manager, some tools can be installed automatically:

- **winget** (Windows 11): `winget install OpenJS.NodeJS.LTS`, `winget install Python.Python.3.12`
- **Chocolatey**: `choco install nodejs-lts python`
- **Scoop**: `scoop install nodejs-lts python`

### Linux Setup

#### Ubuntu/Debian

1. Install prerequisites:

   ```bash
   sudo apt-get update
   sudo apt-get install git curl python3 python3-pip
   ```

2. Install Node.js via nvm (recommended):

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install --lts
   ```

3. Run the setup script:

   ```powershell
   pwsh .github/scripts/setup-dev-env.ps1
   ```

#### Fedora/RHEL

1. Install prerequisites:

   ```bash
   sudo dnf install git curl python3 python3-pip
   ```

2. Install Node.js and run setup (same as Ubuntu above)

### macOS Setup

#### Using Homebrew (Recommended)

1. Install Homebrew if not already installed:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install prerequisites:

   ```bash
   brew install git node@20 python
   ```

3. Run the setup script:

   ```powershell
   pwsh .github/scripts/setup-dev-env.ps1
   ```

## Verification

After setup completes, **restart your terminal** and verify your environment:

**Windows (PowerShell):**

```powershell
# FIRST: Close and reopen PowerShell to refresh PATH

# Check Node.js
node --version  # Should be v18.x or v20.x

# Check pnpm
pnpm --version

# Check project dependencies
pnpm list

# Run tests
pnpm test

# Start development server
pnpm dev

# Run validation (this will auto-refresh PATH internally)
.\.github\scripts\local-ci.ps1
```

**Linux/macOS (Bash):**

```bash
# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh

# Check Node.js
node --version  # Should be v18.x or v20.x

# Check pnpm
pnpm --version

# Check project dependencies
pnpm list

# Run tests
pnpm test

# Start development server
pnpm dev

# Run validation
pwsh .github/scripts/validate-local.ps1
```

## Troubleshooting

### Tools Not Found After Installation (Windows)

If the validation script reports tools as "not installed" even after running setup:

1. **Restart PowerShell** - This is the most common issue. Close and reopen your terminal.
2. **Check installation** - Run `Get-Command <toolname>` to verify
3. **Manual PATH check** - Tools may be in non-standard locations
4. **Re-run setup** - Try running the setup script again

The validation script now automatically refreshes PATH, but some tools may require a full terminal restart.

### "Permission Denied" Errors (Linux/macOS)

If you get permission errors when installing global npm packages:

```bash
# Use --user flag with pip
python3 -m pip install --user yamllint

# Or configure npm to use a user directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Playwright Installation Fails

Playwright may need system dependencies:

```bash
# Ubuntu/Debian
sudo apt-get install libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1

# Or use Playwright's built-in installer
pnpm exec playwright install-deps
```

### Python/pip Not Found (Windows)

1. Install Python from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Restart PowerShell after installation

### Node.js Version Too Old

Update Node.js:

**Using nvm (recommended):**

```bash
nvm install --lts
nvm use --lts
```

**Manual installation:**

- Download from [nodejs.org](https://nodejs.org/)
- Or use your package manager to upgrade

## Optional Tools Setup

### TruffleHog (Secret Scanning)

**Note:** TruffleHog is used in CI workflows only. Local validation does not run secret scanning to keep pre-push checks fast. If you still want to install it for manual use:

**Windows:**

```powershell
# Download from releases
# https://github.com/trufflesecurity/trufflehog/releases
# Extract and add to PATH
```

**macOS:**

```bash
brew install trufflehog
```

**Linux:**

```bash
# Download binary from releases
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
```

**Using Docker (all platforms):**

```bash
docker pull trufflesecurity/trufflehog:latest
```

### Trivy (Security Scanning)

**Windows:**

```powershell
# Using Chocolatey
choco install trivy

# Or download from releases
# https://github.com/aquasecurity/trivy/releases
```

**macOS:**

```bash
brew install trivy
```

**Linux:**

```bash
# Ubuntu/Debian
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

**Using Docker (all platforms):**

```bash
docker pull aquasec/trivy:latest
```

## Next Steps

After setup is complete:

1. **Start development server**: `pnpm dev`
2. **Run tests**: `pnpm test`
3. **Run validation**: `pwsh .github/scripts/local-ci.ps1`
4. **Install git pre-push hook**: See [.github/hooks/README.md](../hooks/README.md)
5. **Read contributing guidelines**: See [README.md](../../README.md#contributing)

## Script Options

### PowerShell (`setup-dev-env.ps1`)

```powershell
# Full setup (default)
.\.github\scripts\setup-dev-env.ps1

# Dry run - show what would be installed
.\.github\scripts\setup-dev-env.ps1 -DryRun

# Skip optional tools (TruffleHog, Trivy)
.\.github\scripts\setup-dev-env.ps1 -SkipOptional

# Combine options
.\.github\scripts\setup-dev-env.ps1 -DryRun -SkipOptional
```

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Read the tool-specific documentation
3. Create an issue in the repository
4. Ask in the team chat/Discord

## Related Documentation

- **Validation Scripts**: See [local-ci.ps1](./local-ci.ps1)
- **Git Hooks**: See [.github/hooks/README.md](../hooks/README.md)
- **Contributing**: See [README.md](../../README.md#contributing)
- **CI/CD**: See [.github/workflows/ci.yml](../workflows/ci.yml)
