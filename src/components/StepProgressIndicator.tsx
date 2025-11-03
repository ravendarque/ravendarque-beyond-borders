import React from 'react';
import type { Step } from '@/hooks/useStepWorkflow';
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
      sx={{ 
        py: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 4 },
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 6, sm: 10 },
          margin: 0,
          padding: 0,
          listStyle: 'none',
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
                width: { xs: 80, sm: 120 },
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
                {/* Active step has orange fill + shadow, inactive has peach fill */}
                <Box
                  sx={{
                    width: { xs: 44, sm: 44 },
                    height: { xs: 44, sm: 44 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 5,
                    transition: 'all 0.3s',
                    position: 'relative',
                    ...(stepCurrent && {
                      bgcolor: 'primary.main',
                      borderColor: 'primary.light',
                      color: 'white',
                      boxShadow: '0 4px 0 rgba(204, 106, 41, 1)',
                    }),
                    ...((stepCompleted || stepFuture) && {
                      bgcolor: 'primary.light',
                      borderColor: 'transparent',
                      color: stepFuture ? '#9A9A9A' : 'white',
                    }),
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '1.5rem' },
                    }}
                  >
                    {step.number}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    mt: { xs: 1.5, sm: 2 },
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '1.25rem' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1.2,
                    ...(stepCurrent && {
                      color: 'primary.main',
                    }),
                    ...((stepCompleted || stepFuture) && {
                      color: stepFuture ? '#9A9A9A' : 'primary.main',
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
