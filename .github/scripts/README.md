# GitHub Scripts & Development Tools

Comprehensive scripts for development environment setup, validation, issue management, and workflow automation.

## 🚀 Quick Start for New Developers

**First-time setup (automated):**

```powershell
# All platforms (PowerShell Core)
pwsh .github/scripts/setup-dev-env.ps1

# Windows (Windows PowerShell)
.\.github\scripts\setup-dev-env.ps1
```

📖 **Full Setup Guide**: [SETUP.md](./SETUP.md)

## Directory Structure

```
.github/scripts/
  setup-dev-env.ps1          ← Automated environment setup (all platforms) 🆕
  local-ci.ps1                ← Pre-push validation (all platforms) 🆕
  check-privacy.ps1          ← Privacy validation checks
  check-todo-fixme.ps1       ← TODO/FIXME detection
  check-file-permissions.ps1 ← File permissions validation
  check-large-files.ps1      ← Large file detection
  github-helper.ps1          ← Main CLI (error-resistant wrapper) ⭐
  sync-labels.ps1            ← Label management
  SETUP.md                   ← Setup documentation 🆕
  README.md
  commands/                   ← Individual command implementations
    create-tracked-issue.ps1
    create-pr.ps1
    get-pr-template.ps1
    list-issues.ps1
    update-issue.ps1
  lib/                       ← Shared utilities
    config.ps1
    github-utils.ps1
    script-runner.ps1
```

## Quick Reference

### Development & Validation Scripts

| Script                     | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| **`setup-dev-env.ps1`** 🆕 | **One-command setup for new developers (all platforms)** |
| **`local-ci.ps1`** 🆕      | **Pre-push validation (secrets, security, linting)**     |
| `sync-labels.ps1`          | Sync standard labels to GitHub repository                |

📖 **Setup Guide**: [SETUP.md](./SETUP.md)

### Issue & PR Management Scripts

| Script                              | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| **`github-helper.ps1`**             | **Simple, error-resistant commands (recommended)** ⭐ |
| `commands/create-tracked-issue.ps1` | Create issues and add to project board                |
| `commands/update-issue.ps1`         | Update issue Status/Priority/Size fields              |
| `commands/list-issues.ps1`          | Query and filter issues with project fields           |
| `commands/create-pr.ps1`            | Create pull requests with proper formatting           |
| `commands/get-pr-template.ps1`      | Generate PR body templates                            |

**Common Workflows (Using github-helper.ps1 - Recommended):**

```powershell
# Create and track an issue from body file
.\github-helper.ps1 issue-create -Title "Fix bug" -BodyFile ".local/issue.md" -Priority P1 -Size M

# Create issue with inline body
.\github-helper.ps1 issue-create -Title "Fix bug" -Body "Description here" -Priority P1 -Size S

# Start working on an issue
.\github-helper.ps1 issue-update -Number 90 -Status InProgress

# Create a pull request
.\github-helper.ps1 pr-create -Title "fix: Bug description" -BodyFile ".local/pr.md" -Issue 90

# View in-progress work
.\github-helper.ps1 issue-list -Status InProgress
```

**Traditional Workflows (Direct script calls):**

```powershell
# Create and track an issue
.\commands\create-tracked-issue.ps1 -Title "Fix bug" -Body "Description" -Priority P1 -Size S

# Start working on an issue
.\commands\update-issue.ps1 -IssueNumber 87 -Status InProgress

# Create a pull request
$body = Get-Content "pr-body.md" -Raw
.\commands\create-pr.ps1 -Title "fix: Bug description" -Body $body -IssueNumber 87

# View in-progress work
.\commands\list-issues.ps1 -Status InProgress
```

## Architecture

### SOLID Principles Applied

1. **Single Responsibility Principle (SRP)**
   - `github-helper.ps1` - CLI interface and command routing
   - `commands/create-tracked-issue.ps1` - Orchestrates issue creation
   - `commands/update-issue.ps1` - Updates existing issue fields
   - `commands/list-issues.ps1` - Queries and displays issues
   - `lib/config.ps1` - Configuration management only
   - `lib/github-utils.ps1` - GitHub API interactions only
   - `lib/script-runner.ps1` - Safe script execution helpers

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

### 0. github-helper.ps1 ⭐ (Recommended)

**Purpose:** Simplified, error-resistant commands for common operations.

**Why use this?**

- ✅ Works from any directory
- ✅ Automatic retry on transient network errors
- ✅ Handles body file loading for you
- ✅ Clear error messages
- ✅ No PowerShell parsing issues

**Usage:**

```powershell
# Create issue from file
.\github-helper.ps1 issue-create `
  -Title "Fix authentication bug" `
  -BodyFile ".local/issue-90.md" `
  -Priority P1 `
  -Size M `
  -Status InProgress

# Create issue with inline body
.\github-helper.ps1 issue-create `
  -Title "Add feature X" `
  -Body "Feature description here" `
  -Priority P2 `
  -Size L

# Update issue
.\github-helper.ps1 issue-update -Number 90 -Status Done

# List issues
.\github-helper.ps1 issue-list -Status InProgress -Priority P0

# Create PR
.\github-helper.ps1 pr-create `
  -Title "fix: Authentication bug" `
  -BodyFile ".local/pr-90.md" `
  -Issue 90
```

**Commands:**

- `issue-create` - Create and track new issue
- `issue-update` - Update existing issue fields
- `issue-list` - Query and filter issues
- `pr-create` - Create pull request

**Benefits over direct script calls:**

- No need to load body files manually (`$body = Get-Content...`)
- No PowerShell variable assignment errors
- Auto-retries on network failures (EOF, timeout, 5xx errors)
- Validates parameters before execution
- Returns to original directory on error

---

### 1. create-tracked-issue.ps1

**Purpose:** Create a new issue and add it to the project board with fields set.

**Usage:**

```powershell
# Minimal (uses defaults: Priority=P1, Size=M, Status=Ready)
.\create-tracked-issue.ps1 `
  -Title "Fix the bug" `
  -Body "Description of the issue"

# Full options
.\create-tracked-issue.ps1 `
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
.\create-tracked-issue.ps1 `
  -Title "Fix: Users can't login on mobile" `
  -Body "Bug description and steps to reproduce" `
  -Priority P1 `
  -Size S `
  -Status Ready
```

**For a feature:**

```powershell
.\create-tracked-issue.ps1 `
  -Title "Feature: Add dark mode support" `
  -Body "Feature description and acceptance criteria" `
  -Priority P2 `
  -Size L `
  -Status Backlog
```

**For a critical hotfix:**

```powershell
.\create-tracked-issue.ps1 `
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

### "EOF" or "timeout" errors

- **Now handled automatically!** Scripts retry up to 3 times on transient errors
- If still failing after retries, check your internet connection
- Check GitHub API status: https://www.githubstatus.com/

### PowerShell parsing errors with `&&` or `=`

- **Solution:** Use `github-helper.ps1` instead - it handles path navigation internally
- Or run commands separately (don't chain with `&&`)
- Example: Instead of `cd scripts && $body = ...`, use `github-helper.ps1`

### "Could not find project root"

- Make sure you're inside the repository directory
- The script looks for `.git` directory to find the root
- If needed, navigate to the project root first: `cd d:\git\nix\beyond-borders`

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

## Important Notes

### Status Parameter Format

Status values must **not** have spaces:

- ✅ Correct: `InProgress`, `InReview`
- ❌ Wrong: `"In Progress"`, `"In Review"`

### Label Validation

Labels are validated against the repository before use. If a label doesn't exist, you'll get a helpful error message with available labels.

### Example: Correct Usage

```powershell
.\create-tracked-issue.ps1 `
  -Title "Task" `
  -Body "Description" `
  -Priority P1 `
  -Size M `
  -Status InProgress `  # ✅ No space!
  -Labels @("bug")  # Validated first
```

---

## Version History

- **v2.0** (October 2025) - Refactored with SOLID/DRY principles, added update/list/PR scripts
- **v1.0** (Initial) - Original monolithic create-tracked-issue.ps1 script

---

## Support

For issues or questions:

1. Check this README first
2. Review the error message carefully
3. Check GitHub CLI authentication: `gh auth status`
4. Create an issue if problem persists
