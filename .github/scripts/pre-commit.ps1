<#
.SYNOPSIS
    Pre-commit validation script - Fast checks on staged files

.DESCRIPTION
    Runs quick validation checks before commit to catch basic issues early.
    Only checks staged files for speed. Full validation runs in pre-push hook.

    This script automatically refreshes the environment PATH to detect newly
    installed tools. If tools are still not found, try restarting PowerShell.

.EXAMPLE
    .\pre-commit.ps1
    Run fast pre-commit checks

.NOTES
    For full validation (build, tests, etc.), see local-ci.ps1 (pre-push hook)
#>

Write-Host "`n🔍 Running pre-commit checks..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$script:Errors = 0

function Print-Status {
    param([bool]$Success, [string]$Message)
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:Errors++
    }
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

# Refresh PATH at start to pick up newly installed tools
Refresh-EnvironmentPath

# Get staged files only
$stagedFiles = git diff --cached --name-only --diff-filter=ACM 2>&1
if (-not $stagedFiles) {
    Write-Host "✅ No staged files to check" -ForegroundColor Green
    exit 0
}

# Filter for code files that ESLint is configured to handle (src/ only)
$codeFiles = $stagedFiles | Where-Object { $_ -match '^src/.*\.(ts|tsx|js|jsx)$' }

# Filter for all Prettier-supported files (for formatting)
$prettierFiles = $stagedFiles | Where-Object { $_ -match '\.(ts|tsx|js|jsx|md|yml|yaml|json)$' }

if (-not $prettierFiles) {
    Write-Host "✅ No lintable/formattable files staged - skipping checks" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Staged files to check:" -ForegroundColor White
$prettierFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
Write-Host ""

# 1. Lint staged code files only (ESLint)
if ($codeFiles) {
    Write-Host "1️⃣  Linting code files (ESLint)..." -ForegroundColor White
    $exitCode = 0
    # ESLint can handle multiple files - pass them all
    pnpm eslint $codeFiles 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Linting passed" } else { "Linting failed" })
    Write-Host ""
} else {
    Write-Host "1️⃣  No code files to lint - skipping ESLint" -ForegroundColor Gray
    Write-Host ""
}

# 2. Check format of all staged files (Prettier)
Write-Host "2️⃣  Checking file format (Prettier)..." -ForegroundColor White
$exitCode = 0
# Prettier can handle multiple files - pass them all
pnpm prettier --check $prettierFiles 2>&1 | Out-Null
$exitCode = $LASTEXITCODE
Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Format check passed" } else { "Format check failed (run: pnpm run format)" })
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Pre-commit Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($script:Errors -eq 0) {
    Write-Host "✅ All pre-commit checks passed!" -ForegroundColor Green
    Write-Host "`nProceeding with commit... ✨" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $($script:Errors) error(s) found" -ForegroundColor Red
    Write-Host "`nPlease fix the errors before committing." -ForegroundColor Red
    Write-Host "`nTo skip validation: git commit --no-verify" -ForegroundColor Gray
    exit 1
}
