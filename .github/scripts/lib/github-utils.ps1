# Shared utility functions for GitHub operations
# Single Responsibility: GitHub API interactions

# Import configuration
. "$PSScriptRoot\config.ps1"

function Write-StatusMessage {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet("Info", "Success", "Warning", "Error")]
        [string]$Type = "Info"
    )
    
    $color = switch ($Type) {
        "Info" { "Cyan" }
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
    }
    
    $icon = switch ($Type) {
        "Info" { "ℹ️" }
        "Success" { "✅" }
        "Warning" { "⚠️" }
        "Error" { "❌" }
    }
    
    Write-Host "$icon $Message" -ForegroundColor $color
}

function Test-GitHubCLI {
    <#
    .SYNOPSIS
    Verifies GitHub CLI is installed and authenticated
    #>
    
    $ghVersion = gh --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-StatusMessage "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/" -Type Error
        return $false
    }
    
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-StatusMessage "GitHub CLI is not authenticated. Run 'gh auth login' first." -Type Error
        return $false
    }
    
    return $true
}

function Get-RepoLabels {
    <#
    .SYNOPSIS
    Gets list of available labels in the repository
    #>
    
    $config = Get-ProjectConfig
    $labels = gh label list --repo $config.Repo --json name --jq '.[].name' 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-StatusMessage "Failed to fetch repository labels" -Type Warning
        return @()
    }
    
    return $labels
}

function New-GitHubIssue {
    <#
    .SYNOPSIS
    Creates a new GitHub issue with retry logic for transient failures
    
    .PARAMETER Title
    Issue title
    
    .PARAMETER Body
    Issue body (markdown)
    
    .PARAMETER Labels
    Array of label names (validated against repo labels)
    
    .PARAMETER MaxRetries
    Maximum number of retry attempts for transient failures (default: 3)
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$Title,
        
        [Parameter(Mandatory=$true)]
        [string]$Body,
        
        [Parameter(Mandatory=$false)]
        [string[]]$Labels = @(),
        
        [Parameter(Mandatory=$false)]
        [int]$MaxRetries = 3
    )
    
    $config = Get-ProjectConfig
    
    # Validate labels if provided
    if ($Labels.Count -gt 0) {
        $availableLabels = Get-RepoLabels
        foreach ($label in $Labels) {
            if ($label -notin $availableLabels) {
                Write-StatusMessage "Label '$label' does not exist in repository" -Type Warning
                Write-StatusMessage "Available labels: $($availableLabels -join ', ')" -Type Info
                return $null
            }
        }
    }
    
    # Create temp file for body to avoid command-line escaping issues
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        # Write body to temp file with UTF-8 encoding (no BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($tempFile, $Body, $utf8NoBom)
        
        # Build gh command args
        $ghArgs = @(
            "issue", "create",
            "--title", $Title,
            "--body-file", $tempFile,
            "--repo", $config.Repo
        )
        
        if ($Labels.Count -gt 0) {
            foreach ($label in $Labels) {
                $ghArgs += "--label"
                $ghArgs += $label
            }
        }
        
        # Execute with retry logic for transient failures
        $attempt = 0
        $issueUrl = $null
        
        while ($attempt -lt $MaxRetries) {
            $attempt++
            
            if ($attempt -gt 1) {
                Write-StatusMessage "Retry attempt $attempt of $MaxRetries..." -Type Warning
                Start-Sleep -Seconds 2
            }
            
            $issueUrl = & gh @ghArgs 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                return $issueUrl
            }
            
            # Check if error is transient (network/API issues)
            $errorText = $issueUrl -join " "
            $isTransient = $errorText -match "(EOF|timeout|connection|network|502|503|504)"
            
            if (-not $isTransient) {
                # Not a transient error, fail immediately
                Write-StatusMessage "Failed to create issue" -Type Error
                Write-Host "Error: $issueUrl" -ForegroundColor Red
                return $null
            }
            
            if ($attempt -eq $MaxRetries) {
                Write-StatusMessage "Failed after $MaxRetries attempts" -Type Error
                Write-Host "Error: $issueUrl" -ForegroundColor Red
                return $null
            }
        }
        
        return $null
    } finally {
        # Clean up temp file
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
    }
}

function Add-IssueToProject {
    <#
    .SYNOPSIS
    Adds an issue to the project board
    
    .PARAMETER IssueUrl
    Full URL of the GitHub issue
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$IssueUrl
    )
    
    $config = Get-ProjectConfig
    
    $itemJson = gh project item-add $config.ProjectNumber --owner $config.Owner --url $IssueUrl --format json | ConvertFrom-Json
    
    if ($LASTEXITCODE -ne 0 -or -not $itemJson.id) {
        Write-StatusMessage "Failed to add item to project" -Type Error
        return $null
    }
    
    return $itemJson.id
}

function Set-ProjectItemField {
    <#
    .SYNOPSIS
    Updates a single-select field on a project item
    
    .PARAMETER ItemId
    Project item ID
    
    .PARAMETER FieldId
    Project field ID
    
    .PARAMETER OptionId
    Option ID for the field
    
    .PARAMETER FieldName
    Name of the field (for logging)
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$ItemId,
        
        [Parameter(Mandatory=$true)]
        [string]$FieldId,
        
        [Parameter(Mandatory=$true)]
        [string]$OptionId,
        
        [Parameter(Mandatory=$false)]
        [string]$FieldName = "Field"
    )
    
    $config = Get-ProjectConfig
    
    gh project item-edit `
        --project-id $config.ProjectId `
        --id $ItemId `
        --field-id $FieldId `
        --single-select-option-id $OptionId | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-StatusMessage "$FieldName updated successfully" -Type Success
        return $true
    } else {
        Write-StatusMessage "Failed to update $FieldName" -Type Warning
        return $false
    }
}

function Get-IssueFromUrl {
    <#
    .SYNOPSIS
    Extracts issue number from issue URL
    
    .PARAMETER IssueUrl
    Full GitHub issue URL
    #>
    
    param(
        [Parameter(Mandatory=$true)]
        [string]$IssueUrl
    )
    
    if ($IssueUrl -match '/issues/(\d+)') {
        return $matches[1]
    }
    
    return $null
}
