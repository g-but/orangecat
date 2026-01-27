/**
 * STEP INDICATORS COMPONENT
 * Dot indicators showing progress through steps
 */

import type { OnboardingStep } from '../types';

interface StepIndicatorsProps {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (index: number) => void;
}

export function StepIndicators({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorsProps) {
  return (
    <div className="flex justify-center mt-8 gap-2">
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => onStepClick(index)}
          className={`w-3 h-3 rounded-full transition-colors ${
            index === currentStep
              ? 'bg-primary'
              : completedSteps.has(index)
                ? 'bg-primary/60'
                : 'bg-gray-300'
          }`}
          aria-label={`Go to step ${index + 1}: ${step.title}`}
        />
      ))}
    </div>
  );
}
