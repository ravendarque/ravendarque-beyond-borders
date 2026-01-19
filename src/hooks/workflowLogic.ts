/**
 * Logic for workflow state management
 * 
 * Consolidates logic that was scattered across reducer and hooks.
 * This makes the logic testable and easier to reason about.
 */

import type { FlagSpec } from '@/flags/schema';

/**
 * Determine if flag offset should be reset
 * 
 * Business rule: Reset offset when:
 * - Flag changes in cutout mode
 * - Switching to cutout mode for the first time for a flag
 * - First time configuring a flag in cutout mode
 */
export function shouldResetFlagOffset(
  currentStep: number,
  presentation: 'ring' | 'segment' | 'cutout',
  flagId: string | null,
  configuredForFlagId: string | null,
  selectedFlag: FlagSpec | null
): { shouldReset: boolean; defaultOffset: number | undefined } {
  // Only handle in Step 3 with cutout mode
  if (currentStep !== 3 || presentation !== 'cutout') {
    return { shouldReset: false, defaultOffset: undefined };
  }

  const defaultOffset = selectedFlag?.modes?.cutout?.defaultOffset;
  const flagChanged = configuredForFlagId !== null && configuredForFlagId !== flagId;
  const firstTimeConfiguring = configuredForFlagId === null;

  // Reset if flag changed or first time configuring
  if (flagChanged || firstTimeConfiguring) {
    return {
      shouldReset: true,
      defaultOffset: defaultOffset ?? 0, // Default to 0 if flag has no cutout config
    };
  }

  return { shouldReset: false, defaultOffset: undefined };
}

