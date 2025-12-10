# Check for large files (>1MB)
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - No large files found (or warnings only)
#   1 - Always returns 0 (warnings only, non-blocking)

$ErrorActionPreference = 'Stop'

$largeFiles = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.Length -gt 1MB -and 
        $_.FullName -notmatch "node_modules" -and 
        $_.FullName -notmatch "\.git" -and
        $_.FullName -notmatch "\.local"
    }

if ($largeFiles) {
    Write-Host "⚠️  Warning: Large files found:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "    $sizeMB MB - $($_.Name)"
    }
    exit 0  # Non-blocking warning
} else {
    Write-Host "✅ No large files found" -ForegroundColor Green
    exit 0
}

