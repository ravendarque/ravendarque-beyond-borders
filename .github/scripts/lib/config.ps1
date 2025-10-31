# Shared Configuration for GitHub Scripts
# Single source of truth for project IDs, field IDs, and option mappings

# Project configuration (from project-config.yaml)
$script:ProjectNumber = 2
$script:Owner = "ravendarque"
$script:Repo = "ravendarque/ravendarque-beyond-borders"
$script:ProjectId = "PVT_kwHOANLCeM4BFNzU"

# Field IDs (from project-fields.json)
$script:StatusFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2njwY"
$script:PriorityFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2nkBA"
$script:SizeFieldId = "PVTSSF_lAHOANLCeM4BFNzUzg2nkBE"

# Status option IDs (from project-fields.json)
$script:StatusOptions = @{
    "Backlog" = "f75ad846"
    "Ready" = "61e4505c"
    "InProgress" = "47fc9ee4"
    "InReview" = "df73e18b"
    "Done" = "98236657"
}

# Priority option IDs (from project-fields.json)
$script:PriorityOptions = @{
    "P0" = "79628723"
    "P1" = "0a877460"
    "P2" = "da944a9c"
}

# Size option IDs (from project-fields.json)
$script:SizeOptions = @{
    "XS" = "6c6483d2"
    "S" = "f784b110"
    "M" = "7515a9f1"
    "L" = "817d0097"
    "XL" = "db339eb2"
}

# Valid parameter values for validation
$script:ValidStatuses = @("Backlog", "Ready", "InProgress", "InReview", "Done")
$script:ValidPriorities = @("P0", "P1", "P2")
$script:ValidSizes = @("XS", "S", "M", "L", "XL")

# Export configuration
function Get-ProjectConfig {
    return @{
        ProjectNumber = $script:ProjectNumber
        Owner = $script:Owner
        Repo = $script:Repo
        ProjectId = $script:ProjectId
    }
}

function Get-FieldIds {
    return @{
        Status = $script:StatusFieldId
        Priority = $script:PriorityFieldId
        Size = $script:SizeFieldId
    }
}

function Get-StatusOptionId {
    param([Parameter(Mandatory=$true)][string]$Status)
    return $script:StatusOptions[$Status]
}

function Get-PriorityOptionId {
    param([Parameter(Mandatory=$true)][string]$Priority)
    return $script:PriorityOptions[$Priority]
}

function Get-SizeOptionId {
    param([Parameter(Mandatory=$true)][string]$Size)
    return $script:SizeOptions[$Size]
}

function Get-ValidStatuses {
    return $script:ValidStatuses
}

function Get-ValidPriorities {
    return $script:ValidPriorities
}

function Get-ValidSizes {
    return $script:ValidSizes
}
