/**
 * Step transition logic hook
 * 
 * Handles complex step transition logic:
 * - Image capture when entering Step 3
 * - Flag offset reset when flags change or mode switches
 * - Image dimension detection
 * - Circle size detection
 * 
 * This replaces the complex conditional logic and ref tracking in AppStepWorkflow.
 */

import { useEffect, useRef } from 'react';
import type { WorkflowState } from '@/types/workflowState';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import type { FlagSpec } from '@/flags/schema';
import { captureAdjustedImage } from '@/utils/captureImage';
import { IMAGE_CONSTANTS } from '@/constants';
import {
  shouldCaptureImage,
  shouldResetFlagOffset,
  shouldClearCroppedImage,
} from './workflowLogic';

export interface UseStepTransitionsOptions {
  /** Current workflow state */
  state: WorkflowState;
  /** Selected flag (memoized) */
  selectedFlag: FlagSpec | null;
  /** Callback to update cropped image URL */
  onCroppedImageUrlChange: (url: string | null) => void;
  /** Callback to update image dimensions */
  onImageDimensionsChange: (dimensions: ImageDimensions | null) => void;
  /** Callback to update circle size */
  onCircleSizeChange: (size: number) => void;
  /** Callback to update flag offset */
  onFlagOffsetChange: (offset: number) => void;
  /** Callback to update step 3 configuration for flag */
  onUpdateStep3ForFlag: (flagId: string | null, defaultOffset?: number) => void;
}

/**
 * Hook for handling step transitions and side effects
 * 
 * This hook encapsulates all the complex transition logic that was previously
 * scattered across multiple useEffects with ref tracking.
 */
export function useStepTransitions(options: UseStepTransitionsOptions): void {
  const {
    state,
    selectedFlag,
    onCroppedImageUrlChange,
    onImageDimensionsChange,
    onCircleSizeChange,
    onFlagOffsetChange,
    onUpdateStep3ForFlag,
  } = options;

  const { step1, step2, step3, currentStep } = state;

  // Track captured position to detect when recapture is needed
  const capturedPositionRef = useRef<ImagePosition | null>(null);

  // Detect image dimensions when image URL changes
  useEffect(() => {
    if (!step1.imageUrl) {
      onImageDimensionsChange(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      onImageDimensionsChange({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      onImageDimensionsChange(null);
    };
    img.src = step1.imageUrl;
  }, [step1.imageUrl, onImageDimensionsChange]);

  // Get circle size from CSS variable
  useEffect(() => {
    const updateCircleSize = () => {
      const wrapper = document.querySelector('.choose-wrapper');
      if (wrapper) {
        const computed = window.getComputedStyle(wrapper);
        const size = parseFloat(computed.width);
        if (!isNaN(size)) {
          // Circle is 80% of wrapper (inset 10% on each side)
          onCircleSizeChange(size * 0.8);
        }
      }
    };

    updateCircleSize();
    window.addEventListener('resize', updateCircleSize);
    return () => window.removeEventListener('resize', updateCircleSize);
  }, [step1.imageUrl, onCircleSizeChange]); // Re-run when image changes to ensure element exists

  // Clear cropped image when going back to Step 1 or when image is removed
  // This ensures position/zoom changes in Step 1 trigger a fresh capture in Step 3
  useEffect(() => {
    if (shouldClearCroppedImage(currentStep, step1.imageUrl)) {
      onCroppedImageUrlChange(null);
      capturedPositionRef.current = null;
    }
  }, [currentStep, step1.imageUrl, onCroppedImageUrlChange]);

  // Clear cropped image when position/zoom changes in Step 1
  // This ensures Step 3 always captures with the current position
  useEffect(() => {
    if (currentStep === 1 && step1.croppedImageUrl) {
      // Always clear cropped image when position/zoom changes in Step 1
      // This ensures Step 3 will recapture with the current position
      if (
        !capturedPositionRef.current ||
        capturedPositionRef.current.x !== step1.imagePosition.x ||
        capturedPositionRef.current.y !== step1.imagePosition.y ||
        capturedPositionRef.current.zoom !== step1.imagePosition.zoom
      ) {
        // Clear cropped image so Step 3 will recapture with new position
        onCroppedImageUrlChange(null);
        capturedPositionRef.current = null;
      }
    }
  }, [currentStep, step1.imagePosition, step1.croppedImageUrl, onCroppedImageUrlChange]);

  // Capture adjusted image when transitioning to Step 3
  useEffect(() => {
    // Use business logic to determine if capture is needed
    const needsCapture = shouldCaptureImage(
      currentStep,
      step1.imageUrl,
      step1.imageDimensions,
      step1.croppedImageUrl,
      step1.imagePosition,
      capturedPositionRef.current
    );

    if (needsCapture && step1.imageUrl && step1.imageDimensions) {
      // Capture the adjusted image at final render size (high-res for quality)
      captureAdjustedImage(
        step1.imageUrl,
        step1.imagePosition,
        step1.circleSize,
        step1.imageDimensions,
        IMAGE_CONSTANTS.DEFAULT_CAPTURE_SIZE
      )
        .then((captured) => {
          onCroppedImageUrlChange(captured);
          capturedPositionRef.current = { ...step1.imagePosition };
        })
        .catch(() => {
          // Fallback: use original image if capture fails
          // Error is handled silently - user still gets a working image
          onCroppedImageUrlChange(step1.imageUrl);
          capturedPositionRef.current = { ...step1.imagePosition };
        });
    }
  }, [
    currentStep,
    step1.imageUrl,
    step1.imageDimensions,
    step1.imagePosition,
    step1.circleSize,
    step1.croppedImageUrl,
    onCroppedImageUrlChange,
  ]);

  // Handle flag offset reset logic (consolidated - handles both flag changes and mode switches)
  useEffect(() => {
    // Use business logic to determine if offset should be reset
    const { shouldReset, defaultOffset } = shouldResetFlagOffset(
      currentStep,
      step3.presentation,
      step2.flagId,
      step3.configuredForFlagId,
      selectedFlag
    );

    if (shouldReset) {
      onFlagOffsetChange(defaultOffset ?? 0);
      onUpdateStep3ForFlag(step2.flagId, defaultOffset);
    }
  }, [
    currentStep,
    step2.flagId,
    step3.presentation,
    step3.configuredForFlagId,
    selectedFlag,
    onFlagOffsetChange,
    onUpdateStep3ForFlag,
  ]);
}
