<#
.SYNOPSIS
    Generate PR body template for common PR types.

.DESCRIPTION
    Generates a formatted PR body template based on PR type (feature, fix, refactor, etc.)
    that can be piped to create-pr.ps1 or used as a starting point.

.PARAMETER Type
    Type of PR: Feature, Fix, Refactor, Hotfix, Chore, Docs

.PARAMETER Description
    Brief description of the changes.

.PARAMETER Changes
    Array of changes made (bullet points).

.PARAMETER Testing
    Array of testing steps performed (bullet points).

.PARAMETER IssueNumber
    Related issue number (optional).

.EXAMPLE
    $body = .\get-pr-template.ps1 -Type Feature -Description "Add dark mode" -Changes @("Added theme toggle", "Updated styles")
    .\create-pr.ps1 -Title "feat: Add dark mode support" -Body $body -IssueNumber 42
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Feature", "Fix", "Refactor", "Hotfix", "Chore", "Docs", "Test")]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Description,
    
    [Parameter(Mandatory=$false)]
    [string[]]$Changes = @(),
    
    [Parameter(Mandatory=$false)]
    [string[]]$Testing = @(),
    
    [Parameter(Mandatory=$false)]
    [int]$IssueNumber
)

# Build PR body
$body = @"
## Overview
$Description

"@

# Add changes section if provided
if ($Changes.Count -gt 0) {
    $body += "## Changes`n"
    foreach ($change in $Changes) {
        $body += "- $change`n"
    }
    $body += "`n"
}

# Add testing section if provided
if ($Testing.Count -gt 0) {
    $body += "## Testing`n"
    foreach ($test in $Testing) {
        $body += "- $test`n"
    }
    $body += "`n"
}

# Add type-specific sections
switch ($Type) {
    "Feature" {
        $body += @"
## Screenshots/Demo
<!-- Add screenshots or demo GIF here -->

## Documentation
<!-- Link to updated docs or note if docs were updated -->

"@
    }
    "Fix" {
        $body += @"
## Root Cause
<!-- Explain what caused the issue -->

## Solution
<!-- Explain how this fix resolves it -->

"@
    }
    "Hotfix" {
        $body += @"
## Impact
<!-- Describe the severity and user impact -->

## Rollback Plan
<!-- How to rollback if this causes issues -->

"@
    }
    "Refactor" {
        $body += @"
## Benefits
<!-- What improvements does this refactoring provide? -->

## Breaking Changes
<!-- Any breaking changes? None if not applicable -->

"@
    }
}

# Add issue reference if provided
if ($IssueNumber) {
    $body += "Closes #$IssueNumber`n"
}

# Output the body
return $body
