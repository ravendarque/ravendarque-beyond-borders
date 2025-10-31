<#
.SYNOPSIS
    Create a GitHub Pull Request with proper formatting and validation.

.DESCRIPTION
    Creates a GitHub Pull Request using gh CLI with validation and proper formatting.
    Handles multi-line bodies, special characters, and provides helpful error messages.

.PARAMETER Title
    The title of the pull request (required).

.PARAMETER Body
    The body/description of the pull request. Can be multi-line markdown (required).

.PARAMETER Base
    The base branch to merge into. Defaults to 'main'.

.PARAMETER Draft
    Create as a draft pull request.

.PARAMETER IssueNumber
    Issue number to link to this PR (will add "Closes #N" automatically).

.EXAMPLE
    .\create-pr.ps1 -Title "Add feature X" -Body "Description here" -IssueNumber 42

.EXAMPLE
    .\create-pr.ps1 -Title "Fix bug" -Body "Multi-line`nDescription" -Base main -Draft
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    
    [Parameter(Mandatory=$true)]
    [string]$Body,
    
    [Parameter(Mandatory=$false)]
    [string]$Base = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$Draft,
    
    [Parameter(Mandatory=$false)]
    [int]$IssueNumber
)

# Import utilities
. "$PSScriptRoot\lib\config.ps1"
. "$PSScriptRoot\lib\github-utils.ps1"

# Verify gh CLI
if (-not (Test-GitHubCLI)) {
    exit 1
}

Write-StatusMessage "Creating Pull Request" -Type Info
Write-Host "Title: $Title" -ForegroundColor Cyan
Write-Host "Base: $Base" -ForegroundColor Cyan
if ($Draft) {
    Write-Host "Draft: Yes" -ForegroundColor Yellow
}

# Add issue reference if provided
$finalBody = $Body
if ($IssueNumber) {
    $finalBody += "`n`nCloses #$IssueNumber"
    Write-Host "Links to: Issue #$IssueNumber" -ForegroundColor Cyan
}

# Create a temporary file for the body to avoid command-line escaping issues
$tempFile = [System.IO.Path]::GetTempFileName()
try {
    # Write body to temp file with UTF-8 encoding (no BOM)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($tempFile, $finalBody, $utf8NoBom)
    
    Write-Host "`n"
    Write-StatusMessage "Creating PR..." -Type Info
    
    # Build gh command
    $ghArgs = @(
        "pr", "create",
        "--title", $Title,
        "--body-file", $tempFile,
        "--base", $Base
    )
    
    if ($Draft) {
        $ghArgs += "--draft"
    }
    
    # Execute gh command
    $output = & gh @ghArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n"
        Write-StatusMessage "Pull Request created successfully!" -Type Success
        
        # Extract PR URL from output
        $prUrl = $output | Where-Object { $_ -match "https://github.com" } | Select-Object -First 1
        if ($prUrl) {
            Write-Host "`nPR: $prUrl" -ForegroundColor Green
            
            # Extract PR number from URL
            if ($prUrl -match "#(\d+)") {
                $prNumber = $Matches[1]
                Write-Host "PR Number: #$prNumber" -ForegroundColor Cyan
            }
        }
        
        $config = Get-ProjectConfig
        Write-Host "Repository: https://github.com/$($config.Owner)/$($config.Repo)" -ForegroundColor Cyan
        
    } else {
        Write-StatusMessage "Failed to create PR" -Type Error
        Write-Host "Error: $output" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-StatusMessage "Error creating PR: $_" -Type Error
    exit 1
} finally {
    # Clean up temp file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}
