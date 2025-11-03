import React from 'react';
import { Button, Box, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';

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
  nextLabel = 'Next',
  backLabel = 'Back',
  finishLabel = 'Download',
}) => {
  // Determine if we're on the last step (finish instead of next)
  const isLastStep = currentStep === 3;
  
  // All buttons should be disabled when loading
  const buttonsDisabled = isLoading;

  // Check if we have buttons on both sides (for layout purposes)
  const hasLeftButtons = (onBack && canGoBack) || onStartOver;
  const hasRightButtons = (isLastStep && onFinish) || onNext;
  const singleButton = !hasLeftButtons && hasRightButtons;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        width: '100%',
      }}
      role="navigation"
      aria-label="Step navigation"
    >
      {/* Top row: Back and Next/Finish buttons side by side */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: singleButton ? 'center' : 'space-between',
          width: '100%',
        }}
      >
        {/* Back button - only show if we can go back */}
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            disabled={!canGoBack || buttonsDisabled}
            aria-disabled={!canGoBack || buttonsDisabled}
            startIcon={isLoading ? undefined : <ArrowBackIcon />}
            sx={{ flex: '1 1 0' }}
          >
            {backLabel}
          </Button>
        )}

        {/* Next/Finish button */}
        {isLastStep && onFinish ? (
          // Finish button on last step
          <Button
            variant="contained"
            onClick={onFinish}
            disabled={buttonsDisabled}
            aria-disabled={buttonsDisabled}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={{ 
              flex: '1 1 0',
              height: 37,
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              bgcolor: 'primary.light',
              color: 'white',
              '&:hover:not(:disabled)': {
                bgcolor: 'primary.main',
              },
              '&:disabled': {
                bgcolor: 'primary.light',
                color: 'white',
                opacity: 1,
              },
              '&:not(:disabled)': {
                bgcolor: 'primary.main',
              }
            }}
          >
            {isLoading ? 'Processing...' : finishLabel}
          </Button>
        ) : (
          // Next button on intermediate steps
          onNext && (
            <Button
              variant="contained"
              onClick={onNext}
              disabled={!canGoNext || buttonsDisabled}
              aria-disabled={!canGoNext || buttonsDisabled}
              endIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{ 
                flex: '1 1 0',
                height: 37,
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                bgcolor: 'primary.light',
                color: 'white',
                justifyContent: 'center',
                px: 3,
                '&:hover': {
                  bgcolor: 'primary.main',
                },
                '&:disabled': {
                  bgcolor: 'primary.light',
                  opacity: 0.5,
                  color: 'white',
                }
              }}
            >
              {isLoading ? 'Loading...' : nextLabel}
            </Button>
          )
        )}
      </Box>

      {/* Bottom row: Start Over button centered */}
      {onStartOver && (
        <Button
          variant="text"
          onClick={onStartOver}
          disabled={buttonsDisabled}
          aria-disabled={buttonsDisabled}
          startIcon={isLoading ? undefined : <RefreshIcon />}
          sx={{
            color: 'text.secondary',
          }}
        >
          Start Over
        </Button>
      )}
    </Box>
  );
};
