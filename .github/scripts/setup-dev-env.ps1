<#
.SYNOPSIS
    Setup development environment for Beyond Borders
.DESCRIPTION
    Installs all tools and dependencies needed for:
    - Building and running the app
    - Running tests (unit, integration, e2e)
    - Pre-push validation (security, linting, etc.)
    
    Package Manager Preference Order (Windows):
    1. npm/pip - For Node.js and Python packages (language-specific)
    2. winget - Modern Windows package manager (preferred for system tools)
    3. choco - Chocolatey package manager (widely available)
    4. scoop - Lightweight package manager (fallback)
.PARAMETER DryRun
    Show what would be installed without actually installing
.PARAMETER SkipOptional
    Skip optional tools (TruffleHog, Trivy) and only install essentials
.EXAMPLE
    .\setup-dev-env.ps1
    Install all required and optional tools
.EXAMPLE
    .\setup-dev-env.ps1 -DryRun
    Show what would be installed
.EXAMPLE
    .\setup-dev-env.ps1 -SkipOptional
    Install only essential tools (Node.js, pnpm, npm packages)
#>

param(
    [switch]$DryRun,
    [switch]$SkipOptional
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Header($message) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Step($message) {
    Write-Host "▶ $message" -ForegroundColor White
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Check if running as administrator
function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if a command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check if a package manager is available
function Get-PackageManager {
    if (Test-Command "winget") { return "winget" }
    if (Test-Command "choco") { return "choco" }
    if (Test-Command "scoop") { return "scoop" }
    return $null
}

Write-Header "🚀 Beyond Borders Development Environment Setup"

if ($DryRun) {
    Write-Info "DRY RUN MODE - No changes will be made"
}

# Summary counters
$installed = 0
$skipped = 0
$failed = 0
$alreadyInstalled = 0

# 1. Check Git
Write-Step "Checking Git..."
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Success "Git already installed: $gitVersion"
    $alreadyInstalled++
} else {
    Write-Error "Git is not installed"
    Write-Host "  Please install Git from: https://git-scm.com/download/win" -ForegroundColor Gray
    $failed++
}

# 2. Check Node.js
Write-Step "Checking Node.js..."
if (Test-Command "node") {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeMajor -ge 18) {
        Write-Success "Node.js already installed: $nodeVersion"
        $alreadyInstalled++
    } else {
        Write-Warning "Node.js version $nodeVersion is too old (need 18.x or 20.x)"
        Write-Host "  Please upgrade Node.js from: https://nodejs.org/" -ForegroundColor Gray
        $failed++
    }
} else {
    Write-Warning "Node.js not found"
    Write-Host "  Install from: https://nodejs.org/ (LTS version recommended)" -ForegroundColor Gray
    Write-Host "  Or use a package manager:" -ForegroundColor Gray
    Write-Host "    winget install OpenJS.NodeJS.LTS" -ForegroundColor Gray
    Write-Host "    choco install nodejs-lts" -ForegroundColor Gray
    Write-Host "    scoop install nodejs-lts" -ForegroundColor Gray
    $failed++
}

# 3. Check/Install pnpm
Write-Step "Checking pnpm..."
if (Test-Command "pnpm") {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm already installed: $pnpmVersion"
    $alreadyInstalled++
} else {
    Write-Warning "pnpm not found"
    if (-not $DryRun) {
        Write-Info "Installing pnpm via npm..."
        try {
            npm install -g pnpm
            Write-Success "pnpm installed successfully"
            $installed++
        } catch {
            Write-Error "Failed to install pnpm: $_"
            $failed++
        }
    } else {
        Write-Info "Would install: npm install -g pnpm"
        $skipped++
    }
}

# 4. Install project dependencies
Write-Step "Checking project dependencies..."
if (Test-Path "package.json") {
    if (-not $DryRun) {
        Write-Info "Installing project dependencies with pnpm..."
        try {
            pnpm install
            Write-Success "Project dependencies installed"
            $installed++
        } catch {
            Write-Error "Failed to install project dependencies: $_"
            $failed++
        }
    } else {
        Write-Info "Would run: pnpm install"
        $skipped++
    }
} else {
    Write-Warning "No package.json found in current directory"
}

# 5. Install Playwright browsers
Write-Step "Checking Playwright browsers..."
if (-not $DryRun) {
    Write-Info "Installing Playwright browsers..."
    try {
        pnpm exec playwright install --with-deps
        Write-Success "Playwright browsers installed"
        $installed++
    } catch {
        Write-Warning "Failed to install Playwright browsers: $_"
        Write-Host "  You can install manually with: pnpm exec playwright install --with-deps" -ForegroundColor Gray
        $failed++
    }
} else {
    Write-Info "Would run: pnpm exec playwright install --with-deps"
    $skipped++
}

# 6. Verify npx availability for linting tools
Write-Step "Checking npx for on-demand linting tools..."
if (Test-Command "npx") {
    Write-Success "npx available (will use for markdownlint-cli2 and yaml-lint)"
    Write-Info "  Linting tools will be downloaded on first use via npx"
    $alreadyInstalled++
} else {
    Write-Warning "npx not found - ensure Node.js is installed"
    $failed++
}

# Optional tools (security scanning)
if (-not $SkipOptional) {
    # 8. Install TruffleHog (optional)
    Write-Step "Checking TruffleHog (optional)..."
    if (Test-Command "trufflehog") {
        Write-Success "TruffleHog already installed"
        $alreadyInstalled++
    } else {
        Write-Warning "TruffleHog not found (optional - for secret scanning)"
        if (-not $DryRun) {
            Write-Info "Installing TruffleHog using official installer..."
            try {
                # Download and run the official install script
                $installDir = "$env:LocalAppData\trufflehog"
                New-Item -ItemType Directory -Force -Path $installDir | Out-Null
                
                # Download latest release for Windows
                $latestRelease = (Invoke-RestMethod -Uri "https://api.github.com/repos/trufflesecurity/trufflehog/releases/latest").tag_name
                $version = $latestRelease -replace '^v', ''
                $downloadUrl = "https://github.com/trufflesecurity/trufflehog/releases/download/$latestRelease/trufflehog_${version}_windows_amd64.tar.gz"
                $tarFile = Join-Path $env:TEMP "trufflehog.tar.gz"
                
                Write-Info "Downloading TruffleHog $latestRelease..."
                Invoke-WebRequest -Uri $downloadUrl -OutFile $tarFile
                
                # Extract using tar (built into Windows 10+)
                Write-Info "Extracting..."
                tar -xzf $tarFile -C $installDir
                Remove-Item $tarFile
                
                # Add to PATH for current session
                $env:Path = "$installDir;$env:Path"
                
                # Add to user PATH permanently
                $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
                if ($userPath -notlike "*$installDir*") {
                    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
                }
                
                Write-Success "TruffleHog installed to $installDir"
                Write-Info "Added to PATH - restart terminal to use 'trufflehog' command"
                $installed++
            } catch {
                Write-Warning "Failed to install TruffleHog automatically: $_"
                Write-Host "  Manual installation options:" -ForegroundColor Gray
                Write-Host "    1. Download from: https://github.com/trufflesecurity/trufflehog/releases" -ForegroundColor Gray
                Write-Host "    2. Package manager: winget install trufflesecurity.trufflehog" -ForegroundColor Gray
                Write-Host "    3. Docker: docker run --rm -v `${PWD}:/scan trufflesecurity/trufflehog:latest git file:///scan" -ForegroundColor Gray
                $skipped++
            }
        } else {
            Write-Info "Would install: TruffleHog via official installer"
            $skipped++
        }
    }

    # 9. Check Trivy (optional)
    Write-Step "Checking Trivy (optional)..."
    if (Test-Command "trivy") {
        Write-Success "Trivy already installed"
        $alreadyInstalled++
    } else {
        Write-Warning "Trivy not found (optional - for security scanning)"
        Write-Host "  This tool must be installed manually:" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "  Option 1 - Manual Binary Installation (Recommended):" -ForegroundColor Yellow
        Write-Host "    1. Download: https://github.com/aquasecurity/trivy/releases" -ForegroundColor Gray
        Write-Host "    2. Extract trivy_*_Windows-64bit.zip" -ForegroundColor Gray
        Write-Host "    3. Move trivy.exe to a directory in your PATH" -ForegroundColor Gray
        Write-Host "       (e.g., C:\Program Files\Trivy\)" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "  Option 2 - Package Manager:" -ForegroundColor Yellow
        Write-Host "    winget: winget install Aquasecurity.Trivy" -ForegroundColor Gray
        Write-Host "    choco:  choco install trivy" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        Write-Host "  Option 3 - Docker (No installation needed):" -ForegroundColor Yellow
        Write-Host "    docker run --rm -v `${PWD}:/scan aquasec/trivy:latest fs /scan" -ForegroundColor Gray
        Write-Host "" -ForegroundColor Gray
        $skipped++
    }
} else {
    Write-Info "Skipping optional tools (TruffleHog, Trivy)"
}

# Summary
Write-Header "📊 Setup Summary"
Write-Host "Already installed: " -NoNewline
Write-Host $alreadyInstalled -ForegroundColor Green
Write-Host "Newly installed:   " -NoNewline
Write-Host $installed -ForegroundColor Green
Write-Host "Skipped:           " -NoNewline
Write-Host $skipped -ForegroundColor Yellow
Write-Host "Failed:            " -NoNewline
Write-Host $failed -ForegroundColor Red

if ($DryRun) {
    Write-Host "`nRun without -DryRun to perform actual installation" -ForegroundColor Cyan
}

if ($failed -eq 0) {
    Write-Host "`n✅ Setup completed successfully!" -ForegroundColor Green
    
    # Check if any tools were newly installed
    if ($installed -gt 0) {
        Write-Host "`n⚠️  IMPORTANT: Restart PowerShell to refresh PATH" -ForegroundColor Yellow
        Write-Host "   Some tools were newly installed and may not be in your PATH yet." -ForegroundColor Yellow
        Write-Host "   Close this terminal and open a new one before running validation." -ForegroundColor Yellow
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    if ($installed -gt 0) {
        Write-Host "  1. ⚠️  RESTART THIS TERMINAL (close and reopen PowerShell)" -ForegroundColor Yellow
        Write-Host "  2. Run 'pnpm dev' to start the development server" -ForegroundColor Gray
        Write-Host "  3. Run 'pnpm test' to run tests" -ForegroundColor Gray
        Write-Host "  4. Run '.\.github\scripts\local-ci.ps1' to test validation" -ForegroundColor Gray
        Write-Host "  5. Install git pre-push hook (see .github/hooks/README.md)" -ForegroundColor Gray
    } else {
        Write-Host "  1. Run 'pnpm dev' to start the development server" -ForegroundColor Gray
        Write-Host "  2. Run 'pnpm test' to run tests" -ForegroundColor Gray
        Write-Host "  3. Run '.\.github\scripts\local-ci.ps1' to test validation" -ForegroundColor Gray
        Write-Host "  4. Install git pre-push hook (see .github/hooks/README.md)" -ForegroundColor Gray
    }
    exit 0
} else {
    Write-Host "`n⚠️  Setup completed with $failed error(s)" -ForegroundColor Yellow
    Write-Host "Please address the errors above and run this script again" -ForegroundColor Gray
    exit 1
}
