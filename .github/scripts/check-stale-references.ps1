# Check for broken imports and missing file references
# Generic sanity checks that catch common mistakes in any codebase
#
# Exit codes:
#   0 - No issues found
#   1 - Issues found

$ErrorActionPreference = 'Stop'
$issues = 0

Write-Host "Checking for broken imports and missing files..." -ForegroundColor White

# 1. Check for broken TypeScript/JavaScript imports
Write-Host "  Checking for broken imports..." -ForegroundColor Gray
$sourceFiles = Get-ChildItem -Path src -Recurse -Include "*.ts","*.tsx","*.js","*.jsx" -ErrorAction SilentlyContinue
$brokenImports = @()

foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $fileDir = Split-Path -Parent $file.FullName
    $lines = Get-Content $file.FullName
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        # Skip comments
        if ($trimmed -match "^//|^/\*|^\s*\*") { continue }
        
        # Match import/from statements
        if ($trimmed -match "(?:import|from|require)\s+['""]([^'""]+)['""]") {
            $importPath = $matches[1]
            
            # Skip external packages (node_modules, npm packages)
            if ($importPath -match "^[^./]|^@[^/]") { continue }
            
            # Skip special imports (CSS, JSON, etc.)
            if ($importPath -match "\.(css|scss|json|svg|png|jpg|jpeg|gif|webp)$") { continue }
            
            # Resolve relative imports
            $resolvedPath = $null
            if ($importPath -match "^\.\.?/") {
                # Relative path
                $resolvedPath = Join-Path $fileDir $importPath
            } elseif ($importPath -match "^@/") {
                # Alias path (assumes @ maps to src/)
                $aliasPath = $importPath -replace "^@/", "src/"
                $resolvedPath = Join-Path (Get-Location) $aliasPath
            } else {
                # Absolute from project root
                $resolvedPath = Join-Path (Get-Location) $importPath
            }
            
            # Try common extensions
            $extensions = @("", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx")
            $found = $false
            foreach ($ext in $extensions) {
                $testPath = $resolvedPath + $ext
                if (Test-Path $testPath) {
                    $found = $true
                    break
                }
            }
            
            if (-not $found) {
                $brokenImports += @{
                    File = $file.FullName
                    Line = $lines.IndexOf($line) + 1
                    Import = $importPath
                }
            }
        }
    }
}

if ($brokenImports.Count -gt 0) {
    foreach ($broken in $brokenImports) {
        Write-Host "    ❌ Broken import: '$($broken.Import)' in $($broken.File):$($broken.Line)" -ForegroundColor Red
        $issues++
    }
}

# 2. Check for missing files referenced in CSS (fonts, images, etc.)
Write-Host "  Checking CSS file references..." -ForegroundColor Gray
$cssFiles = Get-ChildItem -Path src,public -Recurse -Include "*.css" -ErrorAction SilentlyContinue
foreach ($cssFile in $cssFiles) {
    $content = Get-Content $cssFile.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    $cssDir = Split-Path -Parent $cssFile.FullName
    
    # Match url() references
    $urlMatches = [regex]::Matches($content, "url\(['""]([^'""]+)['""]\)")
    foreach ($match in $urlMatches) {
        $urlPath = $match.Groups[1].Value
        
        # Skip external URLs and data URIs
        if ($urlPath -match "^https?://|^data:") { continue }
        
        # Resolve paths
        if ($urlPath -match "^/") {
            # Absolute path from public root (e.g., /fonts/fonts.css)
            $resolvedPath = Join-Path "public" $urlPath.TrimStart('/')
        } elseif ($urlPath -match "^\.\.?/") {
            # Relative path from CSS file location
            $resolvedPath = Join-Path $cssDir $urlPath
        } else {
            # Relative to CSS file directory
            $resolvedPath = Join-Path $cssDir $urlPath
        }
        
        # Normalize path separators
        $resolvedPath = $resolvedPath -replace '/', [System.IO.Path]::DirectorySeparatorChar
        
        if (-not (Test-Path $resolvedPath)) {
            Write-Host "    ❌ Missing file referenced in CSS: $urlPath (in $($cssFile.Name))" -ForegroundColor Red
            Write-Host "      Expected at: $resolvedPath" -ForegroundColor Gray
            $issues++
        }
    }
}

# 3. Check for missing asset files referenced via getAssetUrl or similar helpers
Write-Host "  Checking asset file references..." -ForegroundColor Gray
foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    # Match getAssetUrl() calls and similar patterns
    $assetPatterns = @(
        "getAssetUrl\(['""]([^'""]+)['""]\)",
        "['""](flags/[^'""]+)['""]",
        "['""](fonts/[^'""]+)['""]"
    )
    
    foreach ($pattern in $assetPatterns) {
        $matches = [regex]::Matches($content, $pattern)
        foreach ($match in $matches) {
            $assetPath = $match.Groups[1].Value
            
            # Skip external URLs
            if ($assetPath -match "^https?://") { continue }
            
            # Check if it's a public asset
            if ($assetPath -match "^flags/|^fonts/|^images/") {
                $fullPath = Join-Path "public" $assetPath
                if (-not (Test-Path $fullPath)) {
                    Write-Host "    ❌ Missing asset file: $assetPath (referenced in $($file.Name))" -ForegroundColor Red
                    $issues++
                }
            }
        }
    }
}

# 4. Check for missing files in import statements that reference non-existent paths
Write-Host "  Checking import paths..." -ForegroundColor Gray
# This is already covered in step 1, but we can add more specific checks here if needed

if ($issues -eq 0) {
    Write-Host "  ✅ No broken imports or missing files found" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n  Found $issues issue(s) - please fix before pushing" -ForegroundColor Red
    exit 1
}
