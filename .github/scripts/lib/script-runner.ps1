<#
.SYNOPSIS
    Helper function to safely execute script commands with proper path handling.

.DESCRIPTION
    This function helps avoid common PowerShell errors when running scripts:
    - Handles path navigation safely
    - Loads variables before passing to scripts
    - Provides clear error messages
    - Returns to original directory on failure

.PARAMETER ScriptName
    Name of the script to run (e.g., "create-tracked-issue.ps1")

.PARAMETER Parameters
    Hashtable of parameters to pass to the script

.PARAMETER BodyFile
    Optional path to a file containing the body content (for issues/PRs)

.EXAMPLE
    Invoke-GitHubScript -ScriptName "create-tracked-issue.ps1" -Parameters @{
        Title = "Fix bug"
        Priority = "P1"
        Size = "M"
        Status = "InProgress"
    } -BodyFile ".local/issue-body.md"

.EXAMPLE
    Invoke-GitHubScript -ScriptName "list-issues.ps1" -Parameters @{
        Status = "InProgress"
        Priority = "P0"
    }
#>

function Invoke-GitHubScript {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet(
            "create-tracked-issue.ps1",
            "update-issue.ps1",
            "list-issues.ps1",
            "create-pr.ps1",
            "get-pr-template.ps1"
        )]
        [string]$ScriptName,
        
        [Parameter(Mandatory=$false)]
        [hashtable]$Parameters = @{},
        
        [Parameter(Mandatory=$false)]
        [string]$BodyFile
    )
    
    # Find project root (has .git directory)
    $currentDir = Get-Location
    $projectRoot = $currentDir
    
    while ($projectRoot -and !(Test-Path (Join-Path $projectRoot ".git"))) {
        $projectRoot = Split-Path $projectRoot -Parent
    }
    
    if (!$projectRoot) {
        Write-Host "❌ Error: Could not find project root (.git directory)" -ForegroundColor Red
        return $null
    }
    
    $scriptsPath = Join-Path $projectRoot ".github\scripts"
    $scriptPath = Join-Path $scriptsPath $ScriptName
    
    if (!(Test-Path $scriptPath)) {
        Write-Host "❌ Error: Script not found: $scriptPath" -ForegroundColor Red
        return $null
    }
    
    try {
        # Load body from file if specified
        if ($BodyFile) {
            $bodyPath = Join-Path $projectRoot $BodyFile
            if (!(Test-Path $bodyPath)) {
                Write-Host "❌ Error: Body file not found: $bodyPath" -ForegroundColor Red
                return $null
            }
            $Parameters["Body"] = Get-Content $bodyPath -Raw
        }
        
        # Navigate to scripts directory
        Push-Location $scriptsPath
        
        # Build parameter string
        $paramString = ""
        foreach ($key in $Parameters.Keys) {
            $value = $Parameters[$key]
            if ($value -is [array]) {
                $paramString += " -$key @('$($value -join "','")')"
            } elseif ($value -is [switch] -or $value -is [bool]) {
                if ($value) {
                    $paramString += " -$key"
                }
            } else {
                # Escape special characters in value
                $escapedValue = $value -replace '"', '`"'
                $paramString += " -$key `"$escapedValue`""
            }
        }
        
        # Execute script
        $scriptBlock = [scriptblock]::Create("& `"$scriptPath`" $paramString")
        $result = & $scriptBlock
        
        return $result
        
    } catch {
        Write-Host "❌ Error executing script: $_" -ForegroundColor Red
        return $null
    } finally {
        # Return to original directory
        Pop-Location
    }
}

# Export function
Export-ModuleMember -Function Invoke-GitHubScript
