import { useState, useEffect, useRef, useCallback } from 'react';

export type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

export interface UseStepNavigationOptions {
  /** Current image URL (required for step 2+) */
  imageUrl: string | null;
  /** Current flag ID (required for step 3) */
  flagId: string | null;
  /** Initial step (default: 1) */
  initialStep?: Step;
}

export interface UseStepNavigationReturn {
  /** Current step (1-3) */
  currentStep: Step;
  /** Navigate to a specific step */
  setCurrentStep: (step: Step) => void;
  /** Navigate to next step */
  goToNext: () => void;
  /** Navigate to previous step */
  goToPrevious: () => void;
  /** Check if can navigate to step 2 */
  canGoToStep2: boolean;
  /** Check if can navigate to step 3 */
  canGoToStep3: boolean;
}

/**
 * Hook for managing step navigation with URL synchronization
 * 
 * Handles:
 * - Step state management
 * - URL query parameter sync (?step=1, ?step=2, ?step=3)
 * - Browser back/forward navigation
 * - Validation of step transitions based on required data
 */
export function useStepNavigation(
  options: UseStepNavigationOptions
): UseStepNavigationReturn {
  const { imageUrl, flagId, initialStep = 1 } = options;
  
  const [currentStep, setCurrentStepState] = useState<Step>(initialStep);
  const isHandlingPopState = useRef(false);

  // Calculate which steps are accessible
  const canGoToStep2 = imageUrl !== null;
  const canGoToStep3 = imageUrl !== null && flagId !== null;

  /**
   * Validate if a step transition is allowed
   */
  const canNavigateToStep = useCallback((step: Step): boolean => {
    if (step === 1) return true;
    if (step === 2) return canGoToStep2;
    if (step === 3) return canGoToStep3;
    return false;
  }, [canGoToStep2, canGoToStep3]);

  /**
   * Update URL to reflect current step
   */
  const updateUrl = (step: Step) => {
    // Don't update URL if we're handling a popstate event (browser navigation)
    if (isHandlingPopState.current) {
      isHandlingPopState.current = false;
      return;
    }

    const url = new URL(window.location.href);
    
    if (step > 1) {
      url.searchParams.set('step', step.toString());
    } else {
      url.searchParams.delete('step');
    }
    
    // Use pushState to allow browser back/forward navigation
    window.history.pushState({}, '', url.toString());
  };

  /**
   * Set step with validation
   */
  const setCurrentStep = (step: Step) => {
    if (!canNavigateToStep(step)) {
      // Can't navigate to requested step, stay on current step
      // But update URL to reflect actual current step
      updateUrl(currentStep);
      return;
    }

    setCurrentStepState(step);
    updateUrl(step);
  };

  /**
   * Navigate to next step
   */
  const goToNext = () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = (currentStep + 1) as Step;
      setCurrentStep(nextStep);
    }
  };

  /**
   * Navigate to previous step
   */
  const goToPrevious = () => {
    if (currentStep > 1) {
      const prevStep = (currentStep - 1) as Step;
      setCurrentStep(prevStep);
    }
  };

  /**
   * Sync currentStep to URL when step changes
   */
  useEffect(() => {
    updateUrl(currentStep);
  }, [currentStep]);

  /**
   * Read initial step from URL on mount
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    const stepParam = url.searchParams.get('step');
    
    if (stepParam) {
      const requestedStep = parseInt(stepParam, 10) as Step;
      
      // Only restore step if we have the required data
      // Note: canNavigateToStep is intentionally not in deps - this should only run on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (canNavigateToStep(requestedStep)) {
        setCurrentStepState(requestedStep);
      }
    }
  }, []); // Only run on mount

  /**
   * Handle browser back/forward navigation
   */
  useEffect(() => {
    const handlePopState = () => {
      isHandlingPopState.current = true;
      const url = new URL(window.location.href);
      const stepParam = url.searchParams.get('step');
      
      if (!stepParam) {
        // No step param means go to step 1
        setCurrentStepState(1);
      } else {
        const requestedStep = parseInt(stepParam, 10) as Step;
        
        // Validate step is in range
        if (requestedStep >= 1 && requestedStep <= TOTAL_STEPS) {
          // Only navigate if we have the required data
          if (canNavigateToStep(requestedStep)) {
            setCurrentStepState(requestedStep);
          } else {
            // Can't navigate to requested step, stay on current step
            // But update URL to reflect actual current step
            updateUrl(currentStep);
            isHandlingPopState.current = false;
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [imageUrl, flagId, currentStep, canNavigateToStep]);

  return {
    currentStep,
    setCurrentStep,
    goToNext,
    goToPrevious,
    canGoToStep2,
    canGoToStep3,
  };
}

