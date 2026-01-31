/**
 * Unified workflow state management hook
 *
 * Manages all workflow state through a reducer with automatic persistence.
 * Eliminates scattered useState calls and ref tracking.
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { Step } from './useStepNavigation';
import type { WorkflowState } from '@/types/workflowState';
import { createInitialWorkflowState } from '@/types/workflowState';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import type { PresentationMode } from '@/components/PresentationModeSelector';
import { IMAGE_CONSTANTS } from '@/constants';

const STORAGE_KEY = 'beyond-borders-workflow-state';

/**
 * Action types for workflow state updates
 */
export type WorkflowAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'SET_IMAGE_URL'; imageUrl: string | null }
  | { type: 'SET_IMAGE_POSITION'; position: ImagePosition }
  | { type: 'SET_IMAGE_DIMENSIONS'; dimensions: ImageDimensions | null }
  | { type: 'SET_CIRCLE_SIZE'; size: number }
  | { type: 'SET_FLAG_ID'; flagId: string | null }
  | { type: 'SET_THICKNESS'; thickness: number }
  | { type: 'SET_FLAG_OFFSET_PCT'; offset: number }
  | { type: 'SET_PRESENTATION'; mode: PresentationMode }
  | { type: 'SET_SEGMENT_ROTATION'; rotation: number }
  | { type: 'RESET_STEP1' }
  | { type: 'RESET_STEP2' }
  | { type: 'RESET_STEP3' }
  | { type: 'RESET_ALL' }
  | { type: 'UPDATE_STEP3_FOR_FLAG'; flagId: string | null; defaultOffset?: number };

/**
 * Reducer for workflow state
 *
 * @internal - Exported for testing only
 */
export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };

    case 'SET_IMAGE_URL':
      return {
        ...state,
        step1: {
          ...state.step1,
          imageUrl: action.imageUrl,
          // Reset position when image changes (new image or cleared)
          imagePosition: { x: 0, y: 0, zoom: 0 },
          imageDimensions: action.imageUrl ? state.step1.imageDimensions : null,
        },
      };

    case 'SET_IMAGE_POSITION':
      return {
        ...state,
        step1: {
          ...state.step1,
          imagePosition: action.position,
        },
      };

    case 'SET_IMAGE_DIMENSIONS':
      // Only reset position if dimensions are actually changing (new image) or being cleared
      // Don't reset if dimensions are the same (e.g., re-detection of same image)
      const hadDimensions = state.step1.imageDimensions !== null;
      const hasDimensions = action.dimensions !== null;
      const dimensionsChanged =
        (!hadDimensions && hasDimensions) || // Was null, now has dimensions
        (hadDimensions && !hasDimensions) || // Had dimensions, now null (image cleared)
        (hadDimensions &&
          hasDimensions &&
          (state.step1.imageDimensions!.width !== action.dimensions!.width ||
            state.step1.imageDimensions!.height !== action.dimensions!.height)); // Dimensions changed (different image)

      // Determine if position should be reset:
      // - Always reset when clearing dimensions (set to null)
      // - Reset when dimensions change AND position is at default (0,0,0) - indicates new image
      // - Don't reset when going from null to dimensions if position is NOT default - indicates restore
      const isDefaultPosition =
        state.step1.imagePosition.x === 0 &&
        state.step1.imagePosition.y === 0 &&
        state.step1.imagePosition.zoom === 0;

      const shouldResetPosition =
        action.dimensions === null || // Always reset when clearing
        (dimensionsChanged && isDefaultPosition); // Only reset if position is at default (new image, not restore)

      return {
        ...state,
        step1: {
          ...state.step1,
          imageDimensions: action.dimensions,
          // Only reset position when dimensions actually change (new image loaded) or when cleared
          imagePosition: shouldResetPosition ? { x: 0, y: 0, zoom: 0 } : state.step1.imagePosition,
        },
      };

    case 'SET_CIRCLE_SIZE':
      return {
        ...state,
        step1: {
          ...state.step1,
          circleSize: action.size,
        },
      };

    case 'SET_FLAG_ID':
      return {
        ...state,
        step2: {
          ...state.step2,
          flagId: action.flagId,
        },
      };

    case 'SET_THICKNESS':
      return {
        ...state,
        step3: {
          ...state.step3,
          thickness: action.thickness,
        },
      };

    case 'SET_FLAG_OFFSET_PCT':
      return {
        ...state,
        step3: {
          ...state.step3,
          flagOffsetPct: action.offset,
        },
      };

    case 'SET_PRESENTATION':
      return {
        ...state,
        step3: {
          ...state.step3,
          presentation: action.mode,
        },
      };

    case 'SET_SEGMENT_ROTATION':
      return {
        ...state,
        step3: {
          ...state.step3,
          segmentRotation: action.rotation,
        },
      };

    case 'RESET_STEP1':
      return {
        ...state,
        step1: {
          imageUrl: null,
          imagePosition: { x: 0, y: 0, zoom: 0 },
          imageDimensions: null,
          circleSize: IMAGE_CONSTANTS.DEFAULT_CIRCLE_SIZE,
        },
      };

    case 'RESET_STEP2':
      return {
        ...state,
        step2: {
          flagId: null,
        },
      };

    case 'RESET_STEP3':
      return {
        ...state,
        step3: {
          thickness: 10,
          flagOffsetPct: 0,
          presentation: 'ring',
          segmentRotation: 0,
          configuredForFlagId: null,
        },
      };

    case 'RESET_ALL':
      return createInitialWorkflowState();

    case 'UPDATE_STEP3_FOR_FLAG':
      return {
        ...state,
        step3: {
          ...state.step3,
          configuredForFlagId: action.flagId,
          flagOffsetPct: action.defaultOffset ?? state.step3.flagOffsetPct,
        },
      };

    default:
      return state;
  }
}

/**
 * Persist state to sessionStorage
 */
function persistState(state: WorkflowState): void {
  try {
    // Only persist essential state (not computed values like imageDimensions)
    const persistable = {
      step1: {
        imageUrl: state.step1.imageUrl,
        imagePosition: state.step1.imagePosition,
        // Don't persist: imageDimensions, circleSize (computed)
        // Don't persist: croppedImageUrl (tied to specific position/zoom, must be recaptured)
      },
      step2: state.step2,
      step3: state.step3,
      currentStep: state.currentStep,
    };

    // Only persist data URLs (blob URLs are invalid after refresh)
    if (persistable.step1?.imageUrl && !persistable.step1.imageUrl.startsWith('data:')) {
      persistable.step1.imageUrl = null;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    // Ignore storage errors (e.g., private browsing mode)
  }
}

/**
 * Restore state from sessionStorage
 */
function restoreState(): Partial<WorkflowState> | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<WorkflowState>;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Hook for managing unified workflow state
 *
 * Provides:
 * - Reducer-based state management
 * - Automatic persistence to sessionStorage
 * - Type-safe state updates
 * - Convenience methods for common operations
 */
export function useWorkflowState() {
  // Initialize state from storage or defaults
  const initialState = useCallback(() => {
    const restored = restoreState();
    if (!restored) {
      return createInitialWorkflowState();
    }

    // Merge restored state with defaults
    const state = createInitialWorkflowState();

    // Filter out blob URLs (they're invalid after refresh)
    const restoredImageUrl = restored.step1?.imageUrl;
    const validImageUrl =
      restoredImageUrl && restoredImageUrl.startsWith('data:') ? restoredImageUrl : null;

    return {
      ...state,
      step1: {
        ...state.step1,
        ...restored.step1,
        imageUrl: validImageUrl,
        // Don't restore computed values
        imageDimensions: null,
        circleSize: IMAGE_CONSTANTS.DEFAULT_CIRCLE_SIZE,
      },
      step2: {
        ...state.step2,
        ...restored.step2,
      },
      step3: {
        ...state.step3,
        ...restored.step3,
      },
      currentStep: restored.currentStep ?? state.currentStep,
    };
  }, []);

  const [state, dispatch] = useReducer(workflowReducer, undefined, initialState);
  const isResettingRef = useRef(false);

  // Persist state on changes (but not during reset)
  useEffect(() => {
    if (!isResettingRef.current) {
      persistState(state);
    }
    isResettingRef.current = false;
  }, [state]);

  // Convenience methods
  const setStep = useCallback((step: Step) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const setImageUrl = useCallback((imageUrl: string | null) => {
    dispatch({ type: 'SET_IMAGE_URL', imageUrl });
  }, []);

  const setImagePosition = useCallback((position: ImagePosition) => {
    dispatch({ type: 'SET_IMAGE_POSITION', position });
  }, []);

  const setImageDimensions = useCallback((dimensions: ImageDimensions | null) => {
    dispatch({ type: 'SET_IMAGE_DIMENSIONS', dimensions });
  }, []);

  const setCircleSize = useCallback((size: number) => {
    dispatch({ type: 'SET_CIRCLE_SIZE', size });
  }, []);

  const setFlagId = useCallback((flagId: string | null) => {
    dispatch({ type: 'SET_FLAG_ID', flagId });
  }, []);

  const setThickness = useCallback((thickness: number) => {
    dispatch({ type: 'SET_THICKNESS', thickness });
  }, []);

  const setFlagOffsetPct = useCallback((offset: number) => {
    dispatch({ type: 'SET_FLAG_OFFSET_PCT', offset });
  }, []);

  const setPresentation = useCallback((mode: PresentationMode) => {
    dispatch({ type: 'SET_PRESENTATION', mode });
  }, []);

  const setSegmentRotation = useCallback((rotation: number) => {
    dispatch({ type: 'SET_SEGMENT_ROTATION', rotation });
  }, []);

  const resetAll = useCallback(() => {
    isResettingRef.current = true;
    dispatch({ type: 'RESET_ALL' });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const updateStep3ForFlag = useCallback((flagId: string | null, defaultOffset?: number) => {
    dispatch({ type: 'UPDATE_STEP3_FOR_FLAG', flagId, defaultOffset });
  }, []);

  return {
    state,
    // Direct state access
    step1: state.step1,
    step2: state.step2,
    step3: state.step3,
    currentStep: state.currentStep,
    // Update methods
    setStep,
    setImageUrl,
    setImagePosition,
    setImageDimensions,
    setCircleSize,
    setFlagId,
    setThickness,
    setFlagOffsetPct,
    setPresentation,
    setSegmentRotation,
    resetAll,
    updateStep3ForFlag,
  };
}
