import React from 'react';

export interface NavigationButtonsProps {
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Whether user can go back */
  canGoBack: boolean;
  /** Whether user can go to next step */
  canGoNext: boolean;
  /** Handler for back button */
  onBack?: () => void;
  /** Handler for next button */
  onNext?: () => void;
  /** Handler for finish button (shown on last step) */
  onFinish?: () => void;
  /** Handler for start over button */
  onStartOver?: () => void;
  /** Whether buttons are in loading state */
  isLoading?: boolean;
  /** Custom label for next button */
  nextLabel?: string;
  /** Custom label for back button */
  backLabel?: string;
  /** Custom label for finish button */
  finishLabel?: string;
}

/**
 * NavigationButtons - Responsive navigation controls for multi-step workflow
 * 
 * Features:
 * - Back/Next/Finish buttons with smart visibility
 * - Disabled states based on workflow conditions
 * - Loading state support
 * - Optional Start Over button
 * - Custom button labels
 * - Mobile-friendly responsive layout
 * - Full keyboard and screen reader support
 * 
 * @example
 * ```tsx
 * <NavigationButtons
 *   currentStep={2}
 *   canGoBack={true}
 *   canGoNext={uploadedImage !== null}
 *   onBack={handleBack}
 *   onNext={handleNext}
 *   isLoading={isProcessing}
 * />
 * ```
 */
export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onFinish,
  onStartOver,
  isLoading = false,
  nextLabel = 'NEXT',
  backLabel = 'BACK',
  finishLabel = 'DOWNLOAD',
}) => {
  const isLastStep = currentStep === 3;
  const buttonsDisabled = isLoading;

  return (
    <>
      {/* Back button */}
      {onBack && canGoBack && (
        <button
          type="button"
          className="nav-btn"
          onClick={onBack}
          disabled={buttonsDisabled}
        >
          <span>← {backLabel}</span>
        </button>
      )}

      {/* Next/Finish button */}
      {isLastStep && onFinish ? (
        <button
          type="button"
          className="nav-btn"
          onClick={onFinish}
          disabled={buttonsDisabled}
        >
          <span>{isLoading ? 'PROCESSING...' : finishLabel}</span>
        </button>
      ) : (
        onNext && (
          <button
            type="button"
            className="nav-btn"
            onClick={onNext}
            disabled={!canGoNext || buttonsDisabled}
          >
            <span>{isLoading ? 'LOADING...' : `${nextLabel} →`}</span>
          </button>
        )
      )}

      {/* Start Over button */}
      {onStartOver && (
        <button
          type="button"
          className="start-over-btn"
          onClick={onStartOver}
          disabled={buttonsDisabled}
        >
          Start Over
        </button>
      )}
    </>
  );
};
