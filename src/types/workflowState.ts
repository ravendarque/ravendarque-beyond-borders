/**
 * Unified workflow state types
 * 
 * Defines the step-based state model for the Beyond Borders workflow.
 * Each step owns its state, eliminating scattered useState calls and ref tracking.
 */

import type { Step } from '@/hooks/useStepNavigation';
import type { ImagePosition, ImageDimensions } from '@/utils/imagePosition';
import type { PresentationMode } from '@/components/PresentationModeSelector';

/**
 * Step 1 state: Image upload and positioning
 */
export interface Step1State {
  /** Image data URL (persisted) */
  imageUrl: string | null;
  /** Image position (x, y, zoom) */
  imagePosition: ImagePosition;
  /** Natural image dimensions (computed, not persisted) */
  imageDimensions: ImageDimensions | null;
  /** Circle size in pixels (computed from CSS, not persisted) */
  circleSize: number;
  /** Cropped image URL captured when transitioning to Step 3 */
  croppedImageUrl: string | null;
}

/**
 * Step 2 state: Flag selection
 */
export interface Step2State {
  /** Selected flag ID (persisted) */
  flagId: string | null;
}

/**
 * Step 3 state: Adjustment controls
 */
export interface Step3State {
  /** Border thickness (0-50) */
  thickness: number;
  /** Flag offset percentage for cutout mode (-50 to +50) */
  flagOffsetPct: number;
  /** Presentation mode (ring, segment, cutout) */
  presentation: PresentationMode;
  /** Segment rotation angle (0-360) */
  segmentRotation: number;
  /** Flag ID this state was configured for (used to detect flag changes) */
  configuredForFlagId: string | null;
}

/**
 * Complete workflow state
 */
export interface WorkflowState {
  step1: Step1State;
  step2: Step2State;
  step3: Step3State;
  currentStep: Step;
}

/**
 * Initial state factory
 */
export function createInitialWorkflowState(): WorkflowState {
  return {
    step1: {
      imageUrl: null,
      imagePosition: { x: 0, y: 0, zoom: 0 },
      imageDimensions: null,
      circleSize: 250, // Default, will be updated from CSS
      croppedImageUrl: null,
    },
    step2: {
      flagId: null,
    },
    step3: {
      thickness: 10,
      flagOffsetPct: 0,
      presentation: 'ring',
      segmentRotation: 0,
      configuredForFlagId: null,
    },
    currentStep: 1,
  };
}
