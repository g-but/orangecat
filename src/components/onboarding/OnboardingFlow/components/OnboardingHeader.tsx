/**
 * ONBOARDING HEADER COMPONENT
 * Header with title and progress bar
 */

import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  progress: number;
  onSkip: () => void;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  progress,
  onSkip,
}: OnboardingHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to OrangeCat</h1>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Let's get you set up to receive Bitcoin funding for your projects.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip Tour
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </>
  );
}
