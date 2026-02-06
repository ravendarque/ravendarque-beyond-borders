<#
.SYNOPSIS
    Pre-push validation script - Run all CI validation checks locally

.DESCRIPTION
    Runs the same validation checks that CI runs, catching issues before push.
    
    This script automatically refreshes the environment PATH to detect newly
    installed tools. If tools are still not found, try restarting PowerShell
    or running the setup script: .\.github\scripts\setup-dev-env.ps1
    
.PARAMETER SkipBuild
    Skip build/test checks even if production code changed

.EXAMPLE
    .\local-ci.ps1
    Run all validation checks

.EXAMPLE
    .\local-ci.ps1 -SkipBuild
    Run only fast validation checks
#>

param(
    [switch]$SkipBuild
)

Write-Host "`n🔍 Running pre-push validation checks..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$script:Errors = 0
$script:Warnings = 0

function Print-Status {
    param([bool]$Success, [string]$Message)
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:Errors++
    }
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Refresh-EnvironmentPath {
    <#
    .SYNOPSIS
        Refreshes the PATH environment variable from registry
    .DESCRIPTION
        Updates the current session's PATH to include newly installed tools.
        Combines User and Machine PATH variables from registry.
    #>
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$userPath;$machinePath"
}

function Test-CommandExists {
    <#
    .SYNOPSIS
        Tests if a command exists, checking PATH and common installation locations
    .PARAMETER Command
        The command name to check
    .PARAMETER CommonPaths
        Optional array of common installation paths to check (supports wildcards)
    #>
    param(
        [string]$Command,
        [string[]]$CommonPaths = @()
    )
    
    # First try Get-Command
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        return $true
    }
    
    # Try common installation paths (expand wildcards)
    foreach ($pathPattern in $CommonPaths) {
        # Resolve wildcards in path
        $resolvedPaths = @()
        if ($pathPattern -match '\*') {
            # Get parent directory and pattern
            $parentDir = Split-Path $pathPattern -Parent
            $pattern = Split-Path $pathPattern -Leaf
            
            if (Test-Path $parentDir) {
                $resolvedPaths = Get-ChildItem -Path $parentDir -Directory -Filter $pattern -ErrorAction SilentlyContinue |
                    Select-Object -ExpandProperty FullName
            }
        } else {
            $resolvedPaths = @($pathPattern)
        }
        
        # Check each resolved path
        foreach ($path in $resolvedPaths) {
            if (-not (Test-Path $path)) { continue }
            
            $fullPath = Join-Path $path "$Command.exe"
            if (Test-Path $fullPath) {
                # Add to PATH for this session
                if ($env:Path -notlike "*$path*") {
                    $env:Path = "$env:Path;$path"
                }
                return $true
            }
        }
    }
    
    return $false
}

# Refresh PATH at start to pick up newly installed tools
Refresh-EnvironmentPath

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Detect production code changes first (used to decide whether to run build checks)
$stagedFiles = git diff --cached --name-only 2>&1
if (-not $stagedFiles) {
    $remoteBranch = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>&1
    if ($LASTEXITCODE -eq 0 -and $remoteBranch -and $remoteBranch -ne '') {
        $stagedFiles = git diff --name-only --diff-filter=ACM "$remoteBranch..HEAD" 2>&1
    }
}
$prodPattern = "^(src/|public/|index.html|vite.config.ts|tsconfig.json|package.json|pnpm-lock.yaml|playwright.config.ts|scripts/|.github/scripts/)"
$prodFilesChanged = $stagedFiles | Where-Object { $_ -match $prodPattern }

# 1-4: Run lint, format, build, tests FIRST (most common failures = fastest feedback)
if ($prodFilesChanged -and -not $SkipBuild) {
    Write-Host "1️⃣  Linting code..." -ForegroundColor White
    $exitCode = 0
    pnpm run lint 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Linting passed" } else { "Linting failed" })
    Write-Host ""

    Write-Host "2️⃣  Checking code format (Prettier)..." -ForegroundColor White
    $exitCode = 0
    pnpm run format:check 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Format check passed" } else { "Format check failed (run: pnpm run format)" })
    Write-Host ""

    Write-Host "3️⃣  Type checking and building..." -ForegroundColor White
    $exitCode = 0
    pnpm run build 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Build passed" } else { "Build failed" })
    Write-Host ""

    Write-Host "4️⃣  Running tests..." -ForegroundColor White
    $exitCode = 0
    pnpm test -- --run 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Tests passed" } else { "Tests failed" })
    Write-Host ""
} else {
    if ($SkipBuild) {
        Write-Host "1️⃣–4️⃣  Skipping build checks (--SkipBuild flag)" -ForegroundColor Yellow
    } else {
        Write-Host "1️⃣–4️⃣  No production code changes - skipping build checks" -ForegroundColor Green
    }
    Write-Host ""
}

# 5-12: Other checks (less common failures, run after lint/format/build/tests)
Write-Host "5️⃣  Running security audit..." -ForegroundColor White
$exitCode = 0
try {
    & pwsh -File "$scriptDir/check-security.ps1" 2>&1 | Out-Host
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
}
if ($exitCode -ne 0) {
    $script:Errors++
}
Write-Host ""

Write-Host "6️⃣  Linting Markdown files..." -ForegroundColor White
$exitCode = 0
try {
    & pwsh -File "$scriptDir/check-markdown.ps1" 2>&1 | Out-Host
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
}
if ($exitCode -ne 0) {
    $script:Errors++
}
Write-Host ""

Write-Host "7️⃣  Linting YAML files..." -ForegroundColor White
$exitCode = 0
try {
    & pwsh -File "$scriptDir/check-yaml.ps1" 2>&1 | Out-Host
    $exitCode = $LASTEXITCODE
} catch {
    $exitCode = 1
}
if ($exitCode -ne 0) {
    $script:Errors++
}
Write-Host ""

Write-Host "8️⃣  Checking for TODO/FIXME comments..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-todo-fixme.ps1" | Out-Host
} catch {
    # Non-blocking, continue
}
Write-Host ""

Write-Host "9️⃣  Validating file permissions..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-file-permissions.ps1"
    if ($LASTEXITCODE -ne 0) {
        $script:Errors++
    }
} catch {
    $script:Errors++
}
Write-Host ""

Write-Host "🔟 Checking for large files (>1MB)..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-large-files.ps1" | Out-Host
} catch {
    # Non-blocking, continue
}
Write-Host ""

Write-Host "1️⃣1️⃣  Checking for privacy concerns..." -ForegroundColor White
$privacyExit = 0
try {
    & pwsh -File "$scriptDir/check-privacy.ps1"
    $privacyExit = $LASTEXITCODE
} catch {
    $privacyExit = 1
}
if ($privacyExit -ne 0) {
    $script:Errors++
}
Write-Host ""

Write-Host "1️⃣2️⃣  Checking for stale references..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-stale-references.ps1"
    if ($LASTEXITCODE -ne 0) {
        $script:Errors++
    }
} catch {
    $script:Errors++
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($script:Errors -eq 0) {
    Write-Host "✅ All checks passed!" -ForegroundColor Green
    if ($script:Warnings -gt 0) {
        Write-Host "⚠️  $($script:Warnings) warning(s) (non-blocking)" -ForegroundColor Yellow
    }
    Write-Host "`nSafe to push! 🚀" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $($script:Errors) error(s) found" -ForegroundColor Red
    if ($script:Warnings -gt 0) {
        Write-Host "⚠️  $($script:Warnings) warning(s)" -ForegroundColor Yellow
    }
    Write-Host "`nPlease fix the errors before pushing." -ForegroundColor Red
    Write-Host "`nTo skip validation: git push --no-verify" -ForegroundColor Gray
    exit 1
}

