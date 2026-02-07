# Security audit with trivy
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - No critical/high vulnerabilities found
#   1 - Vulnerabilities found or trivy not available

$ErrorActionPreference = 'Stop'

# Check if trivy is available
$trivyPaths = @(
    "$env:LocalAppData\Microsoft\WinGet\Packages\Aquasecurity.Trivy*",
    "$env:ProgramData\chocolatey\bin",
    "$env:UserProfile\scoop\shims"
)

$trivyFound = $false
foreach ($pathPattern in $trivyPaths) {
    if ($pathPattern -match '\*') {
        $parentDir = Split-Path $pathPattern -Parent
        $pattern = Split-Path $pathPattern -Leaf
        if (Test-Path $parentDir) {
            $resolvedPaths = Get-ChildItem -Path $parentDir -Directory -Filter $pattern -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty FullName
            foreach ($path in $resolvedPaths) {
                $fullPath = Join-Path $path "trivy.exe"
                if (Test-Path $fullPath) {
                    if ($env:Path -notlike "*$path*") {
                        $env:Path = "$env:Path;$path"
                    }
                    $trivyFound = $true
                    break
                }
            }
        }
    } else {
        $fullPath = Join-Path $pathPattern "trivy.exe"
        if (Test-Path $fullPath) {
            if ($env:Path -notlike "*$pathPattern*") {
                $env:Path = "$env:Path;$pathPattern"
            }
            $trivyFound = $true
            break
        }
    }
    if ($trivyFound) { break }
}

# Also check if trivy is in PATH (works on Linux/macOS and Windows if installed via package manager)
if (-not $trivyFound) {
    if (Get-Command trivy -ErrorAction SilentlyContinue) {
        $trivyFound = $true
    }
}

# Check if we're in CI - if so, trivy must be available
$isCI = $env:GITHUB_ACTIONS -eq "true" -or $env:CI -eq "true"

if (-not $trivyFound) {
    if ($isCI) {
        Write-Host "❌ Error: trivy not found in CI - security scan required" -ForegroundColor Red
        Write-Host "  Ensure trivy is installed in the workflow before running this script" -ForegroundColor Yellow
        exit 1  # Fail in CI
    } else {
        Write-Host "⚠️  Warning: trivy not installed - skipping security scan" -ForegroundColor Yellow
        Write-Host "  Install: Run .\.github\scripts\setup-dev-env.ps1" -ForegroundColor Gray
        exit 0  # Non-blocking warning for local dev
    }
}

# Run trivy scan on lock file only (fast - scans dependencies, not entire filesystem)
# First run can be slow while Trivy downloads the vuln DB (~84 MiB); later runs use cache.
# --scanners vuln: only scan for package vulnerabilities (skip config/secret/license)
# --skip-db-update: skip DB updates in local dev (faster), allow in CI
# --timeout 5m: sufficient for lock file scan (much faster than full filesystem)
$exitCode = 0
if ($isCI) {
    $trivyOutput = trivy fs pnpm-lock.yaml --severity CRITICAL,HIGH --exit-code 1 --timeout 5m --scanners vuln 2>&1
} else {
    $trivyOutput = trivy fs pnpm-lock.yaml --severity CRITICAL,HIGH --exit-code 1 --timeout 5m --scanners vuln --skip-db-update 2>&1
}
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "✅ No critical/high vulnerabilities found" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Security vulnerabilities found" -ForegroundColor Red
    Write-Host $trivyOutput
    exit 1
}

