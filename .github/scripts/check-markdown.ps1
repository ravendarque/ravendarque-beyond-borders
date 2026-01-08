# Lint Markdown files
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - Markdown files are valid or no files to check
#   1 - Markdown linting failed

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
    # Get staged markdown files (local validation)
    $Files = git diff --cached --name-only --diff-filter=ACM 2>&1 | 
        Where-Object { $_ -match '\.md$' -and $_ -notmatch 'node_modules' -and $_ -notmatch '\.local' }
    
    # If no staged files, check files in commits being pushed (pre-push hook context)
    if ($Files.Count -eq 0) {
        # Get current branch and remote tracking branch
        $currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
        $remoteBranch = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $remoteBranch -and $remoteBranch -ne '') {
            # Get markdown files in commits that haven't been pushed yet
            $Files = git diff --name-only --diff-filter=ACM "$remoteBranch..HEAD" 2>&1 | 
                Where-Object { $_ -match '\.md$' -and $_ -notmatch 'node_modules' -and $_ -notmatch '\.local' }
        }
    }
}

if ($Files.Count -eq 0) {
    Write-Host "✅ No markdown files to check" -ForegroundColor Green
    exit 0
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Warning: npx not found - ensure Node.js is installed" -ForegroundColor Yellow
    Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
    exit 0  # Non-blocking warning
}

# Run markdownlint
$exitCode = 0
$output = npx markdownlint-cli2 $Files 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Output $output
    Write-Host ""
    Write-Host "❌ Markdown linting failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Markdown files are valid" -ForegroundColor Green
    exit 0
}

