# Check for large files (>1MB)
# Can be called from local validation scripts or CI workflows
# Only checks files that are tracked or would be tracked (honors .gitignore)
#
# Exit codes:
#   0 - No large files found (or warnings only)
#   1 - Always returns 0 (warnings only, non-blocking)

$ErrorActionPreference = 'Stop'

# Get files that git tracks (this automatically honors .gitignore)
$gitTrackedFiles = git ls-files 2>&1 | Where-Object { $_ -and $_ -notmatch '^fatal:' }

if (-not $gitTrackedFiles) {
    Write-Host "✅ No tracked files to check" -ForegroundColor Green
    exit 0
}

# Check each tracked file for size
$largeFiles = @()
foreach ($filePath in $gitTrackedFiles) {
    if (Test-Path $filePath) {
        $file = Get-Item $filePath -ErrorAction SilentlyContinue
        if ($file -and $file.Length -gt 1MB) {
            $largeFiles += $file
        }
    }
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

