import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStepTransitions } from '@/hooks/useStepTransitions';
import { createInitialWorkflowState } from '@/types/workflowState';
import type { WorkflowState } from '@/types/workflowState';
import type { FlagSpec } from '@/flags/schema';

// Mock getComputedStyle for circle size detection
const mockGetComputedStyle = vi.fn(() => ({
  width: '400px',
}));

describe('useStepTransitions', () => {
  const mockFlag: FlagSpec = {
    id: 'palestine',
    displayName: 'Palestine',
    png_full: 'palestine.png',
    modes: {
      cutout: {
        offsetEnabled: true,
        defaultOffset: -50,
      },
    },
  } as FlagSpec;

  const createState = (overrides?: Partial<WorkflowState>): WorkflowState => {
    return {
      ...createInitialWorkflowState(),
      ...overrides,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    sessionStorage.clear();

    // Mock window.getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    // Mock document.querySelector for circle size
    vi.spyOn(document, 'querySelector').mockReturnValue({
      // Mock element with computed style
    } as any);
  });

  it('should detect image dimensions when imageUrl changes', async () => {
    const state = createState({
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
      },
    });

    const onImageDimensionsChange = vi.fn();
    const onCircleSizeChange = vi.fn();
    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    // Create a mock image that will load
    const mockImage = {
      naturalWidth: 800,
      naturalHeight: 600,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    // Must be a `function`, not an arrow function - the hook calls `new Image()`, and
    // vitest 4 correctly rejects `new` on an arrow-function mock implementation (real JS
    // semantics; vitest 3's mock invocation was more lenient about this).
    vi.spyOn(window, 'Image').mockImplementation(function () {
      return mockImage as any;
    });

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: null,
        onImageDimensionsChange,
        onCircleSizeChange,
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    // Trigger image load
    if (mockImage.onload) {
      mockImage.onload();
    }

    await waitFor(() => {
      expect(onImageDimensionsChange).toHaveBeenCalledWith({
        width: 800,
        height: 600,
      });
    });
  });

  it('should clear dimensions when imageUrl is null', () => {
    const state = createState({
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: null,
      },
    });

    const onImageDimensionsChange = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: null,
        onImageDimensionsChange,
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      }),
    );

    expect(onImageDimensionsChange).toHaveBeenCalledWith(null);
  });

  it('should update circle size from CSS', () => {
    const state = createState();

    const onCircleSizeChange = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: null,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange,
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      }),
    );

    // Circle size should be 80% of wrapper (400px * 0.8 = 320px)
    expect(onCircleSizeChange).toHaveBeenCalledWith(320);
  });

  it('should set default offset when entering step 3 with cutout mode and flag', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: null, // Not yet configured
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine:cutout', -50, undefined);
  });

  it('should reset offset when flag changes in cutout mode', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'venezuela', // Different flag
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: 'palestine:cutout', // Was configured for different flag
        flagOffsetPct: -50,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: {
          ...mockFlag,
          id: 'venezuela',
          modes: {
            cutout: {
              offsetEnabled: true,
              defaultOffset: 0, // Different default
            },
          },
        } as FlagSpec,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(0);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('venezuela:cutout', 0, undefined);
  });

  it('should not change offset if flag and mode unchanged', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: 'palestine:cutout', // Already configured for this flag+mode
        flagOffsetPct: -50,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    // Should not be called since flag+mode hasn't changed
    expect(onFlagOffsetChange).not.toHaveBeenCalled();
    expect(onUpdateStep3ForFlag).not.toHaveBeenCalled();
  });

  it('should set offset to 0 if flag has no cutout config', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'no-cutout-flag',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: null,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: {
          id: 'no-cutout-flag',
          displayName: 'No Cutout',
        } as FlagSpec,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(0);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('no-cutout-flag:cutout', 0, undefined);
  });

  it('should sync step3 when on step 3 in ring mode and first time configuring (keeps step3 in sync)', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'ring', // Not cutout
        configuredForFlagId: null,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    // We now sync step3 for any mode when flag not yet configured (fixes back-then-forward bug)
    expect(onFlagOffsetChange).toHaveBeenCalledWith(0);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine:ring', 0, undefined);
  });

  it('should handle switching to cutout mode', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: null, // Not yet configured
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine:cutout', -50, undefined);
  });

  it('should re-apply cutout defaults when switching from ring to cutout mode (fixes #169 hotfix)', () => {
    const flagWithThickness = {
      ...mockFlag,
      modes: {
        cutout: {
          offsetEnabled: true,
          defaultOffset: -50,
          defaultBorderThickness: 13,
        },
      },
    } as FlagSpec;

    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout', // User just switched to cutout
        configuredForFlagId: 'palestine:ring', // Was configured for ring mode
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        displayedStep: state.currentStep,
        selectedFlag: flagWithThickness,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    // Mode changed from ring→cutout, so cutout defaults should be applied
    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine:cutout', -50, 13);
  });
});
