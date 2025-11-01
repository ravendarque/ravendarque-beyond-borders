# Update GitHub Issue Fields
# 
# Single Responsibility: Update Status, Priority, or Size on existing issues
#
# Usage: 
#   .\update-issue.ps1 -IssueNumber 87 -Status InProgress
#   .\update-issue.ps1 -IssueNumber 87 -Priority P0 -Size L
#   .\update-issue.ps1 -IssueNumber 87 -Status Done -Priority P1

param(
    [Parameter(Mandatory=$true)]
    [int]$IssueNumber,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Backlog", "Ready", "InProgress", "InReview", "Done")]
    [string]$Status,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("P0", "P1", "P2")]
    [string]$Priority,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("XS", "S", "M", "L", "XL")]
    [string]$Size
)

# Import utilities
. "$PSScriptRoot\lib\config.ps1"
. "$PSScriptRoot\lib\github-utils.ps1"

# Verify at least one field to update
if (-not $Status -and -not $Priority -and -not $Size) {
    Write-StatusMessage "No fields specified to update. Use -Status, -Priority, or -Size" -Type Error
    Write-Host "`nUsage examples:" -ForegroundColor Yellow
    Write-Host "  .\update-issue.ps1 -IssueNumber 87 -Status InProgress"
    Write-Host "  .\update-issue.ps1 -IssueNumber 87 -Priority P0"
    Write-Host "  .\update-issue.ps1 -IssueNumber 87 -Status Done -Priority P1 -Size M"
    exit 1
}

# Verify GitHub CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

$config = Get-ProjectConfig

Write-Host "`n" -NoNewline
Write-StatusMessage "Updating Issue #$IssueNumber" -Type Info

# Get issue URL
$issueUrl = "https://github.com/$($config.Repo)/issues/$IssueNumber"

# Find project item ID
Write-StatusMessage "Finding issue in project..." -Type Info

$query = @"
{
  repository(owner: "$($config.Owner)", name: "$(($config.Repo).Split('/')[1])") {
    issue(number: $IssueNumber) {
      projectItems(first: 10) {
        nodes {
          id
          project {
            id
          }
        }
      }
    }
  }
}
"@

$result = gh api graphql -f query="$query" | ConvertFrom-Json

$itemId = $null
foreach ($item in $result.data.repository.issue.projectItems.nodes) {
    if ($item.project.id -eq $config.ProjectId) {
        $itemId = $item.id
        break
    }
}

if (-not $itemId) {
    Write-StatusMessage "Issue #$IssueNumber not found in project" -Type Error
    Write-StatusMessage "Make sure the issue is added to the project board first" -Type Warning
    exit 1
}

Write-StatusMessage "Found in project (Item ID: $itemId)" -Type Success

# Update fields
Write-Host "`n" -NoNewline
Write-StatusMessage "Updating fields..." -Type Info

$fieldIds = Get-FieldIds
$updatedFields = @()

# Update Status
if ($Status) {
    $statusOptionId = Get-StatusOptionId -Status $Status
    if (Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Status -OptionId $statusOptionId -FieldName "Status") {
        $updatedFields += "Status → $Status"
    }
}

# Update Priority
if ($Priority) {
    $priorityOptionId = Get-PriorityOptionId -Priority $Priority
    if (Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Priority -OptionId $priorityOptionId -FieldName "Priority") {
        $updatedFields += "Priority → $Priority"
    }
}

# Update Size
if ($Size) {
    $sizeOptionId = Get-SizeOptionId -Size $Size
    if (Set-ProjectItemField -ItemId $itemId -FieldId $fieldIds.Size -OptionId $sizeOptionId -FieldName "Size") {
        $updatedFields += "Size → $Size"
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-StatusMessage "Issue #$IssueNumber updated successfully!" -Type Success
Write-Host "   Issue: $issueUrl" -ForegroundColor Cyan
Write-Host "   Updated: $($updatedFields -join ', ')" -ForegroundColor Cyan
Write-Host "   Project: https://github.com/users/$($config.Owner)/projects/$($config.ProjectNumber)" -ForegroundColor Cyan
