/**
 * data-testid constants used by the app (AppStepWorkflow).
 * Use these in E2E tests so selectors don't break when copy or ARIA changes.
 * See test/e2e/APP-SELECTORS.md for the full contract.
 */
export const TEST_IDS = {
  /** Step 1 container (image upload) */
  STEP_1: 'step-1',
  /** Step 2 container (flag selection) */
  STEP_2: 'step-2',
  /** Step 3 container (adjust and save) */
  STEP_3: 'step-3',
  /** Button to go from step 1 → step 2 (visible only on step 1) */
  STEP1_NEXT: 'step1-next',
  /** Button to go from step 2 → step 3 (visible only on step 2) */
  STEP2_NEXT: 'step2-next',
  /** Back button (step 2 and step 3) */
  NAV_BACK: 'nav-back',
  /** Save/download avatar button (step 3 only) */
  SAVE_AVATAR: 'save-avatar',
} as const;
