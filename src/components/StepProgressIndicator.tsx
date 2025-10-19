import React from 'react';
import type { Step } from '@/hooks/useStepWorkflow';
import { Check } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

export interface StepProgressIndicatorProps {
  /** Current active step (1-3) */
  currentStep: Step;
  
  /** Array of completed step numbers */
  completedSteps: Step[];
  
  /** Step definitions with labels and titles */
  steps: Array<{
    number: Step;
    label: string;
    title: string;
  }>;
  
  /** Callback when a completed step is clicked */
  onStepClick?: (step: Step) => void;
  
  /** Show compact version for mobile */
  compact?: boolean;
}

export const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
  currentStep,
  completedSteps,
  steps,
  onStepClick,
  compact = false,
}) => {
  const isCompleted = (stepNum: Step) => completedSteps.includes(stepNum);
  const isCurrent = (stepNum: Step) => currentStep === stepNum;
  const isFuture = (stepNum: Step) => stepNum > currentStep;
  const isClickable = (stepNum: Step) => isCompleted(stepNum) && onStepClick !== undefined;

  const handleStepClick = (stepNum: Step) => {
    if (isClickable(stepNum)) {
      onStepClick?.(stepNum);
    }
  };

  if (compact) {
    const current = steps.find(s => s.number === currentStep);
    return (
      <Box
        component="nav"
        role="navigation"
        aria-label={`Progress: Step ${currentStep} of ${steps.length}`}
        sx={{ textAlign: 'center', py: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          Step {currentStep} of {steps.length}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {current?.label}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      role="navigation"
      aria-label={`Progress: Step ${currentStep} of ${steps.length}`}
      sx={{ py: 3 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
        component="ol"
      >
        {steps.map((step) => {
          const stepCompleted = isCompleted(step.number);
          const stepCurrent = isCurrent(step.number);
          const stepFuture = isFuture(step.number);
          const clickable = isClickable(step.number);

          return (
            <Box
              key={step.number}
              component="li"
              sx={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 120,
                flexShrink: 0,
              }}
              aria-current={stepCurrent ? 'step' : undefined}
            >
              <Box
                component={clickable ? 'button' : 'div'}
                onClick={clickable ? () => handleStepClick(step.number) : undefined}
                type={clickable ? 'button' : undefined}
                aria-label={clickable ? `Go back to step ${step.number}: ${step.label}` : undefined}
                title={step.title}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: clickable ? 'pointer' : 'default',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  transition: 'transform 0.2s',
                  '&:hover': clickable ? { transform: 'scale(1.05)' } : {},
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 2,
                    transition: 'all 0.3s',
                    ...(stepCompleted && {
                      bgcolor: 'success.main',
                      borderColor: 'success.main',
                      color: 'white',
                    }),
                    ...(stepCurrent && {
                      bgcolor: 'primary.main',
                      borderColor: 'primary.main',
                      color: 'white',
                      boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.2)',
                    }),
                    ...(stepFuture && {
                      bgcolor: 'grey.200',
                      borderColor: 'grey.300',
                      color: 'grey.500',
                    }),
                  }}
                >
                  {stepCompleted ? (
                    <Check sx={{ fontSize: 24 }} aria-label="Step completed" />
                  ) : (
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {step.number}
                    </Typography>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    textAlign: 'center',
                    fontWeight: 500,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.2,
                    ...(stepCurrent && {
                      color: 'primary.main',
                    }),
                    ...(stepCompleted && {
                      color: 'success.main',
                    }),
                    ...(stepFuture && {
                      color: 'text.disabled',
                    }),
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
