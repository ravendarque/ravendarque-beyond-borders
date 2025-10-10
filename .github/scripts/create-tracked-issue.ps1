# Create and Track GitHub Issue
# 
# This script creates a new issue and automatically adds it to the GitHub Project board
# with appropriate field values (Status, Priority, Size)
#
# Usage: .\create-tracked-issue.ps1 -Title "Task title" -Body "Description" -Priority P1 -Size S

param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    
    [Parameter(Mandatory=$true)]
    [string]$Body,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("P0", "P1", "P2")]
    [string]$Priority = "P1",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("XS", "S", "M", "L", "XL")]
    [string]$Size = "M",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Backlog", "Ready", "InProgress", "InReview", "Done")]
    [string]$Status = "InProgress",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Labels = @()
)

# Load configuration
$configPath = Join-Path $PSScriptRoot "..\project-config.yaml"
Write-Host "Loading configuration from $configPath..." -ForegroundColor Cyan

# Project configuration (from project-config.yaml)
$projectNumber = 2
$owner = "ravendarque"
$repo = "ravendarque/ravendarque-beyond-borders"
$projectId = "PVT_kwHOANLCeM4BFNzU"

# Field IDs (from project-fields.json)
$statusFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2njwY"
$priorityFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2nkBA"
$sizeFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2nkBE"

# Status option IDs
$statusOptions = @{
    "Backlog" = "f75ad846"
    "Ready" = "61e4505c"
    "InProgress" = "47fc9ee4"
    "InReview" = "df73e18b"
    "Done" = "98236657"
}

# Priority option IDs
$priorityOptions = @{
    "P0" = "79628723"
    "P1" = "0a877460"
    "P2" = "da944a9c"
}

# Size option IDs
$sizeOptions = @{
    "XS" = "6c6483d2"
    "S" = "f784b110"
    "M" = "7515a9f1"
    "L" = "817d0097"
    "XL" = "db339eb2"
}

Write-Host "`n📝 Creating issue..." -ForegroundColor Cyan

# Build the gh command
$ghCmd = "gh issue create --title `"$Title`" --body `"$Body`" --repo $repo"
if ($Labels.Count -gt 0) {
    $labelArgs = $Labels -join ","
    $ghCmd += " --label $labelArgs"
}

# Create the issue
$issueUrl = Invoke-Expression $ghCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create issue" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Issue created: $issueUrl" -ForegroundColor Green

# Add to project
Write-Host "`n📌 Adding to project board..." -ForegroundColor Cyan
$itemJson = gh project item-add $projectNumber --owner $owner --url $issueUrl --format json | ConvertFrom-Json
$itemId = $itemJson.id

if (-not $itemId) {
    Write-Host "❌ Failed to add item to project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Added to project (Item ID: $itemId)" -ForegroundColor Green

# Update Status
Write-Host "`n🔄 Setting Status to '$Status'..." -ForegroundColor Cyan
$statusOptionId = $statusOptions[$Status]
gh project item-edit --project-id $projectId --id $itemId --field-id $statusFieldId --single-select-option-id $statusOptionId | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Status set to $Status" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to set Status" -ForegroundColor Yellow
}

# Update Priority
Write-Host "🎯 Setting Priority to '$Priority'..." -ForegroundColor Cyan
$priorityOptionId = $priorityOptions[$Priority]
gh project item-edit --project-id $projectId --id $itemId --field-id $priorityFieldId --single-select-option-id $priorityOptionId | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Priority set to $Priority" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to set Priority" -ForegroundColor Yellow
}

# Update Size
Write-Host "📏 Setting Size to '$Size'..." -ForegroundColor Cyan
$sizeOptionId = $sizeOptions[$Size]
gh project item-edit --project-id $projectId --id $itemId --field-id $sizeFieldId --single-select-option-id $sizeOptionId | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Size set to $Size" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to set Size" -ForegroundColor Yellow
}

Write-Host "`n✨ Issue successfully created and tracked!" -ForegroundColor Green
Write-Host "   URL: $issueUrl" -ForegroundColor Cyan
Write-Host "   Status: $Status | Priority: $Priority | Size: $Size" -ForegroundColor Cyan
Write-Host "   View project: https://github.com/users/$owner/projects/$projectNumber" -ForegroundColor Cyan
