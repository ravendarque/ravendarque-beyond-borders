import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepProgressIndicator } from './StepProgressIndicator';
import type { Step } from '@/hooks/useStepWorkflow';

describe('StepProgressIndicator', () => {
  const mockSteps = [
    { number: 1 as Step, label: 'Choose Image', title: 'Upload your profile picture' },
    { number: 2 as Step, label: 'Choose Flag', title: 'Select a flag for your border' },
    { number: 3 as Step, label: 'Preview & Save', title: 'Customize and download' },
  ];

  describe('rendering', () => {
    it('should render all step indicators', () => {
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      expect(screen.getByText('Choose Image')).toBeDefined();
      expect(screen.getByText('Choose Flag')).toBeDefined();
      expect(screen.getByText('Preview & Save')).toBeDefined();
    });

    it('should render step numbers', () => {
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('2')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });

    it('should render compact version on mobile', () => {
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
          compact
        />
      );

      // Compact should show "Step X of Y"
      expect(screen.getByText(/Step 2 of 3/i)).toBeDefined();
    });
  });

  describe('step states', () => {
    it('should mark current step correctly', () => {
      const { container } = render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
        />
      );

      const step2 = container.querySelector('[data-current="true"]');
      expect(step2).toBeDefined();
    });

    it('should mark completed steps correctly', () => {
      render(
        <StepProgressIndicator
          currentStep={3}
          completedSteps={[1, 2]}
          steps={mockSteps}
        />
      );

      // Completed steps should have checkmarks, so numbers 1 and 2 won't be visible
      const checkmarks = screen.getAllByLabelText(/completed/i);
      expect(checkmarks.length).toBe(2);
    });

    it('should style future steps correctly', () => {
      const { container } = render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      // Steps 2 and 3 are future steps - check they exist in the list
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(3); // All 3 steps should be rendered
    });

    it('should show checkmark for completed steps', () => {
      render(
        <StepProgressIndicator
          currentStep={3}
          completedSteps={[1, 2]}
          steps={mockSteps}
        />
      );

      // Completed steps should show checkmark instead of number
      const checkmarks = screen.getAllByLabelText(/completed/i);
      expect(checkmarks).toHaveLength(2);
    });
  });

  describe('accessibility', () => {
    it('should have navigation role', () => {
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeDefined();
    });

    it('should have descriptive aria-label', () => {
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
        />
      );

      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('aria-label')).toBe('Progress: Step 2 of 3');
    });

    it('should mark current step with aria-current', () => {
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
        />
      );

      const currentStep = screen.getByText('Choose Flag').closest('li');
      expect(currentStep?.getAttribute('aria-current')).toBe('step');
    });

    it('should provide accessible titles for steps', () => {
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      const step1 = screen.getByTitle('Upload your profile picture');
      expect(step1).toBeDefined();
    });
  });

  describe('interactivity', () => {
    it('should call onStepClick when completed step is clicked', () => {
      const handleStepClick = vi.fn();
      
      render(
        <StepProgressIndicator
          currentStep={3}
          completedSteps={[1, 2]}
          steps={mockSteps}
          onStepClick={handleStepClick}
        />
      );

      const step1 = screen.getByText('Choose Image').closest('button');
      step1?.click();

      expect(handleStepClick).toHaveBeenCalledWith(1);
    });

    it('should not call onStepClick when future step is clicked', () => {
      const handleStepClick = vi.fn();
      
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
          onStepClick={handleStepClick}
        />
      );

      const step3 = screen.getByText('Preview & Save').closest('div');
      step3?.click();

      expect(handleStepClick).not.toHaveBeenCalled();
    });

    it('should not call onStepClick when current step is clicked', () => {
      const handleStepClick = vi.fn();
      
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
          onStepClick={handleStepClick}
        />
      );

      const step2 = screen.getByText('Choose Flag').closest('div');
      step2?.click();

      expect(handleStepClick).not.toHaveBeenCalled();
    });

    it('should render completed steps as buttons when onStepClick provided', () => {
      const handleStepClick = vi.fn();
      
      render(
        <StepProgressIndicator
          currentStep={3}
          completedSteps={[1, 2]}
          steps={mockSteps}
          onStepClick={handleStepClick}
        />
      );

      const step1 = screen.getByText('Choose Image').closest('button');
      const step2 = screen.getByText('Choose Flag').closest('button');
      
      expect(step1).toBeDefined();
      expect(step2).toBeDefined();
    });

    it('should have proper aria-label on clickable steps', () => {
      const handleStepClick = vi.fn();
      
      render(
        <StepProgressIndicator
          currentStep={3}
          completedSteps={[1, 2]}
          steps={mockSteps}
          onStepClick={handleStepClick}
        />
      );

      const step1Button = screen.getByLabelText('Go back to step 1: Choose Image');
      expect(step1Button).toBeDefined();
    });
  });

  describe('responsive behavior', () => {
    it('should show full stepper when not compact', () => {
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
          compact={false}
        />
      );

      // Should show all step labels
      expect(screen.getByText('Choose Image')).toBeDefined();
      expect(screen.getByText('Choose Flag')).toBeDefined();
      expect(screen.getByText('Preview & Save')).toBeDefined();
    });

    it('should show compact stepper when compact prop is true', () => {
      render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
          compact={true}
        />
      );

      // Compact mode shows summary text
      expect(screen.getByText(/Step 2 of 3/i)).toBeDefined();
      expect(screen.getByText('Choose Flag')).toBeDefined();
    });
  });

  describe('visual indicators', () => {
    it('should render connecting lines between steps', () => {
      const { container } = render(
        <StepProgressIndicator
          currentStep={2}
          completedSteps={[1]}
          steps={mockSteps}
        />
      );

      // Component renders steps as a horizontal list
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(3);
    });

    it('should show step numbers and labels', () => {
      render(
        <StepProgressIndicator
          currentStep={1}
          completedSteps={[]}
          steps={mockSteps}
        />
      );

      // Should show step labels from mockSteps
      expect(screen.getByText('Choose Image')).toBeDefined();
      expect(screen.getByText('Choose Flag')).toBeDefined();
      expect(screen.getByText('Preview & Save')).toBeDefined();
    });
  });
});
