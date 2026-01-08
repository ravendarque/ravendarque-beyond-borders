# Code Standards & Review Guidelines

This document defines the code standards, UI patterns, and review criteria
for Beyond Borders. It is designed to be comprehensive enough for AI agents
to properly review pull requests and ensure consistency.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [UI/UX Standards](#uiux-standards)
3. [Code Patterns](#code-patterns)
4. [File Organization](#file-organization)
5. [Data Flow & State Management](#data-flow--state-management)
6. [Review Checklist](#review-checklist)

---

## Component Architecture

### Component Structure

All React components should follow this structure:

```typescript
import React from 'react';
// External dependencies first
import * as Select from '@radix-ui/react-select';
// Internal imports (use @/ alias)
import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';

export interface ComponentNameProps {
  /** JSDoc comment for each prop */
  propName: string;
  /** Optional props clearly marked */
  optionalProp?: number;
}

/**
 * ComponentName - Brief description
 * 
 * Single Responsibility: What this component does (one clear purpose)
 * 
 * Additional context if needed:
 * - Usage notes
 * - Important behaviors
 */
export function ComponentName({ propName, optionalProp }: ComponentNameProps) {
  // Hooks first
  const [state, setState] = useState();
  
  // Derived values
  const computed = useMemo(() => ..., [deps]);
  
  // Event handlers
  const handleClick = () => { ... };
  
  // Early returns
  if (!propName) return null;
  
  // Main render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
}
```

### Component Principles

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define a TypeScript interface for props
3. **JSDoc Comments**: Document component purpose and important props
4. **Early Returns**: Use early returns for conditional rendering
5. **No Prop Drilling**: Use context or state management for deep props
6. **Accessibility**: All interactive elements must have proper ARIA labels

### Component File Naming

- **PascalCase** for component files: `FlagSelector.tsx`
- **kebab-case** for utility files: `flag-utils.ts`
- **camelCase** for hooks: `useAvatarRenderer.ts`

---

## UI/UX Standards

### Color System

The application uses a carefully defined color palette:

#### Primary Colors

- **Red Accent**: `#be1a1a` - Used for:
  - Active step indicators
  - Error states
  - Primary action buttons
  - Focus outlines
  - Slider track borders

#### Neutral Colors

- **Charcoal**: `#333` - Used for:
  - Text on light backgrounds
  - Borders (dashed borders, flag preview borders)
  - Control borders in neutral states

- **Dark Gray**: `#666` - Used for:
  - Secondary text
  - Icon colors in empty states

- **Light Gray**: `#ddd` - Used for:
  - Icon backgrounds (circular backgrounds)
  - Placeholder elements

#### Background Colors

- **White**: `#fff` - Primary content backgrounds
- **Cream/Yellow**: `rgba(180, 160, 100, ...)` - Used for:
  - Halftone pattern dots
  - Icon backgrounds (with opacity)
  - Hover shadows on choose-circle

#### Transparency Indicators

- **Checkered Pattern**: Light gray (`#e0e0e0`) on white (`#fff`)
  - Only appears inside ring border (circular area)
  - Used in avatar preview to show transparency
  - Pattern size: 16px × 16px

### Typography

- **Monospace Font**: Used for step titles (uppercase, letter-spacing: 1px)
  - Font stack: `monospace, ui-monospace, 'Cascadia Code'`
  - Size: 22px, weight: 600

- **Sans-serif Font**: Used for body text and UI elements
  - Font stack: `'Segoe UI', sans-serif`
  - Sizes: 13px (prompts), 14px (subtitles), 16px (body)

### Spacing System

The application uses CSS custom properties for consistent spacing:

- `--content-size`: Base size for circular elements (choose-circle, avatar-preview)
- Consistent gaps: 20px between major sections
- Padding: 12px 6px for circular content areas

### Border & Shadow Standards

#### Borders

- **Solid borders**: 1px for thin borders, 2px for prominent borders
- **Dashed borders**: 2px dashed `#333` for empty states
- **Charcoal borders**: Used for neutral states, not red
- **Red borders**: Only for sliders and active states

#### Shadows

- **Subtle glows**: Cream/yellow for choose-circle hover states
- **No shadows on dropdowns**: Removed for consistency
- **Box shadows**: Use rgba with appropriate opacity (0.08-0.3 range)

### Icon Standards

- **Size**: 40px × 40px for circular icon containers
- **Background**: Cream/yellow with opacity (`rgba(180, 160, 100, 0.2)`)
- **Color**: `#666` for icon strokes/fills
- **SVG**: Use `currentColor` for theming
- **Consistency**: Icons should match in style (solid vs outlined)

### Component-Specific UI Patterns

#### Choose Circle (Step 1)

- White circular area with halftone border effect
- Halftone uses diamond cluster pattern (5 dots: center + 4 around)
- Thin solid border (1px) inside halftone border
- Cream/yellow color scheme for halftone and borders
- Subtle glow on hover (cream/yellow, not red)

#### Flag Selector (Step 2)

- Dropdown with categorized groups
- Groups dynamically generated from flag data
- Category display names come from source of truth (flag-data.yaml)
- No box shadows on dropdown trigger or content
- Charcoal borders for neutral states
- Red only for active/selected states

#### Avatar Preview (Step 3)

- Circular preview area
- Checkered background pattern inside ring border only
- White background for checkered pattern
- Pattern slightly smaller than ring (2px inset) to prevent overflow
- Transparent background outside ring

#### Mode Buttons (Step 3)

- Uniform sizing (fixed width/height)
- Consistent padding to prevent wrapping
- Charcoal borders for click/hover states
- No background color changes on interaction

---

## Code Patterns

### State Management

1. **Local State**: Use `useState` for component-local state
2. **Derived State**: Use `useMemo` for expensive computations
3. **Shared State**: Use context or lift state to common parent
4. **No Global State Library**: Keep it simple, use React patterns

### Data Fetching & Caching

1. **Image Preloading**: Preload flag images when entering step 3
2. **Cache Management**: Use `Map` for image bitmap caching
3. **Asset URLs**: Always use `getAssetUrl()` for dynamic asset paths
   (GitHub Pages compatibility)

### Error Handling

1. **Silent Failures**: Preloading should fail silently (log in dev only)
2. **User Feedback**: Show loading states, not error states for optional operations
3. **Validation**: Validate data at boundaries (component props, function inputs)

### Performance

1. **Memoization**: Memoize expensive computations and object references
2. **Key Props**: Use stable keys for lists (flag IDs, not indices)
3. **Lazy Loading**: Images should use `loading="eager"` only when needed immediately
4. **Re-render Prevention**: Use `useMemo` to prevent unnecessary re-renders

### Accessibility

1. **ARIA Labels**: All interactive elements must have `aria-label` or `aria-labelledby`
2. **Keyboard Navigation**: All interactive elements must be keyboard accessible
3. **Focus Management**: Visible focus indicators (red outline for focus states)
4. **Screen Readers**: Use semantic HTML and proper ARIA roles
5. **Reduced Motion**: Respect `prefers-reduced-motion` media query

---

## File Organization

### Source Structure

```text
src/
├── components/         # Reusable UI components
│   ├── FlagSelector.tsx
│   ├── FlagPreview.tsx
│   ├── ImageUploadZone.tsx
│   └── index.ts       # Public exports
├── pages/             # Page-level components
│   └── AppStepWorkflow.tsx
├── hooks/             # Custom React hooks
│   ├── useAvatarRenderer.ts
│   └── useFlagImageCache.ts
├── flags/             # Flag data and schema
│   ├── flags.ts       # Generated (do not edit manually)
│   ├── schema.ts      # Zod schema definitions
│   └── utils.ts       # Flag utilities
├── renderer/          # Canvas rendering engine
├── config.ts          # App configuration (getAssetUrl, etc.)
├── styles.css         # Global styles (single file)
└── types/             # Shared TypeScript types
```

### Import Order

1. React and external dependencies
2. Radix UI or other UI libraries
3. Internal imports using `@/` alias
4. Relative imports (avoid when possible)
5. Type imports (use `import type`)

### File Naming

- **Components**: PascalCase (`FlagSelector.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAvatarRenderer.ts`)
- **Utils**: kebab-case (`flag-utils.ts`)
- **Types**: kebab-case (`flag-types.ts`)
- **Config**: kebab-case (`config.ts`)

---

## Data Flow & State Management

### Flag Data Flow

1. **Source of Truth**: `data/flag-data.yaml`
   - Categories defined in `categories` section (lookup)
   - Flags reference categories by key
   - Display names come from category lookup

2. **Processing**: `scripts/fetch-flags.cjs`
   - Reads YAML
   - Resolves category keys to display names
   - Maps display names to category codes
   - Generates `src/flags/flags.ts` with both `category` and `categoryDisplayName`

3. **Usage**: Components use `flags.ts`
   - `category`: Code for filtering/grouping (e.g., 'occupied')
   - `categoryDisplayName`: Display name from source of truth
     (e.g., 'Occupied / Disputed Territory')

### State Flow in AppStepWorkflow

```text
AppStepWorkflow (main orchestrator)
├── Step 1: ImageUploadZone
│   └── imageUrl state
├── Step 2: FlagSelector + FlagPreview
│   ├── flagId state
│   └── selectedFlag (memoized from flags.find())
└── Step 3: Adjust controls + Avatar preview
    ├── thickness, flagOffsetX, presentation
    └── render() function triggered via useEffect
```

### Image Caching Flow

1. **Flag Preview Images**: Loaded on demand, cached by browser
2. **Full Flag Images**: Preloaded when entering step 3 (for cutout mode)
3. **Cache Storage**: `Map<string, ImageBitmap>` in `useFlagImageCache` hook
4. **Cache Key**: Flag PNG filename (e.g., 'palestine.png')

---

## Review Checklist

When reviewing pull requests, verify the following:

### Code Quality

- [ ] Components follow the structure defined in [Component Architecture](#component-architecture)
- [ ] All props have TypeScript interfaces
- [ ] JSDoc comments present for components and complex functions
- [ ] No prop drilling (use context or lift state if needed)
- [ ] Proper error handling (silent for preloading, visible for user actions)
- [ ] Performance optimizations (memoization, stable keys, etc.)

### UI/UX Consistency

- [ ] Colors match the [Color System](#color-system)
  - Red (`#be1a1a`) only for active states, errors, sliders
  - Charcoal (`#333`) for neutral borders and text
  - Cream/yellow for halftone and icon backgrounds
- [ ] Typography follows [Typography](#typography) standards
- [ ] Spacing uses consistent values (20px gaps, proper padding)
- [ ] Borders and shadows follow [Border & Shadow Standards](#border--shadow-standards)
- [ ] Icons match [Icon Standards](#icon-standards)
- [ ] Component-specific patterns match existing implementations

### Data & State

- [ ] Flag data changes go through `data/flag-data.yaml` (source of truth)
- [ ] Category keys validated against category lookup
- [ ] `flags.ts` is generated (not manually edited)
- [ ] Asset URLs use `getAssetUrl()` for GitHub Pages compatibility
- [ ] State management follows [Data Flow](#data-flow--state-management) patterns

### Accessibility Review

- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all controls
- [ ] Focus indicators visible (red outline)
- [ ] Semantic HTML used appropriately
- [ ] Screen reader testing considered

### File Organization Review

- [ ] Files follow [File Organization](#file-organization) structure
- [ ] Imports follow [Import Order](#import-order)
- [ ] File names follow [File Naming](#file-naming) conventions

### Testing

- [ ] New components have appropriate tests
- [ ] Existing tests still pass
- [ ] E2E tests updated if workflow changes

### Documentation

- [ ] README updated if project structure changes
- [ ] Scripts documented if new scripts added
- [ ] This document updated if standards change

---

## Common Patterns

### Adding a New Flag

1. Edit `data/flag-data.yaml`:
   - Add flag entry with category key (e.g., `category: occupied`)
   - Category must exist in `categories` lookup
2. Run `node scripts/fetch-flags.cjs` to regenerate `flags.ts`
3. Validate: `node scripts/validate-flags.cjs`
4. Commit both YAML and generated `flags.ts`

### Adding a New UI Component

1. Create component file in `src/components/`
2. Follow [Component Architecture](#component-architecture) structure
3. Export from `src/components/index.ts`
4. Use consistent styling (reference existing components)
5. Add ARIA labels and keyboard support
6. Test with screen readers

### Modifying Styles

1. Edit `src/styles.css` (single file)
2. Follow [UI/UX Standards](#uiux-standards)
3. Use CSS custom properties for responsive values
4. Test on different screen sizes
5. Verify color contrast (WCAG AA minimum)

---

## Breaking Changes

If you need to make a breaking change:

1. **Document it**: Update this file and README
2. **Version it**: Consider semantic versioning
3. **Migrate**: Provide migration path if possible
4. **Test**: Ensure all existing functionality still works

---

## Questions?

If standards are unclear or you need to deviate:

1. **Check existing code**: Look for similar patterns
2. **Ask**: Create an issue or discussion
3. **Document**: If you deviate, document why in PR description
