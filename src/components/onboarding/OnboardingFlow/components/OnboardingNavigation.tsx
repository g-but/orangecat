/**
 * ONBOARDING NAVIGATION COMPONENT
 * Navigation buttons for stepping through the onboarding flow
 */

import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import type { OnboardingStep } from '../types';

interface OnboardingNavigationProps {
  currentStep: number;
  steps: OnboardingStep[];
  completingOnboarding: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onAction: (href: string) => void;
  onComplete: () => void;
}

export function OnboardingNavigation({
  currentStep,
  steps,
  completingOnboarding,
  onNext,
  onPrevious,
  onAction,
  onComplete,
}: OnboardingNavigationProps) {
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="w-full sm:w-auto"
      >
        Previous
      </Button>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {currentStepData.action && (
          <Button
            onClick={() => onAction(currentStepData.action!.href)}
            variant={currentStepData.action.primary ? 'primary' : 'outline'}
            className="w-full sm:w-auto"
          >
            {currentStepData.action.label}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {!isLastStep && (
          <Button onClick={onNext} className="w-full sm:w-auto">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {isLastStep && (
          <Button
            onClick={onComplete}
            disabled={completingOnboarding}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          >
            {completingOnboarding ? 'Setting up...' : 'Get Started'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
