<#
.SYNOPSIS
    Sync GitHub labels with project standards defined in .github/LABELS.md

.DESCRIPTION
    Creates, updates, or removes labels to match the project's label system.
    Ensures consistent labeling across the repository.

.PARAMETER DryRun
    Preview changes without applying them.

.PARAMETER Force
    Remove labels not in the standard set (use carefully).

.EXAMPLE
    .\sync-labels.ps1 -DryRun
    Preview label changes

.EXAMPLE
    .\sync-labels.ps1
    Apply label changes
#>

param(
    [switch]$DryRun,
    [switch]$Force
)

# Define standard labels
$labels = @(
    # Type labels (keep existing colors)
    @{ name = "bug"; description = "Something isn't working"; color = "d73a4a" }
    @{ name = "enhancement"; description = "New feature or request"; color = "a2eeef" }
    @{ name = "refactor"; description = "Code refactoring (no functional changes)"; color = "fbca04" }
    @{ name = "hotfix"; description = "Critical urgent fix"; color = "b60205" }
    @{ name = "chore"; description = "Maintenance tasks (dependencies, CI/CD, etc.)"; color = "fef2c0" }
    
    # Area labels
    @{ name = "ui"; description = "User interface and components"; color = "1d76db" }
    @{ name = "rendering"; description = "Canvas rendering and image processing"; color = "5319e7" }
    @{ name = "flags"; description = "Flag data and management"; color = "0e8a16" }
    @{ name = "accessibility"; description = "WCAG compliance, a11y improvements"; color = "006b75" }
    @{ name = "mobile"; description = "Mobile-specific issues"; color = "ff6f00" }
    @{ name = "scripts"; description = "GitHub automation scripts"; color = "c5def5" }
    @{ name = "testing"; description = "Tests (unit, integration, e2e)"; color = "d4c5f9" }
    @{ name = "ci-cd"; description = "CI/CD workflows and automation"; color = "ededed" }
    @{ name = "documentation"; description = "Documentation improvements"; color = "0075ca" }
    
    # Priority labels
    @{ name = "priority: critical"; description = "P0 - Security issues, breaking bugs"; color = "b60205" }
    @{ name = "priority: high"; description = "P1 - Important features, UX issues"; color = "d93f0b" }
    @{ name = "priority: normal"; description = "P2 - Nice-to-have features"; color = "0e8a16" }
    
    # Size labels
    @{ name = "size: xs"; description = "< 1 hour"; color = "c2e0c6" }
    @{ name = "size: s"; description = "1-2 hours"; color = "bfdadc" }
    @{ name = "size: m"; description = "2-4 hours"; color = "fef2c0" }
    @{ name = "size: l"; description = "4-8 hours"; color = "fbca04" }
    @{ name = "size: xl"; description = "8+ hours"; color = "d93f0b" }
    
    # Status labels (keep existing)
    @{ name = "good first issue"; description = "Good for newcomers"; color = "7057ff" }
    @{ name = "help wanted"; description = "Extra attention is needed"; color = "008672" }
    @{ name = "blocked"; description = "Blocked by another issue or PR"; color = "e99695" }
    @{ name = "wontfix"; description = "This will not be worked on"; color = "ffffff" }
    @{ name = "duplicate"; description = "This issue or pull request already exists"; color = "cfd3d7" }
)

# Labels to remove (not project-relevant)
$labelsToRemove = @("invalid", "question", "javascript", "dependencies")

Write-Host "`n🏷️  GitHub Label Sync" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made`n" -ForegroundColor Yellow
}

# Get current labels
Write-Host "📋 Fetching current labels..." -ForegroundColor Gray
$currentLabels = gh label list --limit 100 --json name,description,color | ConvertFrom-Json

Write-Host "✓ Found $($currentLabels.Count) existing labels`n" -ForegroundColor Green

# Track changes
$created = 0
$updated = 0
$removed = 0
$skipped = 0

# Create or update labels
foreach ($label in $labels) {
    $existing = $currentLabels | Where-Object { $_.name -eq $label.name }
    
    if ($existing) {
        # Check if update needed
        $needsUpdate = $false
        $changes = @()
        
        if ($existing.description -ne $label.description) {
            $needsUpdate = $true
            $changes += "description"
        }
        if ($existing.color -ne $label.color) {
            $needsUpdate = $true
            $changes += "color"
        }
        
        if ($needsUpdate) {
            Write-Host "🔄 Updating: " -NoNewline -ForegroundColor Yellow
            Write-Host "$($label.name) " -NoNewline -ForegroundColor White
            Write-Host "($($changes -join ', '))" -ForegroundColor Gray
            
            if (-not $DryRun) {
                gh label edit $label.name --description $label.description --color $label.color 2>&1 | Out-Null
            }
            $updated++
        } else {
            $skipped++
        }
    } else {
        Write-Host "✨ Creating: " -NoNewline -ForegroundColor Green
        Write-Host "$($label.name)" -ForegroundColor White
        
        if (-not $DryRun) {
            gh label create $label.name --description $label.description --color $label.color 2>&1 | Out-Null
        }
        $created++
    }
}

# Remove obsolete labels
if ($Force) {
    Write-Host ""
    foreach ($labelName in $labelsToRemove) {
        $exists = $currentLabels | Where-Object { $_.name -eq $labelName }
        if ($exists) {
            Write-Host "🗑️  Removing: " -NoNewline -ForegroundColor Red
            Write-Host "$labelName" -ForegroundColor White
            
            if (-not $DryRun) {
                gh label delete $labelName --yes 2>&1 | Out-Null
            }
            $removed++
        }
    }
}

# Summary
Write-Host "`n📊 Summary" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "Created:  $created" -ForegroundColor Green
Write-Host "Updated:  $updated" -ForegroundColor Yellow
Write-Host "Removed:  $removed" -ForegroundColor Red
Write-Host "Skipped:  $skipped" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n💡 Run without -DryRun to apply changes" -ForegroundColor Yellow
}

if ($removed -eq 0 -and $labelsToRemove.Count -gt 0 -and -not $Force) {
    Write-Host "`n⚠️  Use -Force to remove obsolete labels:" -ForegroundColor Yellow
    Write-Host "   $($labelsToRemove -join ', ')" -ForegroundColor Gray
}

Write-Host ""
