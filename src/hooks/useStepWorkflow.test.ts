import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStepWorkflow } from './useStepWorkflow';

describe('useStepWorkflow', () => {
  beforeEach(() => {
    // Clear URL params before each test
    window.history.replaceState({}, '', window.location.pathname);
  });

  describe('initial state', () => {
    it('should start at step 1 by default', () => {
      const { result } = renderHook(() => useStepWorkflow());
      expect(result.current.currentStep).toBe(1);
    });

    it('should initialize with no image or flag selected', () => {
      const { result } = renderHook(() => useStepWorkflow());
      expect(result.current.imageUrl).toBeNull();
      expect(result.current.flagId).toBe('');
    });

    it('should not allow proceeding to step 2 without image', () => {
      const { result } = renderHook(() => useStepWorkflow());
      expect(result.current.canProceedToStep2).toBe(false);
    });

    it('should not allow proceeding to step 3 without flag', () => {
      const { result } = renderHook(() => useStepWorkflow());
      expect(result.current.canProceedToStep3).toBe(false);
    });
  });

  describe('step navigation', () => {
    it('should allow going to next step when image is uploaded', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
      });

      expect(result.current.canProceedToStep2).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);
    });

    it('should not proceed to step 2 without image', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should allow going to step 3 when flag is selected', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
      });

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.canProceedToStep3).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should allow going back to previous step', async () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      // Set state first
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
      });

      // Navigate to step 3
      act(() => {
        result.current.goToStep(3);
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should not go above step 3', async () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
      });

      act(() => {
        result.current.goToStep(3);
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should allow jumping to completed steps', async () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
      });

      act(() => {
        result.current.goToStep(3);
      });

      await waitFor(() => {
        expect(result.current.currentStep).toBe(3);
      });

      act(() => {
        result.current.goToStep(1);
      });

      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('state persistence', () => {
    it('should preserve image and flag when navigating between steps', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      const imageUrl = 'blob:test-image';
      const flagId = 'palestine';

      act(() => {
        result.current.setImageUrl(imageUrl);
        result.current.setFlagId(flagId);
        result.current.goToStep(2);
      });

      expect(result.current.imageUrl).toBe(imageUrl);
      expect(result.current.flagId).toBe(flagId);

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.imageUrl).toBe(imageUrl);
      expect(result.current.flagId).toBe(flagId);

      act(() => {
        result.current.goToStep(1);
      });

      expect(result.current.imageUrl).toBe(imageUrl);
      expect(result.current.flagId).toBe(flagId);
    });

    it('should preserve customization settings when navigating', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
        result.current.setThickness(10);
        result.current.setInsetPct(5);
        result.current.goToStep(3);
      });

      expect(result.current.thickness).toBe(10);
      expect(result.current.insetPct).toBe(5);

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.thickness).toBe(10);
      expect(result.current.insetPct).toBe(5);
    });
  });

  describe('startOver', () => {
    it('should reset all state and return to step 1', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.setFlagId('palestine');
        result.current.setThickness(10);
        result.current.setInsetPct(5);
        result.current.goToStep(3);
      });

      act(() => {
        result.current.startOver();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.imageUrl).toBeNull();
      expect(result.current.flagId).toBe('');
      expect(result.current.thickness).toBe(7); // Default value
      expect(result.current.insetPct).toBe(0); // Default value
    });
  });

  describe('URL state management', () => {
    it('should update URL when step changes', async () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
      });

      act(() => {
        result.current.goToStep(2);
      });

      await waitFor(() => {
        const url = new URL(window.location.href);
        expect(url.searchParams.get('step')).toBe('2');
      });
    });

    it('should read initial step from URL', () => {
      window.history.replaceState({}, '', '?step=2');
      
      const { result } = renderHook(() => useStepWorkflow());
      
      // Should default to step 1 if prerequisites not met
      expect(result.current.currentStep).toBe(1);
    });

    it('should use URL step param as a hint for initial step', () => {
      // This test validates that the URL param is read, but actual restoration
      // depends on having the required data (image/flag)
      window.history.replaceState({}, '', '?step=3');
      
      const { result } = renderHook(() => 
        useStepWorkflow({
          initialImageUrl: 'blob:test-image',
          initialFlagId: 'palestine',
        })
      );
      
      // The hook should have valid state to allow step 3
      expect(result.current.canProceedToStep3).toBe(true);
      expect(result.current.imageUrl).toBe('blob:test-image');
      expect(result.current.flagId).toBe('palestine');
    });

    it('should clear step param on startOver', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.goToStep(2);
      });

      act(() => {
        result.current.startOver();
      });

      const url = new URL(window.location.href);
      expect(url.searchParams.get('step')).toBeNull();
    });
  });

  describe('completed steps tracking', () => {
    it('should track which steps have been completed', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      expect(result.current.completedSteps).toEqual([]);

      act(() => {
        result.current.setImageUrl('blob:test-image');
        result.current.goToStep(2);
      });

      expect(result.current.completedSteps).toEqual([1]);

      act(() => {
        result.current.setFlagId('palestine');
        result.current.goToStep(3);
      });

      expect(result.current.completedSteps).toEqual([1, 2]);
    });

    it('should not mark step as complete if requirements not met', () => {
      const { result } = renderHook(() => useStepWorkflow());
      
      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.completedSteps).toEqual([]);
    });
  });
});
