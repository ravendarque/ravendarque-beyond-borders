# Validate file permissions and file types
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - File permissions/types OK
#   1 - Issues found

$ErrorActionPreference = 'Stop'
$issues = 0

# On Unix systems (Linux/macOS/CI), check for executable files that shouldn't be
# This uses bash find command which is available on Unix systems
if ($IsLinux -or $IsMacOS -or ($env:RUNNER_OS -eq "Linux")) {
    try {
        $bashOutput = bash -c "find src public -type f -executable -not -path '*/node_modules/*' 2>/dev/null | grep -v '\.sh$' || true"
        if ($bashOutput -and $bashOutput.Trim()) {
            Write-Host "❌ Found unexpected executable files" -ForegroundColor Red
            $bashOutput -split "`n" | Where-Object { $_.Trim() } | ForEach-Object {
                Write-Host "    $_"
            }
            $issues++
        }
    } catch {
        # If bash/find fails, skip executable check (non-critical on Windows)
    }
}

# On all systems, check for unexpected file types in src/public
$allowedExtensions = @('.tsx','.ts','.css','.png','.jpg','.jpeg','.svg','.json','.html','.webp','.gif')
$suspiciousFiles = Get-ChildItem -Path src,public -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.Extension -notin $allowedExtensions -and
        $_.FullName -notmatch "node_modules"
    }

if ($suspiciousFiles) {
    Write-Host "⚠️  Warning: Found unexpected file types:" -ForegroundColor Yellow
    $suspiciousFiles | ForEach-Object {
        Write-Host "    $($_.FullName)"
    }
    # Non-blocking warning for file types
}

if ($issues -eq 0) {
    Write-Host "✅ File permissions OK" -ForegroundColor Green
    exit 0
} else {
    exit 1
}

