import React from 'react';
import type { Step } from '@/hooks/useStepWorkflow';

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
}) => {
  const isCompleted = (stepNum: Step) => completedSteps.includes(stepNum);
  const isActive = (stepNum: Step) => stepNum <= currentStep;
  const isClickable = (stepNum: Step) => isCompleted(stepNum) && onStepClick !== undefined;

  const handleStepClick = (stepNum: Step) => {
    if (isClickable(stepNum)) {
      onStepClick?.(stepNum);
    }
  };

  return (
    <div className="progress-row">
      {steps.map((step) => {
        const active = isActive(step.number);
        const clickable = isClickable(step.number);
        const className = active ? 'progress' : 'progress disabled';

        return clickable ? (
          <button
            key={step.number}
            type="button"
            className={className}
            onClick={() => handleStepClick(step.number)}
          >
            <span>{step.number}.{step.label.toUpperCase()}</span>
          </button>
        ) : (
          <div key={step.number} className={className}>
            <span>{step.number}.{step.label.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
};
