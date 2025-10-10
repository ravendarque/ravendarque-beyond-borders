# GitHub Copilot Instructions for Beyond Borders

This file contains instructions for GitHub Copilot to follow when working on the Beyond Borders project.

## Project Overview

Beyond Borders is a web application that allows users to add circular, flag-colored borders to their profile pictures to show support for marginalized groups and selected causes. The app is built with React, TypeScript, Vite, and uses Canvas 2D for rendering.

## Core Development Workflow

### 1. Issue-First Development

**ALWAYS create an issue on the GitHub Project board BEFORE starting any work.**

Use the provided script to create tracked issues:

```powershell
.\.github\scripts\create-tracked-issue.ps1 `
  -Title "Your task title" `
  -Body "Detailed description with acceptance criteria" `
  -Priority P0|P1|P2 `
  -Size XS|S|M|L|XL `
  -Status Backlog|Ready|InProgress|InReview|Done `
  -Labels @("label1", "label2")
```

**Priority Levels:**
- **P0 (Critical)**: Security issues, breaking bugs, WCAG compliance issues
- **P1 (High)**: Important features, UX improvements, performance issues
- **P2 (Low)**: Nice-to-have features, refactoring, documentation

**Size Estimates:**
- **XS**: < 1 hour
- **S**: 1-2 hours
- **M**: 2-4 hours
- **L**: 4-8 hours
- **XL**: 8+ hours

**Status Values:**
- **Backlog**: Not yet started
- **Ready**: Ready to be picked up
- **InProgress**: Currently being worked on
- **InReview**: In code review or testing
- **Done**: Completed and merged

### 2. Issue Structure Template

When creating issues, use this structure:

```markdown
## Goal
[Clear, concise description of what needs to be accomplished]

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Context
[Why this work is needed, background information]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes (optional)
[Any relevant technical details, dependencies, or considerations]
```

### 3. Progress Tracking

- Update issue status as work progresses
- Check off completed tasks in the issue body
- Add comments for significant updates or blockers
- Track the status as follows:
    - New issue: Ready
    - Work started: In progress
    - PR created: In review
    - PR merged: Done

### 4. GitHub Project Configuration

All issues should be linked to this repository.

See `.github/project.json` for project configuration.
See `.github/project-fields.json` for complete field configuration.

## Code Standards

### TypeScript

- **Always use strict TypeScript** with no `any` types unless absolutely necessary
- Use explicit return types for all functions
- Prefer interfaces over types for object shapes
- Use type guards and discriminated unions for type safety
- All props and state should be properly typed

### React

- **Use functional components** with hooks only
- Use `React.memo()` for expensive components
- Keep components small and focused (single responsibility)
- Prefer composition over inheritance
- Use custom hooks to encapsulate reusable logic
- Always handle loading and error states

### Error Handling

- Use custom error classes (`RenderError`, `FlagDataError`, `FileValidationError`)
- Implement error boundaries for graceful degradation
- Provide user-friendly error messages
- Log errors appropriately for debugging

### Performance

- Use `useMemo` and `useCallback` appropriately (not everywhere)
- Implement debouncing for expensive operations
- Use `requestIdleCallback` for non-critical background tasks
- Optimize Canvas operations (use OffscreenCanvas when available)
- Implement image preloading for frequently used assets

### Accessibility (WCAG AA Compliance)

- All interactive elements must be keyboard accessible
- Provide ARIA labels and descriptions where needed
- Ensure proper heading hierarchy (h1 → h2 → h3)
- Maintain color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Support screen readers with semantic HTML
- Test with keyboard navigation and screen readers
- Include focus indicators for all interactive elements

### Testing

- **Write tests for all new features** before considering them complete
- Unit tests: Use Vitest with React Testing Library
- E2E tests: Use Playwright for critical user flows
- Aim for meaningful coverage, not just high percentages
- Test error states and edge cases
- Mock external dependencies appropriately

Test file locations:
- Unit tests: `test/unit/`
- E2E tests: `tests/`

### Code Organization

- Keep files focused and under 300 lines when possible
- Use clear, descriptive file and folder names
- Separate concerns: components, hooks, utils, types
- Export only what's needed (prefer named exports)
- Group related functionality together

Project structure:
```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── renderer/       # Canvas rendering logic
├── flags/          # Flag data and utilities
├── utils/          # Shared utilities
├── types/          # TypeScript type definitions
└── styles/         # Global styles (Tailwind)
```

## Git Commit Standards

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring (no functional changes)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `perf`: Performance improvements
- `chore`: Build process or auxiliary tool changes
- `ci`: CI/CD configuration changes

**Examples:**
```
feat(renderer): Add predictive flag preloading

- Created useFlagPreloader hook for idle-time preloading
- Preloads 7 priority flags using requestIdleCallback
- Cache-aware (skips current flag and cached images)

Performance: ~80% cache hit for popular flags, zero CPU impact
```

```
fix(accessibility): Add keyboard navigation to flag selector

- Implemented arrow key navigation
- Added proper ARIA labels
- Fixed focus trap in modal

Closes #42
```

### Branch Naming

- Feature branches: `feature/short-description`
- Bug fixes: `fix/short-description`
- Hotfixes: `hotfix/short-description`

### Pull Request Process

1. Ensure all tests pass locally
2. Update documentation if needed
3. Reference related issues in PR description
4. Request review from team members
5. Address review comments promptly
6. Squash commits before merging (if multiple WIP commits)

## CI/CD

### GitHub Actions Workflows

The project uses CI/CD for:
- **Flag validation**: Ensures all referenced SVG flags exist in `public/flags/`
- **Build verification**: Checks that the app builds successfully
- **Test execution**: Runs unit and E2E tests
- **Type checking**: Validates TypeScript types

Run locally before pushing:
```bash
# Validate flags
node scripts/validate-flags.cjs

# Run tests
pnpm test

# Build
pnpm build

# Type check
pnpm type-check
```

## Flag Management

### Adding New Flags

1. Add flag metadata to `src/flags/flags.ts`:
   ```typescript
   {
     id: 'unique-id',
     name: 'Flag Name',
     svgFilename: 'filename.svg',
     category: 'pride' | 'national',
     keywords: ['keyword1', 'keyword2']
   }
   ```

2. Ensure the SVG file exists in `public/flags/`

3. Run validation:
   ```bash
   node scripts/validate-flags.cjs
   ```

4. Test the flag in the UI

### Flag Data Validation

- All flags must have valid Zod schemas
- SVG files must exist in `public/flags/`
- Flag IDs must be unique
- Categories must match defined types

## Common Tasks

### Starting Work on a New Task

1. Create and track issue:
   ```powershell
   .\.github\scripts\create-tracked-issue.ps1 `
     -Title "Task name" `
     -Body "Description" `
     -Priority P1 `
     -Size M `
     -Status InProgress
   ```

2. Create feature branch:
   ```bash
   git checkout -b feature/task-name
   ```

3. Make changes following code standards

4. Write tests for new functionality

5. Update issue status and check off completed tasks

6. Commit with conventional commit message

7. Push and create pull request

8. Update issue status to "InReview"

9. After merge, update status to "Done" and close issue

### Running the Development Server

```bash
pnpm install   # Install dependencies
pnpm dev       # Start dev server at http://localhost:5173
pnpm test      # Run tests
pnpm build     # Create production build
pnpm preview   # Preview production build
```

### Debugging

- Use browser DevTools for frontend debugging
- Check console for errors and warnings
- Use React DevTools for component inspection
- Use Vite's HMR for fast iteration
- Check network tab for asset loading issues

## Project-Specific Guidelines

### Canvas Rendering

- Always clean up canvas contexts
- Use `OffscreenCanvas` when available for better performance
- Handle canvas errors gracefully
- Optimize drawing operations (batch when possible)
- Use `requestAnimationFrame` for animations

### Image Processing

- Validate file types and sizes
- Handle EXIF orientation
- Provide progress feedback for large images
- Implement proper error messages for invalid files
- Consider memory constraints for large images

### State Management

- Use React Context for global state (minimal)
- Prefer local state when possible
- Use reducers for complex state logic
- Keep state as close to usage as possible
- Avoid prop drilling (use composition or context)

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Performance Score: > 90
- Bundle size: < 500KB (gzipped)
- Image processing: < 2s for typical images

## Resources

- **PRD**: `beyond-borders-prd-0.1.md`
- **Project Configuration**: `.github/project-config.yaml`
- **Project Fields**: `.github/project-fields.json`
- **Refactoring History**: `REFACTORING_SUMMARY.md`
- **Issue Creation Script**: `.github/scripts/create-tracked-issue.ps1`

## Questions or Issues?

If you encounter issues or have questions about these instructions:
1. Check existing issues in the GitHub Project
2. Review the PRD and documentation
3. Ask for clarification in a new issue
4. Update these instructions if you find gaps or improvements

---

**Last Updated**: October 10, 2025
**Maintained By**: Development Team
