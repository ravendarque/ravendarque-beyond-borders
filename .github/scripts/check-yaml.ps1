# Lint YAML workflow files
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - YAML files are valid or no files to check
#   1 - YAML linting failed

# Get files to check (from git staged files for local, or from args for CI)
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Files = @()
)

$ErrorActionPreference = 'Stop'

# Handle case where files are passed as space-separated string
if ($Files.Count -eq 1 -and $Files[0] -match '\s') {
    $Files = $Files[0] -split '\s+' | Where-Object { $_ }
}

if ($Files.Count -eq 0) {
    # Get staged YAML workflow files (local validation)
    $Files = git diff --cached --name-only --diff-filter=ACM 2>&1 | 
        Where-Object { $_ -match '\.github/workflows/.*\.ya?ml$' }
}

if ($Files.Count -eq 0) {
    Write-Host "✅ No YAML files to check" -ForegroundColor Green
    exit 0
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Warning: npx not found - ensure Node.js is installed" -ForegroundColor Yellow
    Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
    exit 0  # Non-blocking warning
}

# Run yaml-lint on each file
$exitCode = 0
$hasErrors = $false
foreach ($file in $Files) {
    $output = npx yaml-lint $file 2>&1
    if ($LASTEXITCODE -ne 0) {
        if (-not $hasErrors) {
            Write-Host ""
            $hasErrors = $true
        }
        Write-Output $output
        $exitCode = 1
    }
}

if ($hasErrors) {
    Write-Host ""
    Write-Host "❌ YAML linting failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ YAML files are valid" -ForegroundColor Green
    exit 0
}

