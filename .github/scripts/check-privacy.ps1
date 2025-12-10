# Privacy check script - detects tracking, Google Fonts, external CDNs
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - No privacy issues found
#   1 - Privacy issues found (Google Fonts or tracking scripts)

$ErrorActionPreference = 'Stop'
$privacyIssues = 0

# Check for Google Fonts
$googleFonts = @()
# Check src and public directories
$googleFonts += Get-ChildItem -Path src,public -Recurse -Include "*.ts","*.tsx","*.js","*.jsx","*.css","*.html" -ErrorAction SilentlyContinue |
    Select-String -Pattern "fonts\.googleapis|fonts\.gstatic" -ErrorAction SilentlyContinue
# Check root index.html
if (Test-Path "index.html") {
    $googleFonts += Select-String -Path "index.html" -Pattern "fonts\.googleapis|fonts\.gstatic" -ErrorAction SilentlyContinue
}

if ($googleFonts) {
    Write-Host "❌ Google Fonts detected (privacy concern)" -ForegroundColor Red
    $googleFonts | ForEach-Object {
        Write-Host "    $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
    }
    Write-Host "  Consider using self-hosted fonts instead"
    $privacyIssues++
}

# Check for tracking scripts and analytics (exclude internal performance tracking)
$trackingPatterns = "google.*analytics|gtag|ga\(|googletagmanager|facebook.*pixel|fbq\(|analytics\.js|doubleclick|adservice|googlesyndication|advertising|adserver"
$trackingFound = @()
# Check src and public directories
$trackingFound += Get-ChildItem -Path src,public -Recurse -Include "*.ts","*.tsx","*.js","*.jsx","*.html" -ErrorAction SilentlyContinue |
    Select-String -Pattern $trackingPatterns -ErrorAction SilentlyContinue |
    Where-Object { $_.Line -notmatch "enablePerformanceTracking|performance.*tracking|tracking.*performance" }
# Check root index.html
if (Test-Path "index.html") {
    $trackingFound += Select-String -Path "index.html" -Pattern $trackingPatterns -ErrorAction SilentlyContinue |
        Where-Object { $_.Line -notmatch "enablePerformanceTracking|performance.*tracking|tracking.*performance" }
}

if ($trackingFound) {
    Write-Host "❌ Tracking/analytics scripts detected" -ForegroundColor Red
    $trackingFound | ForEach-Object {
        Write-Host "    $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
    }
    Write-Host "  Remove tracking scripts to protect user privacy"
    $privacyIssues++
}

# Check for external CDN resources that could track users
$cdnPatterns = "cdn\.jsdelivr|cdnjs\.cloudflare|unpkg\.com|cdn\.bootcdn|stackpath\.bootstrapcdn"
$cdnFound = @()
# Check src and public directories
$cdnFound += Get-ChildItem -Path src,public -Recurse -Include "*.ts","*.tsx","*.js","*.jsx","*.html","*.css" -ErrorAction SilentlyContinue |
    Select-String -Pattern $cdnPatterns -ErrorAction SilentlyContinue
# Check root index.html
if (Test-Path "index.html") {
    $cdnFound += Select-String -Path "index.html" -Pattern $cdnPatterns -ErrorAction SilentlyContinue
}

if ($cdnFound) {
    Write-Host "⚠️  External CDN resources detected (may have privacy implications)" -ForegroundColor Yellow
    $cdnFound | ForEach-Object {
        Write-Host "    $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
    }
    Write-Host "  Consider self-hosting resources for better privacy"
}

if ($privacyIssues -eq 0) {
    Write-Host "✅ No privacy concerns detected" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Privacy check failed with $privacyIssues issue(s)" -ForegroundColor Red
    exit 1
}

