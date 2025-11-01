<#
.SYNOPSIS
    Setup development environment for Beyond Borders
.DESCRIPTION
    Installs all tools and dependencies needed for:
    - Building and running the app
    - Running tests (unit, integration, e2e)
    - Pre-push validation (security, linting, etc.)
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

# 6. Install markdownlint-cli2 (npm global)
Write-Step "Checking markdownlint-cli2..."
if (Test-Command "markdownlint-cli2") {
    Write-Success "markdownlint-cli2 already installed"
    $alreadyInstalled++
} else {
    Write-Warning "markdownlint-cli2 not found"
    if (-not $DryRun) {
        Write-Info "Installing markdownlint-cli2..."
        try {
            npm install -g markdownlint-cli2
            Write-Success "markdownlint-cli2 installed"
            $installed++
        } catch {
            Write-Error "Failed to install markdownlint-cli2: $_"
            $failed++
        }
    } else {
        Write-Info "Would install: npm install -g markdownlint-cli2"
        $skipped++
    }
}

# 7. Check Python and yamllint
Write-Step "Checking Python and yamllint..."
if (Test-Command "python") {
    $pythonVersion = python --version
    Write-Success "Python already installed: $pythonVersion"
    $alreadyInstalled++
    
    # Check yamllint
    if (Test-Command "yamllint") {
        Write-Success "yamllint already installed"
        $alreadyInstalled++
    } else {
        Write-Warning "yamllint not found"
        if (-not $DryRun) {
            Write-Info "Installing yamllint..."
            try {
                python -m pip install yamllint
                Write-Success "yamllint installed"
                $installed++
            } catch {
                Write-Error "Failed to install yamllint: $_"
                $failed++
            }
        } else {
            Write-Info "Would install: pip install yamllint"
            $skipped++
        }
    }
} else {
    Write-Warning "Python not found"
    Write-Host "  Install from: https://www.python.org/downloads/" -ForegroundColor Gray
    Write-Host "  Or use a package manager:" -ForegroundColor Gray
    Write-Host "    winget install Python.Python.3.12" -ForegroundColor Gray
    Write-Host "    choco install python" -ForegroundColor Gray
    Write-Host "    scoop install python" -ForegroundColor Gray
    $failed++
}

# Optional tools (security scanning)
if (-not $SkipOptional) {
    # 8. Check/Install TruffleHog
    Write-Step "Checking TruffleHog (optional)..."
    if (Test-Command "trufflehog") {
        Write-Success "TruffleHog already installed"
        $alreadyInstalled++
    } else {
        Write-Warning "TruffleHog not found (optional - for secret scanning)"
        
        # Try to install with available package managers
        $packageMgr = Get-PackageManager
        $truffleInstalled = $false
        
        if (-not $DryRun) {
            if ($packageMgr -eq "winget") {
                Write-Info "Attempting to install TruffleHog via winget..."
                try {
                    winget install trufflesecurity.trufflehog --accept-source-agreements --accept-package-agreements
                    Write-Success "TruffleHog installed via winget"
                    $installed++
                    $truffleInstalled = $true
                } catch {
                    Write-Warning "winget installation failed: $_"
                }
            } elseif ($packageMgr -eq "scoop") {
                Write-Info "Attempting to install TruffleHog via Scoop..."
                try {
                    scoop install trufflehog
                    Write-Success "TruffleHog installed via Scoop"
                    $installed++
                    $truffleInstalled = $true
                } catch {
                    Write-Warning "Scoop installation failed: $_"
                }
            } elseif ($packageMgr -eq "choco") {
                Write-Info "Attempting to install TruffleHog via Chocolatey..."
                try {
                    choco install trufflehog -y
                    Write-Success "TruffleHog installed via Chocolatey"
                    $installed++
                    $truffleInstalled = $true
                } catch {
                    Write-Warning "Chocolatey installation failed: $_"
                }
            }
        } else {
            Write-Info "Would attempt to install TruffleHog via $packageMgr"
            $skipped++
        }
        
        if (-not $truffleInstalled -and -not $DryRun) {
            Write-Host "  Install manually:" -ForegroundColor Gray
            Write-Host "    Windows: https://github.com/trufflesecurity/trufflehog/releases" -ForegroundColor Gray
            Write-Host "    Download trufflehog_*_windows_amd64.zip and add to PATH" -ForegroundColor Gray
            Write-Host "  Or install package manager:" -ForegroundColor Gray
            Write-Host "    Scoop: scoop install trufflehog" -ForegroundColor Gray
            Write-Host "    Choco: choco install trufflehog" -ForegroundColor Gray
            Write-Host "  Or use Docker:" -ForegroundColor Gray
            Write-Host "    docker pull trufflesecurity/trufflehog:latest" -ForegroundColor Gray
            $skipped++
        }
    }

    # 9. Check/Install Trivy
    Write-Step "Checking Trivy (optional)..."
    if (Test-Command "trivy") {
        Write-Success "Trivy already installed"
        $alreadyInstalled++
    } else {
        Write-Warning "Trivy not found (optional - for security scanning)"
        
        # Try to install with available package managers
        $packageMgr = Get-PackageManager
        $trivyInstalled = $false
        
        if (-not $DryRun) {
            if ($packageMgr -eq "winget") {
                Write-Info "Attempting to install Trivy via winget..."
                try {
                    winget install Aquasecurity.Trivy --accept-source-agreements --accept-package-agreements
                    Write-Success "Trivy installed via winget"
                    $installed++
                    $trivyInstalled = $true
                } catch {
                    Write-Warning "winget installation failed: $_"
                }
            } elseif ($packageMgr -eq "scoop") {
                Write-Info "Attempting to install Trivy via Scoop..."
                try {
                    scoop install trivy
                    Write-Success "Trivy installed via Scoop"
                    $installed++
                    $trivyInstalled = $true
                } catch {
                    Write-Warning "Scoop installation failed: $_"
                }
            } elseif ($packageMgr -eq "choco") {
                Write-Info "Attempting to install Trivy via Chocolatey..."
                try {
                    choco install trivy -y
                    Write-Success "Trivy installed via Chocolatey"
                    $installed++
                    $trivyInstalled = $true
                } catch {
                    Write-Warning "Chocolatey installation failed: $_"
                }
            }
        } else {
            Write-Info "Would attempt to install Trivy via $packageMgr"
            $skipped++
        }
        
        if (-not $trivyInstalled -and -not $DryRun) {
            Write-Host "  Install manually:" -ForegroundColor Gray
            Write-Host "    Windows: https://aquasecurity.github.io/trivy/latest/getting-started/installation/" -ForegroundColor Gray
            Write-Host "    Download from releases and add to PATH" -ForegroundColor Gray
            Write-Host "  Or install package manager:" -ForegroundColor Gray
            Write-Host "    Scoop: scoop install trivy" -ForegroundColor Gray
            Write-Host "    Choco: choco install trivy" -ForegroundColor Gray
            $skipped++
        }
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
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Run 'pnpm dev' to start the development server" -ForegroundColor Gray
    Write-Host "  2. Run 'pnpm test' to run tests" -ForegroundColor Gray
    Write-Host "  3. Run '.\.github\scripts\validate-local.ps1' to test validation" -ForegroundColor Gray
    Write-Host "  4. Install git pre-push hook (see .github/hooks/README.md)" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "`n⚠️  Setup completed with $failed error(s)" -ForegroundColor Yellow
    Write-Host "Please address the errors above and run this script again" -ForegroundColor Gray
    exit 1
}
