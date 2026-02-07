/**
 * Logic for workflow state management
 *
 * Consolidates logic that was scattered across reducer and hooks.
 * This makes the logic testable and easier to reason about.
 */

import type { FlagSpec } from '@/flags/schema';

/**
 * Determine if step 3 should be synced to the current flag (offset, thickness, configuredForFlagId).
 *
 * Business rule: Sync when we're actually on step 3 and:
 * - Flag changed (user selected a different flag), or
 * - Presentation mode changed (e.g. switched to cutout), or
 * - First time configuring (configuredForFlagId is null, e.g. after navigating back then forward).
 *
 * configuredForFlagId stores a composite key "flagId:mode" so that switching presentation mode
 * also triggers re-application of mode-specific defaults (e.g. cutout defaultBorderThickness).
 *
 * Uses cutout defaults when in cutout mode; otherwise keeps current thickness/offset so we don't
 * overwrite user choices when switching flags in ring/segment mode.
 */
export function shouldResetFlagOffset(
  currentStep: number,
  presentation: 'ring' | 'segment' | 'cutout',
  flagId: string | null,
  configuredForFlagId: string | null,
  selectedFlag: FlagSpec | null,
): {
  shouldReset: boolean;
  configKey: string | null;
  defaultOffset: number | undefined;
  defaultThickness: number | undefined;
} {
  const noReset = {
    shouldReset: false,
    configKey: null,
    defaultOffset: undefined,
    defaultThickness: undefined,
  };

  // Only run when we're actually on step 3 (use displayed step to avoid race when navigating back)
  if (currentStep !== 3) {
    return noReset;
  }

  // Composite key tracks both flag and mode so switching either triggers a re-sync
  const configKey = flagId ? `${flagId}:${presentation}` : null;
  const configChanged = configuredForFlagId !== null && configuredForFlagId !== configKey;
  const firstTimeConfiguring = configuredForFlagId === null;

  if (!configChanged && !firstTimeConfiguring) {
    return noReset;
  }

  // When in cutout mode, use cutout defaults; otherwise keep current values (pass undefined)
  if (presentation === 'cutout') {
    const defaultOffset = selectedFlag?.modes?.cutout?.defaultOffset ?? 0;
    const defaultThickness = selectedFlag?.modes?.cutout?.defaultBorderThickness;
    return { shouldReset: true, configKey, defaultOffset, defaultThickness };
  }

  // Ring/segment: still set configuredForFlagId and offset 0 so step3 is in sync; keep thickness
  return { shouldReset: true, configKey, defaultOffset: 0, defaultThickness: undefined };
}
