import React from 'react';
import type { Step } from '@/hooks/useStepWorkflow';
import { Check } from '@mui/icons-material';

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
      <nav
        role="navigation"
        aria-label={`Progress: Step ${currentStep} of ${steps.length}`}
        className="step-progress-compact"
      >
        <div className="text-center py-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep} of {steps.length}
          </div>
          <div className="text-base font-medium text-gray-900 dark:text-gray-100">
            {current?.label}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      role="navigation"
      aria-label={`Progress: Step ${currentStep} of ${steps.length}`}
      className="step-progress"
    >
      <ol className="flex items-center justify-between w-full max-w-2xl mx-auto px-4 py-6">
        {steps.map((step, index) => {
          const stepCompleted = isCompleted(step.number);
          const stepCurrent = isCurrent(step.number);
          const stepFuture = isFuture(step.number);
          const clickable = isClickable(step.number);

          const StepElement = clickable ? 'button' : 'div';
          const stepProps = clickable
            ? {
                onClick: () => handleStepClick(step.number),
                type: 'button' as const,
                'aria-label': `Go back to step ${step.number}: ${step.label}`,
                className: 'step-clickable',
              }
            : {};

          return (
            <li
              key={step.number}
              className="flex-1 relative"
              aria-current={stepCurrent ? 'step' : undefined}
            >
              <div className="flex items-center">
                <StepElement
                  {...stepProps}
                  title={step.title}
                  className={`
                    step-indicator
                    ${clickable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
                  `}
                  data-current={stepCurrent || undefined}
                  data-completed={stepCompleted || undefined}
                  data-future={stepFuture || undefined}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      border-2 transition-all
                      ${stepCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                      ${stepCurrent ? 'bg-blue-500 border-blue-500 text-white ring-2 ring-blue-300' : ''}
                      ${stepFuture ? 'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400' : ''}
                    `}
                  >
                    {stepCompleted ? (
                      <Check className="w-6 h-6" aria-label="Step completed" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-center">
                    <span
                      className={`
                        text-sm font-medium
                        ${stepCurrent ? 'text-blue-600 dark:text-blue-400' : ''}
                        ${stepCompleted ? 'text-green-600 dark:text-green-400' : ''}
                        ${stepFuture ? 'text-gray-500 dark:text-gray-400' : ''}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                </StepElement>

                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 transition-colors"
                    data-connector
                    data-completed={stepCompleted || undefined}
                    style={{
                      backgroundColor: stepCompleted ? '#22c55e' : '#d1d5db',
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
