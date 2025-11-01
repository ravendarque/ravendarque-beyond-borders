<#
.SYNOPSIS
    GitHub Helper - Error-resistant commands for common GitHub operations.

.DESCRIPTION
    This script provides simple, error-resistant commands for:
    - Creating issues
    - Updating issues
    - Listing issues
    - Creating PRs
    
    All commands work from any directory and handle errors gracefully.

.NOTES
    Usage Examples:
    
    # Create issue from body file
    .\github-helper.ps1 issue-create -Title "Fix bug" -BodyFile ".local/issue.md" -Priority P1 -Size M
    
    # Create issue with inline body
    .\github-helper.ps1 issue-create -Title "Fix bug" -Body "Description here" -Priority P1
    
    # Update issue status
    .\github-helper.ps1 issue-update -Number 90 -Status Done
    
    # List issues
    .\github-helper.ps1 issue-list -Status InProgress
    
    # Create PR from body file
    .\github-helper.ps1 pr-create -Title "Fix bug" -BodyFile ".local/pr.md" -Issue 90
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet(
        "issue-create",
        "issue-update", 
        "issue-list",
        "pr-create"
    )]
    [string]$Command,
    
    # Common parameters
    [Parameter(Mandatory=$false)]
    [string]$Title,
    
    [Parameter(Mandatory=$false)]
    [string]$Body,
    
    [Parameter(Mandatory=$false)]
    [string]$BodyFile,
    
    # Issue-specific parameters
    [Parameter(Mandatory=$false)]
    [ValidateSet("P0", "P1", "P2")]
    [string]$Priority,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("XS", "S", "M", "L", "XL")]
    [string]$Size,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("Backlog", "Ready", "InProgress", "InReview", "Done")]
    [string]$Status,
    
    [Parameter(Mandatory=$false)]
    [int]$Number,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Labels,
    
    [Parameter(Mandatory=$false)]
    [string]$State = "open",
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 20,
    
    # PR-specific parameters
    [Parameter(Mandatory=$false)]
    [string]$Base = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$Draft,
    
    [Parameter(Mandatory=$false)]
    [int]$Issue
)

# Find project root
$scriptDir = $PSScriptRoot
if (!$scriptDir) {
    $scriptDir = Get-Location
}

$projectRoot = $scriptDir
while ($projectRoot -and !(Test-Path (Join-Path $projectRoot ".git"))) {
    $projectRoot = Split-Path $projectRoot -Parent
}

if (!$projectRoot) {
    Write-Host "❌ Error: Could not find project root" -ForegroundColor Red
    exit 1
}

$scriptsDir = Join-Path $projectRoot ".github\scripts"

try {
    Push-Location $scriptsDir
    
    switch ($Command) {
        "issue-create" {
            if (!$Title) {
                Write-Host "❌ Error: -Title is required" -ForegroundColor Red
                exit 1
            }
            
            # Load body from file or use inline
            $bodyText = $Body
            if ($BodyFile) {
                $bodyPath = Join-Path $projectRoot $BodyFile
                if (!(Test-Path $bodyPath)) {
                    Write-Host "❌ Error: Body file not found: $bodyPath" -ForegroundColor Red
                    exit 1
                }
                $bodyText = Get-Content $bodyPath -Raw
            }
            
            if (!$bodyText) {
                Write-Host "❌ Error: Either -Body or -BodyFile is required" -ForegroundColor Red
                exit 1
            }
            
            # Build parameters
            $params = @{
                Title = $Title
                Body = $bodyText
            }
            
            if ($Priority) { $params.Priority = $Priority }
            if ($Size) { $params.Size = $Size }
            if ($Status) { $params.Status = $Status }
            if ($Labels) { $params.Labels = $Labels }
            
            # Execute
            & ".\commands\create-tracked-issue.ps1" @params
        }
        
        "issue-update" {
            if (!$Number) {
                Write-Host "❌ Error: -Number is required" -ForegroundColor Red
                exit 1
            }
            
            $params = @{ IssueNumber = $Number }
            if ($Status) { $params.Status = $Status }
            if ($Priority) { $params.Priority = $Priority }
            if ($Size) { $params.Size = $Size }
            
            if ($params.Count -eq 1) {
                Write-Host "❌ Error: At least one field to update is required (-Status, -Priority, or -Size)" -ForegroundColor Red
                exit 1
            }
            
            & ".\commands\update-issue.ps1" @params
        }
        
        "issue-list" {
            $params = @{
                State = $State
                Limit = $Limit
            }
            
            if ($Status) { $params.Status = $Status }
            if ($Priority) { $params.Priority = $Priority }
            if ($Size) { $params.Size = $Size }
            
            & ".\commands\list-issues.ps1" @params
        }
        
        "pr-create" {
            if (!$Title) {
                Write-Host "❌ Error: -Title is required" -ForegroundColor Red
                exit 1
            }
            
            # Load body from file or use inline
            $bodyText = $Body
            if ($BodyFile) {
                $bodyPath = Join-Path $projectRoot $BodyFile
                if (!(Test-Path $bodyPath)) {
                    Write-Host "❌ Error: Body file not found: $bodyPath" -ForegroundColor Red
                    exit 1
                }
                $bodyText = Get-Content $bodyPath -Raw
            }
            
            if (!$bodyText) {
                Write-Host "❌ Error: Either -Body or -BodyFile is required" -ForegroundColor Red
                exit 1
            }
            
            $params = @{
                Title = $Title
                Body = $bodyText
                Base = $Base
            }
            
            if ($Draft) { $params.Draft = $true }
            if ($Issue) { $params.IssueNumber = $Issue }
            
            & ".\commands\create-pr.ps1" @params
        }
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
