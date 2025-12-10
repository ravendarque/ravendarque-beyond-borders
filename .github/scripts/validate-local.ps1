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

# 1. Security audit with trivy
Write-Host "1️⃣  Running security audit..." -ForegroundColor White
$trivyPaths = @(
    "$env:LocalAppData\Microsoft\WinGet\Packages\Aquasecurity.Trivy*\",
    "$env:ProgramData\chocolatey\bin",
    "$env:UserProfile\scoop\shims"
)
if (Test-CommandExists "trivy" -CommonPaths $trivyPaths) {
    $exitCode = 0
    trivy fs . --severity CRITICAL,HIGH --exit-code 1 --quiet 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "No critical/high vulnerabilities found" } else { "Security vulnerabilities found" })
} else {
    Print-Warning "trivy not installed - skipping security scan"
    Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
}
Write-Host ""

# 2. Markdown linting
Write-Host "2️⃣  Linting Markdown files..." -ForegroundColor White
if (Get-Command npx -ErrorAction SilentlyContinue) {
    # Get staged markdown files (matching CI behavior of checking changed files)
    $stagedMdFiles = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.md$' -and $_ -notmatch 'node_modules' -and $_ -notmatch '\.local' }
    if ($stagedMdFiles) {
        $exitCode = 0
        # Show output if there are errors, hide if successful
        $output = npx markdownlint-cli2 $stagedMdFiles 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            Write-Host ""
            Write-Output $output
            Write-Host ""
        }
        Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "Markdown files are valid" } else { "Markdown linting failed" })
    } else {
        Print-Status $true "No staged markdown files to check"
    }
} else {
    Print-Warning "npx not found - ensure Node.js is installed"
    Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
}
Write-Host ""

# 3. YAML linting
Write-Host "3️⃣  Linting YAML files..." -ForegroundColor White
if (Get-Command npx -ErrorAction SilentlyContinue) {
    # Get staged YAML workflow files (matching CI behavior)
    $stagedYamlFiles = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.github/workflows/.*\.ya?ml$' }
    if ($stagedYamlFiles) {
        $exitCode = 0
        $hasErrors = $false
        foreach ($file in $stagedYamlFiles) {
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
        }
        Print-Status ($exitCode -eq 0) $(if ($exitCode -eq 0) { "YAML files are valid" } else { "YAML linting failed" })
    } else {
        Print-Status $true "No staged YAML files to check"
    }
} else {
    Print-Warning "npx not found - ensure Node.js is installed"
    Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
}
Write-Host ""

# 4. Check for TODO/FIXME
Write-Host "4️⃣  Checking for TODO/FIXME comments..." -ForegroundColor White
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
    & pwsh -File "$scriptDir/check-todo-fixme.ps1" | Out-Host
} catch {
    # Non-blocking, continue
}
Write-Host ""

# 5. Validate file permissions
Write-Host "5️⃣  Validating file permissions..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-file-permissions.ps1"
    if ($LASTEXITCODE -ne 0) {
        $script:Errors++
    }
} catch {
    $script:Errors++
}
Write-Host ""

# 6. Check for large files
Write-Host "6️⃣  Checking for large files (>1MB)..." -ForegroundColor White
try {
    & pwsh -File "$scriptDir/check-large-files.ps1" | Out-Host
} catch {
    # Non-blocking, continue
}
Write-Host ""

# 7. Privacy check - detect tracking, Google Fonts, etc.
Write-Host "7️⃣  Checking for privacy concerns..." -ForegroundColor White
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
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
