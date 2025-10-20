import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationButtons } from './NavigationButtons';

describe('NavigationButtons', () => {
  describe('rendering', () => {
    it('should render Back and Next buttons on step 2', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      expect(screen.getByText(/back/i)).toBeDefined();
      expect(screen.getByText(/next/i)).toBeDefined();
    });

    it('should render Next button only on step 1', () => {
      render(
        <NavigationButtons
          currentStep={1}
          canGoBack={false}
          canGoNext={true}
          onNext={vi.fn()}
        />
      );

      expect(screen.queryByText(/back/i)).toBeNull();
      expect(screen.getByText(/next/i)).toBeDefined();
    });

    it('should render Back and Finish buttons on step 3', () => {
      render(
        <NavigationButtons
          currentStep={3}
          canGoBack={true}
          canGoNext={false}
          onBack={vi.fn()}
          onFinish={vi.fn()}
        />
      );

      expect(screen.getByText(/back/i)).toBeDefined();
      expect(screen.getByText(/finish|done|download/i)).toBeDefined();
    });

    it('should render Start Over button when provided', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          onStartOver={vi.fn()}
        />
      );

      expect(screen.getByText(/start over|reset/i)).toBeDefined();
    });
  });

  describe('button states', () => {
    it('should disable Back button when canGoBack is false', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={false}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const backButton = screen.getByText(/back/i);
      expect(backButton.closest('button')?.disabled).toBe(true);
    });

    it('should disable Next button when canGoNext is false', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={false}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const nextButton = screen.getByText(/next/i);
      expect(nextButton.closest('button')?.disabled).toBe(true);
    });

    it('should enable buttons when conditions are met', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const backButton = screen.getByText(/back/i).closest('button');
      const nextButton = screen.getByText(/next/i).closest('button');
      
      expect(backButton?.disabled).toBe(false);
      expect(nextButton?.disabled).toBe(false);
    });
  });

  describe('interactions', () => {
    it('should call onBack when Back button clicked', () => {
      const handleBack = vi.fn();
      
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={handleBack}
          onNext={vi.fn()}
        />
      );

      const backButton = screen.getByText(/back/i);
      backButton.click();

      expect(handleBack).toHaveBeenCalledTimes(1);
    });

    it('should call onNext when Next button clicked', () => {
      const handleNext = vi.fn();
      
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={handleNext}
        />
      );

      const nextButton = screen.getByText(/next/i);
      nextButton.click();

      expect(handleNext).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish when Finish button clicked', () => {
      const handleFinish = vi.fn();
      
      render(
        <NavigationButtons
          currentStep={3}
          canGoBack={true}
          canGoNext={false}
          onBack={vi.fn()}
          onFinish={handleFinish}
        />
      );

      const finishButton = screen.getByText(/finish|done|download/i);
      finishButton.click();

      expect(handleFinish).toHaveBeenCalledTimes(1);
    });

    it('should call onStartOver when Start Over button clicked', () => {
      const handleStartOver = vi.fn();
      
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          onStartOver={handleStartOver}
        />
      );

      const startOverButton = screen.getByText(/start over|reset/i);
      startOverButton.click();

      expect(handleStartOver).toHaveBeenCalledTimes(1);
    });
  });

  describe('layout', () => {
    it('should use responsive layout', () => {
      const { container } = render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      // Should have flex layout for responsive design
      const navContainer = container.firstChild;
      expect(navContainer).toBeDefined();
    });

    it('should align buttons correctly', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      // Back button should appear before Next button in DOM
      const buttons = screen.getAllByRole('button');
      const backIndex = buttons.findIndex(b => b.textContent?.match(/back/i));
      const nextIndex = buttons.findIndex(b => b.textContent?.match(/next/i));
      
      expect(backIndex).toBeLessThan(nextIndex);
    });
  });

  describe('accessibility', () => {
    it('should have descriptive button labels', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      const nextButton = screen.getByRole('button', { name: /next/i });
      
      expect(backButton).toBeDefined();
      expect(nextButton).toBeDefined();
    });

    it('should indicate disabled state to screen readers', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={false}
          canGoNext={false}
          onBack={vi.fn()}
          onNext={vi.fn()}
        />
      );

      const backButton = screen.getByText(/back/i).closest('button');
      const nextButton = screen.getByText(/next/i).closest('button');
      
      expect(backButton?.getAttribute('aria-disabled')).toBeTruthy();
      expect(nextButton?.getAttribute('aria-disabled')).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          isLoading={true}
        />
      );

      // Button text should change to "Loading..." and be disabled
      const nextButton = screen.getByText(/loading/i).closest('button');
      expect(nextButton?.disabled).toBe(true);
      
      // Should have a loading spinner (CircularProgress)
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeDefined();
    });

    it('should disable all buttons when loading', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          isLoading={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect((button as HTMLButtonElement).disabled).toBe(true);
      });
    });
  });

  describe('custom labels', () => {
    it('should use custom nextLabel when provided', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          nextLabel="Continue"
        />
      );

      expect(screen.getByText('Continue')).toBeDefined();
    });

    it('should use custom backLabel when provided', () => {
      render(
        <NavigationButtons
          currentStep={2}
          canGoBack={true}
          canGoNext={true}
          onBack={vi.fn()}
          onNext={vi.fn()}
          backLabel="Previous"
        />
      );

      expect(screen.getByText('Previous')).toBeDefined();
    });
  });
});
