# GitHub Issue Management Scripts

Modular PowerShell scripts for managing GitHub issues, project boards, and pull requests, following SOLID and DRY principles.

## Quick Reference

| Script | Purpose |
|--------|---------|
| `create-tracked-issue-v2.ps1` | Create issues and add to project board |
| `update-issue.ps1` | Update issue Status/Priority/Size fields |
| `list-issues.ps1` | Query and filter issues with project fields |
| `create-pr.ps1` | Create pull requests with proper formatting |
| `get-pr-template.ps1` | Generate PR body templates |

**Common Workflows:**
```powershell
# Create and track an issue
.\create-tracked-issue-v2.ps1 -Title "Fix bug" -Body "Description" -Priority P1 -Size S

# Start working on an issue
.\update-issue.ps1 -IssueNumber 87 -Status InProgress

# Create a pull request
$body = Get-Content "pr-body.md" -Raw
.\create-pr.ps1 -Title "fix: Bug description" -Body $body -IssueNumber 87

# View in-progress work
.\list-issues.ps1 -Status InProgress
```

## Architecture

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - `create-tracked-issue-v2.ps1` - Orchestrates issue creation
   - `update-issue.ps1` - Updates existing issue fields
   - `list-issues.ps1` - Queries and displays issues
   - `lib/config.ps1` - Configuration management only
   - `lib/github-utils.ps1` - GitHub API interactions only

2. **Open/Closed Principle (OCP)**
   - Core utilities are stable and closed for modification
   - New scripts can be added without changing existing code
   - Configuration is externalized and easy to extend

3. **Liskov Substitution Principle (LSP)**
   - All utility functions are predictable and composable
   - Functions can be used interchangeably in any script

4. **Interface Segregation Principle (ISP)**
   - Functions do one thing and do it well
   - No bloated multi-purpose functions

5. **Dependency Inversion Principle (DIP)**
   - Scripts depend on abstractions (utility functions)
   - Not on concrete GitHub CLI commands

### DRY Principle Applied

- **Configuration** - Single source of truth in `lib/config.ps1`
- **GitHub operations** - Reusable functions in `lib/github-utils.ps1`
- **No duplication** - Each script imports and uses shared code

## Scripts

### 1. create-tracked-issue-v2.ps1

**Purpose:** Create a new issue and add it to the project board with fields set.

**Usage:**
```powershell
# Minimal (uses defaults: Priority=P1, Size=M, Status=Ready)
.\create-tracked-issue-v2.ps1 `
  -Title "Fix the bug" `
  -Body "Description of the issue"

# Full options
.\create-tracked-issue-v2.ps1 `
  -Title "Implement feature X" `
  -Body "Detailed description with acceptance criteria" `
  -Priority P0 `
  -Size L `
  -Status InProgress `
  -Labels @("enhancement", "backend")
```

**Parameters:**
- `Title` (required) - Issue title
- `Body` (required) - Issue description (markdown supported)
- `Priority` (optional) - `P0`, `P1`, `P2` (default: `P1`)
- `Size` (optional) - `XS`, `S`, `M`, `L`, `XL` (default: `M`)
- `Status` (optional) - `Backlog`, `Ready`, `InProgress`, `InReview`, `Done` (default: `Ready`)
- `Labels` (optional) - Array of label names (validated against repo)

**Key Improvements:**
- ✅ Validates labels against repository before using them
- ✅ Clear error messages with helpful suggestions
- ✅ Comprehensive status output with emojis
- ✅ Handles all GitHub operations through utility functions

---

### 2. update-issue.ps1

**Purpose:** Update Status, Priority, or Size fields on an existing issue.

**Usage:**
```powershell
# Update single field
.\update-issue.ps1 -IssueNumber 87 -Status InProgress

# Update multiple fields
.\update-issue.ps1 -IssueNumber 87 -Status Done -Priority P1 -Size M

# Change priority only
.\update-issue.ps1 -IssueNumber 87 -Priority P0
```

**Parameters:**
- `IssueNumber` (required) - Issue number to update
- `Status` (optional) - New status value
- `Priority` (optional) - New priority value
- `Size` (optional) - New size value

**Note:** At least one field must be specified.

---

### 3. list-issues.ps1

**Purpose:** Query and display issues with their project field values.

**Usage:**
```powershell
# List all open issues
.\list-issues.ps1

# Filter by status
.\list-issues.ps1 -Status InProgress

# Filter by priority
.\list-issues.ps1 -Priority P0

# Include closed issues
.\list-issues.ps1 -State all

# Combine filters
.\list-issues.ps1 -Status InProgress -Priority P1 -Limit 50
```

**Parameters:**
- `State` (optional) - `open`, `closed`, `all` (default: `open`)
- `Status` (optional) - Filter by status field
- `Priority` (optional) - Filter by priority field
- `Size` (optional) - Filter by size field
- `Limit` (optional) - Maximum number of issues to fetch (default: 20)

**Output:** Formatted table showing issue number, title, status, priority, size, and state.

---

### 4. create-pr.ps1

**Purpose:** Create a GitHub Pull Request with proper formatting and validation.

**Usage:**
```powershell
# Create PR with inline body
.\create-pr.ps1 `
  -Title "Add feature X" `
  -Body "Description of changes" `
  -IssueNumber 42

# Create PR from file
$body = Get-Content "pr-body.md" -Raw
.\create-pr.ps1 -Title "Fix bug" -Body $body -IssueNumber 50

# Create draft PR
.\create-pr.ps1 -Title "WIP: New feature" -Body "Description" -Draft
```

**Parameters:**
- `Title` (required) - PR title
- `Body` (required) - PR description (markdown supported)
- `Base` (optional) - Base branch (default: `main`)
- `Draft` (optional) - Create as draft PR
- `IssueNumber` (optional) - Issue to link (adds "Closes #N")

**Key Features:**
- ✅ Handles multi-line bodies and special characters
- ✅ Uses temp file to avoid escaping issues
- ✅ Automatically links issues
- ✅ Provides clear error messages

---

### 5. get-pr-template.ps1

**Purpose:** Generate PR body template for common PR types.

**Usage:**
```powershell
# Generate feature PR template
$body = .\get-pr-template.ps1 `
  -Type Feature `
  -Description "Add dark mode support" `
  -Changes @("Added theme toggle", "Updated styles") `
  -Testing @("Tested on Chrome", "Tested on Firefox")

# Use template with create-pr
.\create-pr.ps1 -Title "feat: Dark mode" -Body $body -IssueNumber 42

# Generate fix template
$body = .\get-pr-template.ps1 `
  -Type Fix `
  -Description "Fix login bug" `
  -Changes @("Updated auth flow") `
  -IssueNumber 50
```

**Parameters:**
- `Type` (required) - `Feature`, `Fix`, `Refactor`, `Hotfix`, `Chore`, `Docs`, `Test`
- `Description` (required) - Brief description
- `Changes` (optional) - Array of changes made
- `Testing` (optional) - Array of testing steps
- `IssueNumber` (optional) - Related issue number

**Output:** Returns formatted markdown PR body with type-specific sections.

---

## Utility Modules

### lib/config.ps1

**Purpose:** Single source of truth for all project configuration.

**Exports:**
- `Get-ProjectConfig()` - Returns project number, owner, repo, project ID
- `Get-FieldIds()` - Returns status, priority, size field IDs
- `Get-StatusOptionId($Status)` - Maps status name to option ID
- `Get-PriorityOptionId($Priority)` - Maps priority name to option ID
- `Get-SizeOptionId($Size)` - Maps size name to option ID
- `Get-ValidStatuses()` - Returns array of valid status values
- `Get-ValidPriorities()` - Returns array of valid priority values
- `Get-ValidSizes()` - Returns array of valid size values

**When to Update:** Only when project IDs or field IDs change.

---

### lib/github-utils.ps1

**Purpose:** Reusable GitHub API interaction functions.

**Functions:**
- `Write-StatusMessage($Message, $Type)` - Consistent status output with icons
- `Test-GitHubCLI()` - Verifies gh is installed and authenticated
- `Get-RepoLabels()` - Fetches available labels from repository
- `New-GitHubIssue($Title, $Body, $Labels)` - Creates a new issue
- `Add-IssueToProject($IssueUrl)` - Adds issue to project board
- `Set-ProjectItemField($ItemId, $FieldId, $OptionId, $FieldName)` - Updates a project field
- `Get-IssueFromUrl($IssueUrl)` - Extracts issue number from URL

**When to Update:** When adding new GitHub operations needed by multiple scripts.

---

## Valid Values Reference

### Status
- `Backlog` - Not yet started, in backlog
- `Ready` - Ready to be worked on
- `InProgress` - Currently being worked on (note: **no space**)
- `InReview` - Under review (PR open, awaiting merge)
- `Done` - Completed and merged

### Priority
- `P0` - Critical (security, production breaking, blocking)
- `P1` - High (important features, bugs, UX improvements)
- `P2` - Low (nice-to-have, refactoring, documentation)

### Size
- `XS` - < 1 hour
- `S` - 1-2 hours
- `M` - 2-4 hours
- `L` - 4-8 hours
- `XL` - 8+ hours

---

## Common Tasks

### Creating a New Issue

**For a bug:**
```powershell
.\create-tracked-issue-v2.ps1 `
  -Title "Fix: Users can't login on mobile" `
  -Body "Bug description and steps to reproduce" `
  -Priority P1 `
  -Size S `
  -Status Ready
```

**For a feature:**
```powershell
.\create-tracked-issue-v2.ps1 `
  -Title "Feature: Add dark mode support" `
  -Body "Feature description and acceptance criteria" `
  -Priority P2 `
  -Size L `
  -Status Backlog
```

**For a critical hotfix:**
```powershell
.\create-tracked-issue-v2.ps1 `
  -Title "CRITICAL: Production app broken" `
  -Body "Error details and immediate impact" `
  -Priority P0 `
  -Size XS `
  -Status InProgress
```

### Moving an Issue Through Workflow

```powershell
# Start working on an issue
.\update-issue.ps1 -IssueNumber 87 -Status InProgress

# Submit for review
.\update-issue.ps1 -IssueNumber 87 -Status InReview

# Mark as done
.\update-issue.ps1 -IssueNumber 87 -Status Done
```

### Finding Issues to Work On

```powershell
# Find ready issues to pick up
.\list-issues.ps1 -Status Ready

# Find high-priority issues in progress
.\list-issues.ps1 -Status InProgress -Priority P1

# Find all critical issues
.\list-issues.ps1 -Priority P0 -State all
```

---

## Best Practices

### Creating Issues

1. **Use descriptive titles** - Start with type (Fix:, Feature:, Refactor:, etc.)
2. **Keep body simple** - Avoid complex markdown with many code blocks
3. **Set appropriate priority** - P0 for critical, P1 for important, P2 for nice-to-have
4. **Estimate size realistically** - Consider complexity, not just time
5. **Start with Ready status** - Move to InProgress when work begins
6. **Omit Labels parameter** - Unless specifically needed and verified to exist

### Parameter Values

1. **Always use exact ValidateSet values** - Check the script for valid options
2. **Status has no spaces** - Use `InProgress` not "In Progress", `InReview` not "In Review"
3. **Priority uses format** - `P0`, `P1`, `P2` (not "P-0" or "Priority 1")
4. **Size uses uppercase** - `XS`, `S`, `M`, `L`, `XL` (not "xs" or "small")

### Workflow

1. **Create issue first** - Always create and plan before starting work
2. **Update status** - Move issues through Backlog → Ready → InProgress → InReview → Done
3. **Track progress** - Use the list script to see project overview
4. **Close with PRs** - Reference issue in PR (Closes #87) for automatic closure

---

## Troubleshooting

### "GitHub CLI is not installed"
Install from: https://cli.github.com/

### "GitHub CLI is not authenticated"
Run: `gh auth login`

### "Label 'xyz' does not exist"
- Check available labels: `gh label list --repo ravendarque/ravendarque-beyond-borders`
- Or omit the Labels parameter (it's optional)

### "Issue not found in project"
- Make sure the issue exists: `gh issue view <number>`
- Verify it's in the project board on GitHub
- The issue must be added to the project before updating fields

### "Failed to update field"
- Check that you have correct permissions on the repository
- Verify project ID and field IDs in `lib/config.ps1` are current
- Check GitHub status page for API issues

---

## Extending the Scripts

### Adding a New Script

1. Create new script in `.github/scripts/`
2. Import utilities at the top:
   ```powershell
   . "$PSScriptRoot\lib\config.ps1"
   . "$PSScriptRoot\lib\github-utils.ps1"
   ```
3. Use existing utility functions
4. Follow single responsibility principle
5. Update this README with usage documentation

### Adding a New Utility Function

1. Edit `lib/github-utils.ps1`
2. Add function with clear documentation
3. Follow existing patterns (error handling, status messages)
4. Export for use in scripts
5. Update utility reference in this README

### Updating Configuration

1. Edit `lib/config.ps1`
2. Update IDs from GitHub project settings
3. Test with all scripts to verify nothing breaks

---

## Migration from Old Script

### Old Script (create-tracked-issue.ps1)
```powershell
.\create-tracked-issue.ps1 `
  -Title "Task" `
  -Body "Description" `
  -Priority P1 `
  -Size M `
  -Status "In Progress" `  # ❌ Will fail!
  -Labels @("bug")
```

### New Script (create-tracked-issue-v2.ps1)
```powershell
.\create-tracked-issue-v2.ps1 `
  -Title "Task" `
  -Body "Description" `
  -Priority P1 `
  -Size M `
  -Status InProgress `  # ✅ No space!
  -Labels @("bug")  # Validated first
```

**Key Changes:**
- Status values have no spaces: `InProgress`, `InReview`
- Labels are validated before attempting to create issue
- Better error messages and status output
- Shared utilities mean less code duplication
- Easy to extend with new scripts

---

## Version History

- **v2.0** - Refactored with SOLID/DRY principles, added update and list scripts
- **v1.0** - Original monolithic create-tracked-issue.ps1 script

---

## Support

For issues or questions:
1. Check this README first
2. Review the error message carefully
3. Check GitHub CLI authentication: `gh auth status`
4. Create an issue if problem persists
