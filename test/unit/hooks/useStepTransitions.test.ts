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

    vi.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

    renderHook(() =>
      useStepTransitions({
        state,
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
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine', -50);
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
        configuredForFlagId: 'palestine', // Was configured for different flag
        flagOffsetPct: -50,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
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
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('venezuela', 0);
  });

  it('should not change offset if flag has not changed', () => {
    const state = createState({
      currentStep: 3,
      step2: {
        flagId: 'palestine',
      },
      step3: {
        ...createInitialWorkflowState().step3,
        presentation: 'cutout',
        configuredForFlagId: 'palestine', // Already configured for this flag
        flagOffsetPct: -50,
      },
    });

    const onFlagOffsetChange = vi.fn();
    const onUpdateStep3ForFlag = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    // Should not be called since flag hasn't changed
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
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('no-cutout-flag', 0);
  });

  it('should not handle offset logic when not in cutout mode', () => {
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
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).not.toHaveBeenCalled();
    expect(onUpdateStep3ForFlag).not.toHaveBeenCalled();
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
        selectedFlag: mockFlag,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      }),
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine', -50);
  });
});
