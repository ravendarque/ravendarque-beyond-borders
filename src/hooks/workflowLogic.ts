/**
 * Logic for workflow state management
 * 
 * Consolidates logic that was scattered across reducer and hooks.
 * This makes the logic testable and easier to reason about.
 */

import type { FlagSpec } from '@/flags/schema';
import type { ImagePosition } from '@/utils/imagePosition';

/**
 * Determine if image capture is needed when transitioning to Step 3
 */
export function shouldCaptureImage(
  currentStep: number,
  imageUrl: string | null,
  imageDimensions: { width: number; height: number } | null,
  croppedImageUrl: string | null,
  currentPosition: ImagePosition,
  lastCapturedPosition: ImagePosition | null
): boolean {
  // Only capture when on Step 3 with valid image
  if (currentStep !== 3 || !imageUrl || !imageDimensions) {
    return false;
  }

  // Always capture if no cropped image exists
  if (!croppedImageUrl) {
    return true;
  }

  // Capture if position has changed since last capture
  // If lastCapturedPosition is null, we need to capture (could be from restored state)
  if (!lastCapturedPosition) {
    return true;
  }

  // Check if position/zoom has changed
  return (
    lastCapturedPosition.x !== currentPosition.x ||
    lastCapturedPosition.y !== currentPosition.y ||
    lastCapturedPosition.zoom !== currentPosition.zoom
  );
}

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

/**
 * Determine if cropped image should be cleared
 */
export function shouldClearCroppedImage(
  currentStep: number,
  imageUrl: string | null
): boolean {
  // Clear when going back to Step 1 or when image is removed
  return currentStep === 1 || !imageUrl;
}
