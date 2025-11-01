# Create and Track GitHub Issue (Refactored)
# 
# Single Responsibility: Orchestrate issue creation and project tracking
# Delegates actual GitHub operations to utility functions
#
# Usage: .\create-tracked-issue.ps1 -Title "Task title" -Body "Description" -Priority P1 -Size M

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
    [string]$Status = "Ready",
    
    [Parameter(Mandatory=$false)]
    [string[]]$Labels = @()
)

# Import utilities
. "$PSScriptRoot\..\lib\config.ps1"
. "$PSScriptRoot\..\lib\github-utils.ps1"

# Verify GitHub CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

Write-Host "`n" -NoNewline
Write-StatusMessage "Creating GitHub Issue" -Type Info
Write-StatusMessage "Title: $Title" -Type Info
Write-StatusMessage "Priority: $Priority | Size: $Size | Status: $Status" -Type Info

# Create issue
Write-Host "`n" -NoNewline
Write-StatusMessage "Creating issue..." -Type Info

$issueUrl = New-GitHubIssue -Title $Title -Body $Body -Labels $Labels

if (-not $issueUrl) {
    Write-StatusMessage "Failed to create issue" -Type Error
    exit 1
}

$issueNumber = Get-IssueFromUrl -IssueUrl $issueUrl
Write-StatusMessage "Issue #$issueNumber created: $issueUrl" -Type Success

# Add to project
Write-Host "`n" -NoNewline
Write-StatusMessage "Adding to project board..." -Type Info

$itemId = Add-IssueToProject -IssueUrl $issueUrl

if (-not $itemId) {
    Write-StatusMessage "Failed to add to project (issue still created)" -Type Error
    exit 1
}

Write-StatusMessage "Added to project (Item ID: $itemId)" -Type Success

# Update fields
Write-Host "`n" -NoNewline
Write-StatusMessage "Updating project fields..." -Type Info

$fieldIds = Get-FieldIds

# Set Status
$statusOptionId = Get-StatusOptionId -Status $Status
Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Status -OptionId $statusOptionId -FieldName "Status ($Status)" | Out-Null

# Set Priority
$priorityOptionId = Get-PriorityOptionId -Priority $Priority
Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Priority -OptionId $priorityOptionId -FieldName "Priority ($Priority)" | Out-Null

# Set Size
$sizeOptionId = Get-SizeOptionId -Size $Size
Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Size -OptionId $sizeOptionId -FieldName "Size ($Size)" | Out-Null

# Summary
$config = Get-ProjectConfig
Write-Host "`n" -NoNewline
Write-StatusMessage "Issue successfully created and tracked!" -Type Success
Write-Host "   Issue: #$issueNumber - $issueUrl" -ForegroundColor Cyan
Write-Host "   Status: $Status | Priority: $Priority | Size: $Size" -ForegroundColor Cyan
Write-Host "   Project: https://github.com/users/$($config.Owner)/projects/$($config.ProjectNumber)" -ForegroundColor Cyan
