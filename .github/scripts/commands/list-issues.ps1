# List GitHub Issues with Project Field Values
# 
# Single Responsibility: Query and display issues with their project fields
#
# Usage: 
#   .\list-issues.ps1                    # List all open issues
#   .\list-issues.ps1 -Status InProgress # Filter by status
#   .\list-issues.ps1 -Priority P0       # Filter by priority
#   .\list-issues.ps1 -State all         # Include closed issues

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("open", "closed", "all")]
    [string]$State = "open",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Backlog", "Ready", "InProgress", "InReview", "Done")]
    [string]$Status,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("P0", "P1", "P2")]
    [string]$Priority,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("XS", "S", "M", "L", "XL")]
    [string]$Size,
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 20
)

# Import utilities
. "$PSScriptRoot\..\lib\config.ps1"
. "$PSScriptRoot\..\lib\github-utils.ps1"

# Verify GitHub CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

$config = Get-ProjectConfig

Write-Host "`n" -NoNewline
Write-StatusMessage "Fetching Issues" -Type Info

# Build filter string
$filters = @()
if ($Status) { $filters += "Status: $Status" }
if ($Priority) { $filters += "Priority: $Priority" }
if ($Size) { $filters += "Size: $Size" }

if ($filters.Count -gt 0) {
    Write-StatusMessage "Filters: $($filters -join ', ')" -Type Info
}

# Get issues
$issues = gh issue list --repo $config.Repo --state $State --limit $Limit --json number,title,state,url | ConvertFrom-Json

if ($issues.Count -eq 0) {
    Write-StatusMessage "No issues found" -Type Warning
    exit 0
}

# Get project field values for each issue
$issuesWithFields = @()

foreach ($issue in $issues) {
    $query = @"
{
  repository(owner: "$($config.Owner)", name: "$(($config.Repo).Split('/')[1])") {
    issue(number: $($issue.number)) {
      projectItems(first: 1) {
        nodes {
          project {
            id
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
"@

    $result = gh api graphql -f query="$query" | ConvertFrom-Json
    
    $projectFields = @{
        Status = ""
        Priority = ""
        Size = ""
    }
    
    if ($result.data.repository.issue.projectItems.nodes.Count -gt 0) {
        $projectItem = $result.data.repository.issue.projectItems.nodes[0]
        
        # Check if this is our project
        if ($projectItem.project.id -eq $config.ProjectId) {
            foreach ($fieldValue in $projectItem.fieldValues.nodes) {
                if ($fieldValue.field.name) {
                    $projectFields[$fieldValue.field.name] = $fieldValue.name
                }
            }
        }
    }
    
    # Apply filters (normalize status for comparison - GitHub uses "In progress" but param is "InProgress")
    $include = $true
    if ($Status) {
        $normalizedParamStatus = $Status -replace "InProgress", "In progress" -replace "InReview", "In review"
        if ($projectFields.Status -ne $normalizedParamStatus) { $include = $false }
    }
    if ($Priority -and $projectFields.Priority -ne $Priority) { $include = $false }
    if ($Size -and $projectFields.Size -ne $Size) { $include = $false }
    
    if ($include) {
        $issuesWithFields += [PSCustomObject]@{
            Number = $issue.number
            Title = $issue.title
            State = $issue.state
            Status = $projectFields.Status
            Priority = $projectFields.Priority
            Size = $projectFields.Size
            Url = $issue.url
        }
    }
}

# Display results
Write-Host "`n"
Write-StatusMessage "Found $($issuesWithFields.Count) issue(s)" -Type Success
Write-Host "`n"

$issuesWithFields | Format-Table -Property @(
    @{Label="Issue"; Expression={"#$($_.Number)"}; Width=8},
    @{Label="Title"; Expression={$_.Title}; Width=50},
    @{Label="Status"; Expression={$_.Status}; Width=12},
    @{Label="Priority"; Expression={$_.Priority}; Width=9},
    @{Label="Size"; Expression={$_.Size}; Width=6},
    @{Label="State"; Expression={$_.State}; Width=8}
) -AutoSize

Write-Host "`nProject: https://github.com/users/$($config.Owner)/projects/$($config.ProjectNumber)" -ForegroundColor Cyan
