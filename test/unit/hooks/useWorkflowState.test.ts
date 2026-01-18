import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowState } from '@/hooks/useWorkflowState';
import { workflowReducer } from '@/hooks/useWorkflowState';
import { createInitialWorkflowState } from '@/types/workflowState';
import type { WorkflowAction } from '@/hooks/useWorkflowState';
import type { Step } from '@/hooks/useStepNavigation';
import { IMAGE_CONSTANTS } from '@/constants';

describe('workflowReducer', () => {
  it('should return initial state for unknown action', () => {
    const initialState = createInitialWorkflowState();
    const unknownAction = { type: 'UNKNOWN' } as unknown as WorkflowAction;
    
    const result = workflowReducer(initialState, unknownAction);
    
    expect(result).toEqual(initialState);
  });

  it('should handle SET_STEP action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_STEP', step: 2 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.currentStep).toBe(2);
    expect(result.step1).toEqual(initialState.step1);
    expect(result.step2).toEqual(initialState.step2);
    expect(result.step3).toEqual(initialState.step3);
  });

  it('should handle SET_IMAGE_URL action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_IMAGE_URL', imageUrl: 'data:image/png;base64,test' };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step1.imageUrl).toBe('data:image/png;base64,test');
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
  });

  it('should reset position when uploading a new image (fixes issue #149)', () => {
    // Simulate the bug: previous image had zoom > 0
    const state = {
      ...createInitialWorkflowState(),
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,old',
        imagePosition: { x: 10, y: -20, zoom: 50 }, // Previous image had zoom
      },
    };
    const action: WorkflowAction = { type: 'SET_IMAGE_URL', imageUrl: 'data:image/png;base64,new' };
    
    const result = workflowReducer(state, action);
    
    // Position should be reset to 0 when new image is uploaded
    expect(result.step1.imageUrl).toBe('data:image/png;base64,new');
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
  });

  it('should reset position when setting imageUrl to null', () => {
    const state = {
      ...createInitialWorkflowState(),
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
        imagePosition: { x: 10, y: 20, zoom: 5 },
      },
    };
    const action: WorkflowAction = { type: 'SET_IMAGE_URL', imageUrl: null };
    
    const result = workflowReducer(state, action);
    
    expect(result.step1.imageUrl).toBeNull();
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
    expect(result.step1.imageDimensions).toBeNull();
    expect(result.step1.croppedImageUrl).toBeNull();
  });

  it('should handle SET_IMAGE_POSITION action', () => {
    const initialState = createInitialWorkflowState();
    const newPosition = { x: 10, y: -20, zoom: 50 };
    const action: WorkflowAction = { type: 'SET_IMAGE_POSITION', position: newPosition };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step1.imagePosition).toEqual(newPosition);
  });

  it('should handle SET_IMAGE_DIMENSIONS action', () => {
    const initialState = createInitialWorkflowState();
    const dimensions = { width: 800, height: 600 };
    const action: WorkflowAction = { type: 'SET_IMAGE_DIMENSIONS', dimensions };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step1.imageDimensions).toEqual(dimensions);
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
  });

  it('should reset position when setting dimensions to null', () => {
    const state = {
      ...createInitialWorkflowState(),
      step1: {
        ...createInitialWorkflowState().step1,
        imagePosition: { x: 10, y: 20, zoom: 5 },
      },
    };
    const action: WorkflowAction = { type: 'SET_IMAGE_DIMENSIONS', dimensions: null };
    
    const result = workflowReducer(state, action);
    
    expect(result.step1.imageDimensions).toBeNull();
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
  });

  it('should handle SET_CIRCLE_SIZE action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_CIRCLE_SIZE', size: 300 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step1.circleSize).toBe(300);
  });

  it('should handle SET_CROPPED_IMAGE_URL action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_CROPPED_IMAGE_URL', url: 'data:image/png;base64,cropped' };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step1.croppedImageUrl).toBe('data:image/png;base64,cropped');
  });

  it('should handle SET_FLAG_ID action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_FLAG_ID', flagId: 'palestine' };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step2.flagId).toBe('palestine');
  });

  it('should handle SET_THICKNESS action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_THICKNESS', thickness: 20 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step3.thickness).toBe(20);
  });

  it('should handle SET_FLAG_OFFSET_PCT action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_FLAG_OFFSET_PCT', offset: -25 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step3.flagOffsetPct).toBe(-25);
  });

  it('should handle SET_PRESENTATION action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_PRESENTATION', mode: 'cutout' };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step3.presentation).toBe('cutout');
  });

  it('should handle SET_SEGMENT_ROTATION action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'SET_SEGMENT_ROTATION', rotation: 45 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step3.segmentRotation).toBe(45);
  });

  it('should handle RESET_STEP1 action', () => {
    const state = {
      ...createInitialWorkflowState(),
      step1: {
        imageUrl: 'data:image/png;base64,test',
        imagePosition: { x: 10, y: 20, zoom: 5 },
        imageDimensions: { width: 800, height: 600 },
        circleSize: 300,
        croppedImageUrl: 'data:image/png;base64,cropped',
      },
    };
    const action: WorkflowAction = { type: 'RESET_STEP1' };
    
    const result = workflowReducer(state, action);
    
    expect(result.step1.imageUrl).toBeNull();
    expect(result.step1.imagePosition).toEqual({ x: 0, y: 0, zoom: 0 });
    expect(result.step1.imageDimensions).toBeNull();
    expect(result.step1.circleSize).toBe(IMAGE_CONSTANTS.DEFAULT_CIRCLE_SIZE);
    expect(result.step1.croppedImageUrl).toBeNull();
  });

  it('should handle RESET_STEP2 action', () => {
    const state = {
      ...createInitialWorkflowState(),
      step2: {
        flagId: 'palestine',
      },
    };
    const action: WorkflowAction = { type: 'RESET_STEP2' };
    
    const result = workflowReducer(state, action);
    
    expect(result.step2.flagId).toBeNull();
  });

  it('should handle RESET_STEP3 action', () => {
    const state = {
      ...createInitialWorkflowState(),
      step3: {
        thickness: 20,
        flagOffsetPct: -25,
        presentation: 'cutout' as const,
        segmentRotation: 45,
        configuredForFlagId: 'palestine',
      },
    };
    const action: WorkflowAction = { type: 'RESET_STEP3' };
    
    const result = workflowReducer(state, action);
    
    expect(result.step3.thickness).toBe(10);
    expect(result.step3.flagOffsetPct).toBe(0);
    expect(result.step3.presentation).toBe('ring');
    expect(result.step3.segmentRotation).toBe(0);
    expect(result.step3.configuredForFlagId).toBeNull();
  });

  it('should handle RESET_ALL action', () => {
    const state = {
      ...createInitialWorkflowState(),
      step1: {
        imageUrl: 'data:image/png;base64,test',
        imagePosition: { x: 10, y: 20, zoom: 5 },
        imageDimensions: { width: 800, height: 600 },
        circleSize: 300,
        croppedImageUrl: 'data:image/png;base64,cropped',
      },
      step2: {
        flagId: 'palestine',
      },
      step3: {
        thickness: 20,
        flagOffsetPct: -25,
        presentation: 'cutout' as const,
        segmentRotation: 45,
        configuredForFlagId: 'palestine',
      },
      currentStep: 3 as Step,
    };
    const action: WorkflowAction = { type: 'RESET_ALL' };
    
    const result = workflowReducer(state, action);
    
    expect(result).toEqual(createInitialWorkflowState());
  });

  it('should handle UPDATE_STEP3_FOR_FLAG action', () => {
    const initialState = createInitialWorkflowState();
    const action: WorkflowAction = { type: 'UPDATE_STEP3_FOR_FLAG', flagId: 'palestine', defaultOffset: -50 };
    
    const result = workflowReducer(initialState, action);
    
    expect(result.step3.configuredForFlagId).toBe('palestine');
    expect(result.step3.flagOffsetPct).toBe(-50);
  });

  it('should preserve existing offset when UPDATE_STEP3_FOR_FLAG has no defaultOffset', () => {
    const state = {
      ...createInitialWorkflowState(),
      step3: {
        ...createInitialWorkflowState().step3,
        flagOffsetPct: 25,
      },
    };
    const action: WorkflowAction = { type: 'UPDATE_STEP3_FOR_FLAG', flagId: 'palestine' };
    
    const result = workflowReducer(state, action);
    
    expect(result.step3.configuredForFlagId).toBe('palestine');
    expect(result.step3.flagOffsetPct).toBe(25);
  });
});

describe('useWorkflowState', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default state when no storage exists', () => {
    const { result } = renderHook(() => useWorkflowState());
    
    expect(result.current.step1.imageUrl).toBeNull();
    expect(result.current.step2.flagId).toBeNull();
    expect(result.current.step3.thickness).toBe(10);
    expect(result.current.currentStep).toBe(1);
  });

  it('should restore state from sessionStorage', () => {
    const storedState = {
      step1: {
        imageUrl: 'data:image/png;base64,test',
        imagePosition: { x: 10, y: -20, zoom: 50 },
        croppedImageUrl: null,
      },
      step2: {
        flagId: 'palestine',
      },
      step3: {
        thickness: 15,
        flagOffsetPct: -25,
        presentation: 'cutout' as const,
        segmentRotation: 30,
        configuredForFlagId: 'palestine',
      },
      currentStep: 3,
    };
    
    sessionStorage.setItem('beyond-borders-workflow-state', JSON.stringify(storedState));
    
    const { result } = renderHook(() => useWorkflowState());
    
    expect(result.current.step1.imageUrl).toBe('data:image/png;base64,test');
    expect(result.current.step1.imagePosition).toEqual({ x: 10, y: -20, zoom: 50 });
    expect(result.current.step2.flagId).toBe('palestine');
    expect(result.current.step3.thickness).toBe(15);
    expect(result.current.step3.flagOffsetPct).toBe(-25);
    expect(result.current.step3.presentation).toBe('cutout');
    expect(result.current.currentStep).toBe(3);
    // Computed values should be reset
    expect(result.current.step1.imageDimensions).toBeNull();
    expect(result.current.step1.circleSize).toBe(IMAGE_CONSTANTS.DEFAULT_CIRCLE_SIZE);
  });

  it('should ignore blob URLs in stored state', () => {
    const storedState = {
      step1: {
        imageUrl: 'blob:http://localhost/test',
        imagePosition: { x: 0, y: 0, zoom: 0 },
        croppedImageUrl: null,
      },
      step2: { flagId: null },
      step3: createInitialWorkflowState().step3,
      currentStep: 1,
    };
    
    sessionStorage.setItem('beyond-borders-workflow-state', JSON.stringify(storedState));
    
    const { result } = renderHook(() => useWorkflowState());
    
    // Blob URLs should be ignored (set to null)
    expect(result.current.step1.imageUrl).toBeNull();
  });

  it('should persist state to sessionStorage on changes', () => {
    const { result } = renderHook(() => useWorkflowState());
    
    act(() => {
      result.current.setImageUrl('data:image/png;base64,test');
    });
    
    const stored = sessionStorage.getItem('beyond-borders-workflow-state');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.step1.imageUrl).toBe('data:image/png;base64,test');
  });

  it('should handle storage errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => useWorkflowState());
    
    // Should still initialize with defaults
    expect(result.current.step1.imageUrl).toBeNull();
  });

  it('should handle storage write errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const { result } = renderHook(() => useWorkflowState());
    
    act(() => {
      result.current.setImageUrl('data:image/png;base64,test');
    });
    
    // State should still update even if storage fails
    expect(result.current.step1.imageUrl).toBe('data:image/png;base64,test');
  });

  it('should provide all update methods', () => {
    const { result } = renderHook(() => useWorkflowState());
    
    expect(typeof result.current.setStep).toBe('function');
    expect(typeof result.current.setImageUrl).toBe('function');
    expect(typeof result.current.setImagePosition).toBe('function');
    expect(typeof result.current.setImageDimensions).toBe('function');
    expect(typeof result.current.setCircleSize).toBe('function');
    expect(typeof result.current.setCroppedImageUrl).toBe('function');
    expect(typeof result.current.setFlagId).toBe('function');
    expect(typeof result.current.setThickness).toBe('function');
    expect(typeof result.current.setFlagOffsetPct).toBe('function');
    expect(typeof result.current.setPresentation).toBe('function');
    expect(typeof result.current.setSegmentRotation).toBe('function');
    expect(typeof result.current.resetAll).toBe('function');
    expect(typeof result.current.updateStep3ForFlag).toBe('function');
  });

  it('should update state through setter methods', () => {
    const { result } = renderHook(() => useWorkflowState());
    
    act(() => {
      result.current.setImageUrl('data:image/png;base64,test');
      result.current.setFlagId('palestine');
      result.current.setThickness(20);
      result.current.setPresentation('cutout');
    });
    
    expect(result.current.step1.imageUrl).toBe('data:image/png;base64,test');
    expect(result.current.step2.flagId).toBe('palestine');
    expect(result.current.step3.thickness).toBe(20);
    expect(result.current.step3.presentation).toBe('cutout');
  });

  it('should clear storage on resetAll', () => {
    const { result } = renderHook(() => useWorkflowState());
    
    act(() => {
      result.current.setImageUrl('data:image/png;base64,test');
    });
    
    expect(sessionStorage.getItem('beyond-borders-workflow-state')).toBeTruthy();
    
    act(() => {
      result.current.resetAll();
    });
    
    expect(sessionStorage.getItem('beyond-borders-workflow-state')).toBeNull();
    expect(result.current.step1.imageUrl).toBeNull();
    expect(result.current.step2.flagId).toBeNull();
  });

  it('should handle invalid JSON in storage', () => {
    sessionStorage.setItem('beyond-borders-workflow-state', 'invalid json');
    
    const { result } = renderHook(() => useWorkflowState());
    
    // Should fall back to defaults
    expect(result.current.step1.imageUrl).toBeNull();
  });
});
