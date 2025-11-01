<#
.SYNOPSIS
    Pre-push validation script - Run all CI validation checks locally

.DESCRIPTION
    Runs the same validation checks that CI runs, catching issues before push.
    
.PARAMETER SkipBuild
    Skip build/test checks even if production code changed

.EXAMPLE
    .\validate-local.ps1
    Run all validation checks

.EXAMPLE
    .\validate-local.ps1 -SkipBuild
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

# 1. Check for secrets
Write-Host "1️⃣  Checking for secrets..." -ForegroundColor White
if (Get-Command trufflehog -ErrorAction SilentlyContinue) {
    $output = trufflehog git file://. --only-verified --fail 2>&1 | Out-String
    if ($output -match "🐷🔑") {
        Print-Status $false "Secret scanning failed - verified secrets found!"
    } else {
        Print-Status $true "No verified secrets found"
    }
} else {
    Print-Warning "trufflehog not installed - skipping secret scan"
    Write-Host "  Install: https://github.com/trufflesecurity/trufflehog" -ForegroundColor Gray
}
Write-Host ""

# 2. Security audit with trivy
Write-Host "2️⃣  Running security audit..." -ForegroundColor White
if (Get-Command trivy -ErrorAction SilentlyContinue) {
    $exitCode = 0
    trivy fs . --severity CRITICAL,HIGH --exit-code 1 --quiet 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "No critical/high vulnerabilities found" } else { "Security vulnerabilities found" })
} else {
    Print-Warning "trivy not installed - skipping security scan"
    Write-Host "  Install: https://aquasecurity.github.io/trivy/" -ForegroundColor Gray
}
Write-Host ""

# 3. Markdown linting
Write-Host "3️⃣  Linting Markdown files..." -ForegroundColor White
if (Get-Command markdownlint-cli2 -ErrorAction SilentlyContinue) {
    $mdFiles = Get-ChildItem -Recurse -Include *.md -Exclude node_modules,.local | Select-Object -ExpandProperty FullName
    if ($mdFiles) {
        $exitCode = 0
        & markdownlint-cli2 $mdFiles 2>&1 | Out-Null
        $exitCode = $LASTEXITCODE
        Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Markdown files are valid" } else { "Markdown linting failed" })
    } else {
        Print-Status $true "No markdown files to check"
    }
} else {
    Print-Warning "markdownlint-cli2 not installed - skipping markdown lint"
    Write-Host "  Install: npm install -g markdownlint-cli2" -ForegroundColor Gray
}
Write-Host ""

# 4. YAML linting
Write-Host "4️⃣  Linting YAML files..." -ForegroundColor White
if (Get-Command yamllint -ErrorAction SilentlyContinue) {
    $exitCode = 0
    yamllint -d "{extends: default, rules: {line-length: disable, comments: disable}}" .github/workflows/ 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "YAML files are valid" } else { "YAML linting failed" })
} else {
    Print-Warning "yamllint not installed - skipping YAML lint"
    Write-Host "  Install: pip install yamllint" -ForegroundColor Gray
}
Write-Host ""

# 5. Check for TODO/FIXME
Write-Host "5️⃣  Checking for TODO/FIXME comments..." -ForegroundColor White
$todoFiles = Get-ChildItem -Path src,public -Recurse -Include "*.ts","*.tsx","*.js","*.jsx" -ErrorAction SilentlyContinue |
    Select-String -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue |
    Select-Object -Unique Path
if ($todoFiles) {
    Print-Warning "Found TODO/FIXME comments in production code:"
    $todoFiles | ForEach-Object { Write-Host "    $($_.Path)" -ForegroundColor Gray }
    Write-Host "  Consider creating issues for these items" -ForegroundColor Gray
} else {
    Print-Status $true "No TODO/FIXME comments in production code"
}
Write-Host ""

# 6. Validate file permissions (Windows: check for unexpected file attributes)
Write-Host "6️⃣  Validating files..." -ForegroundColor White
$suspiciousFiles = Get-ChildItem src\,public\ -Recurse -File | Where-Object { 
    $_.Extension -notin @('.tsx','.ts','.css','.png','.jpg','.svg','.json','.html') 
}
if ($suspiciousFiles) {
    Print-Warning "Found unexpected file types:"
    $suspiciousFiles | ForEach-Object { Write-Host "    $($_.FullName)" -ForegroundColor Gray }
} else {
    Print-Status $true "File validation OK"
}
Write-Host ""

# 7. Check for large files
Write-Host "7️⃣  Checking for large files (>1MB)..." -ForegroundColor White
$largeFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Length -gt 1MB -and 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.git" -and
    $_.FullName -notmatch "\.local"
}
if ($largeFiles) {
    Print-Warning "Large files found:"
    $largeFiles | ForEach-Object { 
        $size = "{0:N2} MB" -f ($_.Length / 1MB)
        Write-Host "    $size - $($_.Name)" -ForegroundColor Gray
    }
} else {
    Print-Status $true "No large files found"
}
Write-Host ""

# 8. Check if production code changed and run build checks
Write-Host "8️⃣  Checking if production code changed..." -ForegroundColor White
$stagedFiles = git diff --cached --name-only 2>&1
$prodPattern = "^(src/|public/|index.html|vite.config.ts|tsconfig.json|package.json|pnpm-lock.yaml|playwright.config.ts|scripts/|.github/scripts/)"
$prodFilesChanged = $stagedFiles | Where-Object { $_ -match $prodPattern }

if ($prodFilesChanged -and -not $SkipBuild) {
    Write-Host "Production code changes detected. Running build checks...`n" -ForegroundColor Yellow
    
    # Lint
    Write-Host "  📝 Linting code..." -ForegroundColor White
    $exitCode = 0
    pnpm run lint 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Linting passed" } else { "Linting failed" })
    Write-Host ""
    
    # Build
    Write-Host "  🏗️  Type checking and building..." -ForegroundColor White
    $exitCode = 0
    pnpm run build 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Build passed" } else { "Build failed" })
    Write-Host ""
    
    # Tests
    Write-Host "  🧪 Running tests..." -ForegroundColor White
    $exitCode = 0
    pnpm test -- --run 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Tests passed" } else { "Tests failed" })
    Write-Host ""
} else {
    if ($SkipBuild) {
        Write-Host "Skipping build checks (--SkipBuild flag)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No production code changes - skipping build checks" -ForegroundColor Green
    }
    Write-Host ""
}

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
