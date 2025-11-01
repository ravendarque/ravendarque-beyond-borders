# Beyond Borders - GitHub Labels

This file defines the standard labels for the Beyond Borders project.

## Label Categories

### Type (What kind of change)

- `bug` - Something isn't working (existing)
- `enhancement` - New feature or request (existing)
- `refactor` - Code refactoring (no functional changes)
- `hotfix` - Critical urgent fix
- `chore` - Maintenance tasks (dependencies, CI/CD, etc.)

### Area (Which part of the codebase)

- `ui` - User interface and components
- `rendering` - Canvas rendering and image processing
- `flags` - Flag data and management
- `accessibility` - WCAG compliance, a11y improvements
- `mobile` - Mobile-specific issues
- `scripts` - GitHub automation scripts
- `testing` - Tests (unit, integration, e2e)
- `ci-cd` - CI/CD workflows and automation
- `documentation` - Documentation improvements (existing)

### Priority (How urgent)

- `priority: critical` - P0 - Security, breaking bugs
- `priority: high` - P1 - Important features, UX issues
- `priority: normal` - P2 - Nice-to-have features

### Size (Effort estimate)

- `size: xs` - < 1 hour
- `size: s` - 1-2 hours
- `size: m` - 2-4 hours
- `size: l` - 4-8 hours
- `size: xl` - 8+ hours

### Status (Special states)

- `good first issue` - Good for newcomers (existing)
- `help wanted` - Extra attention needed (existing)
- `blocked` - Blocked by another issue
- `wontfix` - Won't be worked on (existing)
- `duplicate` - Duplicate issue (existing)

## Usage Guidelines

### Always Use

- One **type** label (bug, enhancement, refactor, hotfix, chore)
- One **priority** label (critical, high, normal)
- One **size** label (xs, s, m, l, xl)

### Use When Relevant

- One or more **area** labels (ui, rendering, flags, etc.)
- **Status** labels as needed (blocked, good first issue, etc.)

### Examples

```bash
# Bug report
bug, ui, mobile, priority: high, size: s

# New feature
enhancement, rendering, accessibility, priority: normal, size: l

# Refactoring
refactor, scripts, priority: normal, size: m

# Critical hotfix
hotfix, ci-cd, priority: critical, size: xs

# Testing task
chore, testing, priority: normal, size: xl
```

## Labels to Remove (Not Project-Relevant)

- `invalid` - Use comment to explain instead
- `question` - Use discussions instead
- `javascript` - Too specific, use `area` labels instead
- `dependencies` - Use `chore` + `dependencies` in title instead
