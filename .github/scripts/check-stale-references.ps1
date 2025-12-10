# Check for stale references and missing files
# Can be called from local validation scripts or CI workflows
#
# Exit codes:
#   0 - No issues found
#   1 - Issues found

$ErrorActionPreference = 'Stop'
$issues = 0

Write-Host "Checking for stale references and missing files..." -ForegroundColor White

# 1. Check for missing font files referenced in CSS
Write-Host "  Checking font file references..." -ForegroundColor Gray
$fontCssFile = "public/fonts/fonts.css"
if (Test-Path $fontCssFile) {
    $fontCss = Get-Content $fontCssFile -Raw
    $fontDir = "public/fonts"
    
    # Extract font file references from CSS (url('./filename.ttf'))
    $fontMatches = [regex]::Matches($fontCss, "url\(['""]\./([^'""]+)['""]\)")
    foreach ($match in $fontMatches) {
        $fontFile = $match.Groups[1].Value
        $fontPath = Join-Path $fontDir $fontFile
        if (-not (Test-Path $fontPath)) {
            Write-Host "    ❌ Missing font file: $fontPath (referenced in fonts.css)" -ForegroundColor Red
            $issues++
        }
    }
}

# 2. Check for stale MUI imports in source files
Write-Host "  Checking for stale MUI imports..." -ForegroundColor Gray
$sourceFiles = Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue
foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        # Check for actual imports (not just comments)
        if ($content -match "(?:import|from|require).*['""]@mui|['""]@emotion") {
            Write-Host "    ❌ Stale MUI import found: $($file.FullName)" -ForegroundColor Red
            $issues++
        }
    }
}

# 3. Check for references to deleted theme.ts
Write-Host "  Checking for theme.ts references..." -ForegroundColor Gray
foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        # Check for imports of theme.ts
        if ($content -match "(?:import|from).*['""][^'""]*theme['""]") {
            # Make sure it's not just a comment
            $lines = Get-Content $file.FullName
            foreach ($line in $lines) {
                $trimmed = $line.Trim()
                if ($trimmed -match "(?:import|from).*['""][^'""]*theme['""]" -and $trimmed -notmatch "^//|^/\*|^\s*\*") {
                    Write-Host "    ❌ Reference to deleted theme.ts: $($file.FullName):$($lines.IndexOf($line) + 1)" -ForegroundColor Red
                    $issues++
                    break
                }
            }
        }
    }
}

# 4. Check for old schema fields in test files
Write-Host "  Checking for old schema fields in tests..." -ForegroundColor Gray
$testFiles = Get-ChildItem -Path test -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue
# Old schema fields - be careful with regex to avoid false positives
$oldSchemaPatterns = @(
    @{ pattern = "sources:\s*\{"; name = "sources" },
    @{ pattern = "status:\s*['""]"; name = "status (schema)" },
    @{ pattern = "pattern:\s*\{"; name = "pattern" },
    @{ pattern = "layouts\["; name = "layouts" },
    @{ pattern = "recommended:\s*\{"; name = "recommended" },
    @{ pattern = "focalPoint"; name = "focalPoint" }
)
foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($fieldPattern in $oldSchemaPatterns) {
            # Check if it's used in actual code (not just comments)
            $lines = Get-Content $file.FullName
            foreach ($line in $lines) {
                $trimmed = $line.Trim()
                # Skip comments and HTTP status checks
                if ($trimmed -notmatch "^//|^/\*|^\s*\*" -and 
                    $trimmed -notmatch "\.status\s*=|status:\s*\d|r\.status" -and
                    $trimmed -match $fieldPattern.pattern) {
                    Write-Host "    ⚠️  Old schema field '$($fieldPattern.name)' found in: $($file.FullName):$($lines.IndexOf($line) + 1)" -ForegroundColor Yellow
                    # Warning only, not blocking
                    break
                }
            }
        }
    }
}

# 5. Check for missing asset files referenced in code
Write-Host "  Checking for missing asset references..." -ForegroundColor Gray
# This is a basic check - could be expanded
$assetPatterns = @(
    "getAssetUrl\(['""]([^'""]+)['""]\)",
    "url\(['""]([^'""]+)['""]\)"
)
foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        foreach ($pattern in $assetPatterns) {
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                $assetPath = $match.Groups[1].Value
                # Skip external URLs
                if ($assetPath -match "^https?://") { continue }
                # Skip data URIs
                if ($assetPath -match "^data:") { continue }
                
                # Check if it's a public asset
                if ($assetPath -match "^flags/|^fonts/") {
                    $fullPath = Join-Path "public" $assetPath
                    if (-not (Test-Path $fullPath)) {
                        Write-Host "    ❌ Missing asset file: $fullPath (referenced in $($file.Name))" -ForegroundColor Red
                        $issues++
                    }
                }
            }
        }
    }
}

if ($issues -eq 0) {
    Write-Host "  ✅ No stale references or missing files found" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n  Found $issues issue(s) - please fix before pushing" -ForegroundColor Red
    exit 1
}

