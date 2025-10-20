import { useState, useCallback, useEffect } from 'react';
import { usePersistedState } from './usePersistedState';

export type Step = 1 | 2 | 3;

export interface StepWorkflowState {
  currentStep: Step;
  imageUrl: string | null;
  imageName: string | null;
  flagId: string;
  thickness: number;
  insetPct: number;
  flagOffsetX: number;
  presentation: 'ring' | 'segment' | 'cutout';
  bg: string | 'transparent';
  completedSteps: Step[];
  canProceedToStep2: boolean;
  canProceedToStep3: boolean;
}

export interface StepWorkflowActions {
  goToStep: (step: Step) => void;
  nextStep: () => void;
  prevStep: () => void;
  startOver: () => void;
  setImageUrl: (url: string | null) => void;
  setImageName: (name: string | null) => void;
  setFlagId: (id: string) => void;
  setThickness: (value: number) => void;
  setInsetPct: (value: number) => void;
  setFlagOffsetX: (value: number) => void;
  setPresentation: (value: 'ring' | 'segment' | 'cutout') => void;
  setBg: (value: string | 'transparent') => void;
}

export type StepWorkflow = StepWorkflowState & StepWorkflowActions;

interface UseStepWorkflowOptions {
  initialImageUrl?: string | null;
  initialFlagId?: string;
}

/**
 * Custom hook for managing the three-step workflow state
 * Handles step navigation, validation, URL sync, and state persistence
 */
export function useStepWorkflow(options: UseStepWorkflowOptions = {}): StepWorkflow {
  const { initialImageUrl = null, initialFlagId = '' } = options;

  // Core state
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [imageName, setImageName] = useState<string | null>(null);
  const [flagId, setFlagId] = useState<string>(initialFlagId);
  
  // Persisted settings (survive navigation/refresh)
  const [thickness, setThickness] = usePersistedState('workflow-thickness', 7);
  const [insetPct, setInsetPct] = usePersistedState('workflow-insetPct', 0);
  const [flagOffsetX, setFlagOffsetX] = usePersistedState('workflow-flagOffsetX', 0);
  const [presentation, setPresentation] = usePersistedState<'ring' | 'segment' | 'cutout'>(
    'workflow-presentation',
    'ring'
  );
  const [bg, setBg] = usePersistedState<string | 'transparent'>('workflow-bg', 'transparent');

  // Computed validation states - direct calculation, no callbacks
  const canProceedToStep2 = imageUrl !== null;
  const canProceedToStep3 = imageUrl !== null && flagId !== '';

  // Completed steps tracking
  const completedSteps: Step[] = [];
  if (canProceedToStep2) completedSteps.push(1);
  if (canProceedToStep3) completedSteps.push(2);

  /**
   * Sync current step with URL params
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    
    if (currentStep > 1) {
      url.searchParams.set('step', currentStep.toString());
    } else {
      url.searchParams.delete('step');
    }
    
    // Use pushState to allow browser back/forward navigation
    window.history.pushState({}, '', url.toString());
  }, [currentStep]);

  /**
   * Read initial step from URL on mount
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    const stepParam = url.searchParams.get('step');
    
    if (stepParam) {
      const requestedStep = parseInt(stepParam, 10) as Step;
      
      // Check current state directly
      const canGoTo2 = imageUrl !== null;
      const canGoTo3 = imageUrl !== null && flagId !== '';
      
      // Only restore step if we have the required data
      if (requestedStep === 2 && canGoTo2) {
        setCurrentStep(2);
      } else if (requestedStep === 3 && canGoTo3) {
        setCurrentStep(3);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally reading imageUrl/flagId without including in deps

  /**
   * Handle browser back/forward navigation
   */
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const stepParam = url.searchParams.get('step');
      
      if (!stepParam) {
        // No step param means go to step 1
        setCurrentStep(1);
        announceToScreenReader('Navigated to step 1 of 3: Choose Image');
      } else {
        const requestedStep = parseInt(stepParam, 10) as Step;
        
        // Validate step is in range
        if (requestedStep >= 1 && requestedStep <= 3) {
          // Check current state directly
          const canGoTo2 = imageUrl !== null;
          const canGoTo3 = imageUrl !== null && flagId !== '';
          
          // Only navigate if we have the required data
          if (requestedStep === 1) {
            setCurrentStep(1);
            announceToScreenReader('Navigated to step 1 of 3: Choose Image');
          } else if (requestedStep === 2 && canGoTo2) {
            setCurrentStep(2);
            announceToScreenReader('Navigated to step 2 of 3: Choose Flag');
          } else if (requestedStep === 3 && canGoTo3) {
            setCurrentStep(3);
            announceToScreenReader('Navigated to step 3 of 3: Preview & Customize');
          } else {
            // Can't navigate to requested step, stay on current step
            // But update URL to reflect actual current step
            const url = new URL(window.location.href);
            if (currentStep > 1) {
              url.searchParams.set('step', currentStep.toString());
            } else {
              url.searchParams.delete('step');
            }
            window.history.replaceState({}, '', url.toString());
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [imageUrl, flagId, currentStep]);


  /**
   * Navigate to a specific step
   * Validates that prerequisites are met
   */
  const goToStep = useCallback(
    (step: Step) => {
      // Check current state directly
      const canGoTo2 = imageUrl !== null;
      const canGoTo3 = imageUrl !== null && flagId !== '';
      
      // Validate prerequisites
      if (step === 2 && !canGoTo2) {
        return; // Can't go to step 2 without image
      }
      if (step === 3 && !canGoTo3) {
        return; // Can't go to step 3 without flag
      }

      setCurrentStep(step);

      // Announce to screen readers
      const stepNames = ['Choose Image', 'Choose Flag', 'Preview & Customize'];
      const message = `Navigated to step ${step} of 3: ${stepNames[step - 1]}`;
      announceToScreenReader(message);
    },
    [imageUrl, flagId]
  );

  /**
   * Go to next step if allowed
   */
  const nextStep = useCallback(() => {
    const canGoTo2 = imageUrl !== null;
    const canGoTo3 = imageUrl !== null && flagId !== '';
    
    setCurrentStep((current) => {
      if (current === 1 && canGoTo2) {
        // Announce to screen readers
        announceToScreenReader('Navigated to step 2 of 3: Choose Flag');
        return 2;
      } else if (current === 2 && canGoTo3) {
        // Announce to screen readers
        announceToScreenReader('Navigated to step 3 of 3: Preview & Customize');
        return 3;
      }
      return current;
    });
  }, [imageUrl, flagId]);

  /**
   * Go to previous step
   */
  const prevStep = useCallback(() => {
    setCurrentStep((current) => {
      if (current > 1) {
        const newStep = (current - 1) as Step;
        const stepNames = ['Choose Image', 'Choose Flag', 'Preview & Customize'];
        announceToScreenReader(`Navigated to step ${newStep} of 3: ${stepNames[newStep - 1]}`);
        return newStep;
      }
      return current;
    });
  }, []);

  /**
   * Reset all state and return to step 1
   */
  const startOver = useCallback(() => {
    setCurrentStep(1);
    setImageUrl(null);
    setImageName(null);
    setFlagId('');
    setThickness(7);
    setInsetPct(0);
    setFlagOffsetX(0);
    setPresentation('ring');
    setBg('transparent');

    // Clear URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('step');
    window.history.replaceState({}, '', url.toString());

    // Clear persisted state (not flagId - that's session-only)
    localStorage.removeItem('workflow-thickness');
    localStorage.removeItem('workflow-insetPct');
    localStorage.removeItem('workflow-flagOffsetX');
    localStorage.removeItem('workflow-presentation');
    localStorage.removeItem('workflow-bg');

    announceToScreenReader('Workflow reset. Starting over from step 1.');
  }, [setFlagId, setThickness, setInsetPct, setFlagOffsetX, setPresentation, setBg]);

  return {
    // State
    currentStep,
    imageUrl,
    imageName,
    flagId,
    thickness,
    insetPct,
    flagOffsetX,
    presentation,
    bg,
    completedSteps,
    canProceedToStep2,
    canProceedToStep3,
    // Actions
    goToStep,
    nextStep,
    prevStep,
    startOver,
    setImageUrl,
    setImageName,
    setFlagId,
    setThickness,
    setInsetPct,
    setFlagOffsetX,
    setPresentation,
    setBg,
  };
}

/**
 * Helper to announce messages to screen readers
 */
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'visually-hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
