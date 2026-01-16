import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStepTransitions } from '@/hooks/useStepTransitions';
import { createInitialWorkflowState } from '@/types/workflowState';
import type { WorkflowState } from '@/types/workflowState';
import type { FlagSpec } from '@/flags/schema';
import { captureAdjustedImage } from '@/utils/captureImage';
import { IMAGE_CONSTANTS } from '@/constants';

// Mock the capture function
vi.mock('@/utils/captureImage', () => ({
  captureAdjustedImage: vi.fn(),
}));

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
    
    // Reset mocks
    (captureAdjustedImage as any).mockResolvedValue('data:image/png;base64,cropped');
    
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
    const onCroppedImageUrlChange = vi.fn();
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
        onCroppedImageUrlChange,
        onImageDimensionsChange,
        onCircleSizeChange,
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange,
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange,
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
    );

    // Circle size should be 80% of wrapper (400px * 0.8 = 320px)
    expect(onCircleSizeChange).toHaveBeenCalledWith(320);
  });

  it('should capture image when entering step 3', async () => {
    const state = createState({
      currentStep: 3,
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
        imageDimensions: { width: 800, height: 600 },
        imagePosition: { x: 10, y: -20, zoom: 50 },
        circleSize: 300,
      },
    });

    const onCroppedImageUrlChange = vi.fn();

    (captureAdjustedImage as any).mockResolvedValue('data:image/png;base64,cropped');

    renderHook(() =>
      useStepTransitions({
        state,
        selectedFlag: null,
        onCroppedImageUrlChange,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(captureAdjustedImage).toHaveBeenCalledWith(
        'data:image/png;base64,test',
        { x: 10, y: -20, zoom: 50 },
        300,
        { width: 800, height: 600 },
        IMAGE_CONSTANTS.DEFAULT_CAPTURE_SIZE
      );
      expect(onCroppedImageUrlChange).toHaveBeenCalledWith('data:image/png;base64,cropped');
    });
  });

  it('should not recapture if position has not changed', async () => {
    // First, capture with initial position
    const initialState = createState({
      currentStep: 3,
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
        imageDimensions: { width: 800, height: 600 },
        imagePosition: { x: 10, y: -20, zoom: 50 },
        circleSize: 300,
      },
    });

    const onCroppedImageUrlChange = vi.fn();

    (captureAdjustedImage as any).mockResolvedValue('data:image/png;base64,already-cropped');

    const { rerender } = renderHook(
      ({ state }) =>
        useStepTransitions({
          state,
          selectedFlag: null,
          onCroppedImageUrlChange,
          onImageDimensionsChange: vi.fn(),
          onCircleSizeChange: vi.fn(),
          onFlagOffsetChange: vi.fn(),
          onUpdateStep3ForFlag: vi.fn(),
        }),
      { initialProps: { state: initialState } }
    );

    // Wait for initial capture
    await waitFor(() => {
      expect(captureAdjustedImage).toHaveBeenCalledTimes(1);
    });

    // Clear the mock call count
    vi.clearAllMocks();

    // Now update state with same position but croppedImageUrl already set
    const updatedState = createState({
      currentStep: 3,
      step1: {
        ...initialState.step1,
        croppedImageUrl: 'data:image/png;base64,already-cropped',
        // Same position
        imagePosition: { x: 10, y: -20, zoom: 50 },
      },
    });

    rerender({ state: updatedState });

    // Wait a bit to ensure no new capture happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(captureAdjustedImage).not.toHaveBeenCalled();
  });

  it('should recapture if position changes', async () => {
    const state = createState({
      currentStep: 3,
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
        imageDimensions: { width: 800, height: 600 },
        imagePosition: { x: 20, y: -30, zoom: 60 }, // Different position
        circleSize: 300,
        croppedImageUrl: 'data:image/png;base64,old-cropped',
      },
    });

    const onCroppedImageUrlChange = vi.fn();

    (captureAdjustedImage as any).mockResolvedValue('data:image/png;base64,new-cropped');

    renderHook(() =>
      useStepTransitions({
        state,
        selectedFlag: null,
        onCroppedImageUrlChange,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(captureAdjustedImage).toHaveBeenCalled();
      expect(onCroppedImageUrlChange).toHaveBeenCalledWith('data:image/png;base64,new-cropped');
    });
  });

  it('should reset cropped image when going back to step 1', () => {
    const state = createState({
      currentStep: 1,
      step1: {
        ...createInitialWorkflowState().step1,
        croppedImageUrl: 'data:image/png;base64,cropped',
      },
    });

    const onCroppedImageUrlChange = vi.fn();

    renderHook(() =>
      useStepTransitions({
        state,
        selectedFlag: null,
        onCroppedImageUrlChange,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
    );

    expect(onCroppedImageUrlChange).toHaveBeenCalledWith(null);
  });

  it('should handle capture errors gracefully', async () => {
    const state = createState({
      currentStep: 3,
      step1: {
        ...createInitialWorkflowState().step1,
        imageUrl: 'data:image/png;base64,test',
        imageDimensions: { width: 800, height: 600 },
        imagePosition: { x: 10, y: -20, zoom: 50 },
        circleSize: 300,
      },
    });

    const onCroppedImageUrlChange = vi.fn();

    (captureAdjustedImage as any).mockRejectedValue(new Error('Capture failed'));

    renderHook(() =>
      useStepTransitions({
        state,
        selectedFlag: null,
        onCroppedImageUrlChange,
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange: vi.fn(),
        onUpdateStep3ForFlag: vi.fn(),
      })
    );

    await waitFor(() => {
      // Should fallback to original image
      expect(onCroppedImageUrlChange).toHaveBeenCalledWith('data:image/png;base64,test');
    });
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(0);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('no-cutout-flag', undefined);
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
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
        onCroppedImageUrlChange: vi.fn(),
        onImageDimensionsChange: vi.fn(),
        onCircleSizeChange: vi.fn(),
        onFlagOffsetChange,
        onUpdateStep3ForFlag,
      })
    );

    expect(onFlagOffsetChange).toHaveBeenCalledWith(-50);
    expect(onUpdateStep3ForFlag).toHaveBeenCalledWith('palestine', -50);
  });
});
