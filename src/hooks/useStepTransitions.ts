/**
 * Step transition logic hook
 * 
 * Handles step transition logic:
 * - Flag offset reset when flags change or mode switches
 * - Image dimension detection
 * - Circle size detection
 * 
 * Note: Image capture has been removed - position/zoom is now passed directly to renderer.
 */

import { useEffect } from 'react';
import type { WorkflowState } from '@/types/workflowState';
import type { ImageDimensions } from '@/utils/imagePosition';
import type { FlagSpec } from '@/flags/schema';
import {
  shouldResetFlagOffset,
} from './workflowLogic';

export interface UseStepTransitionsOptions {
  /** Current workflow state */
  state: WorkflowState;
  /** Selected flag (memoized) */
  selectedFlag: FlagSpec | null;
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
    onImageDimensionsChange,
    onCircleSizeChange,
    onFlagOffsetChange,
    onUpdateStep3ForFlag,
  } = options;

  const { step1, step2, step3, currentStep } = state;

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
