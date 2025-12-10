# Check for TODO/FIXME comments in production code
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - No TODO/FIXME found (or warnings only)
#   1 - Always returns 0 (warnings only, non-blocking)

$ErrorActionPreference = 'Stop'

$todoFiles = Get-ChildItem -Path src,public -Recurse -Include "*.ts","*.tsx","*.js","*.jsx" -ErrorAction SilentlyContinue |
    Select-String -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue |
    Select-Object -Unique Path

if ($todoFiles) {
    Write-Host "⚠️  Warning: Found TODO/FIXME comments in production code" -ForegroundColor Yellow
    $todoFiles | ForEach-Object {
        Write-Host "    $($_.Path)"
    }
    Write-Host "  Consider creating issues for these items"
    exit 0  # Non-blocking warning
} else {
    Write-Host "✅ No TODO/FIXME comments in production code" -ForegroundColor Green
    exit 0
}

