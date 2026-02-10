'use client';

/**
 * ONBOARDING FLOW (REFACTORED)
 *
 * Multi-step onboarding wizard for new users.
 * Split into smaller subcomponents and hooks for maintainability.
 *
 * Context-aware: Adapts messaging based on user's actual state
 */

import { useMemo } from 'react';
import { Sparkles, Layers, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress } from './hooks';
import {
  WelcomeStep,
  CreateProjectStep,
  ExploreStep,
  OnboardingHeader,
  OnboardingNavigation,
  StepIndicators,
  StepContent,
} from './components';
import type { OnboardingStep } from './types';

export function OnboardingFlow() {
  const { user } = useAuth();

  // Build steps — wallet setup is deferred to dashboard journey
  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: 'Welcome to OrangeCat! 🟠',
        description: 'Create a project and start receiving Bitcoin funding',
        icon: Sparkles,
        content: <WelcomeStep />,
      },
      {
        id: 'create-project',
        title: 'Create Your First Project',
        description: 'Pick what you want to build — you can always add more later',
        icon: Layers,
        content: <CreateProjectStep />,
      },
      {
        id: 'explore',
        title: 'Explore & Connect',
        description: 'Discover projects, meet the community, and find your people',
        icon: Compass,
        content: <ExploreStep />,
      },
    ],
    []
  );

  const {
    currentStep,
    completedSteps,
    completingOnboarding,
    handleNext,
    handlePrevious,
    handleSkip,
    handleAction,
    handleCompleteOnboarding,
    setCurrentStep,
  } = useOnboardingProgress(steps, user?.id);

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <OnboardingHeader
          currentStep={currentStep}
          totalSteps={steps.length}
          progress={progress}
          onSkip={handleSkip}
        />

        <StepContent step={steps[currentStep]} stepIndex={currentStep} />

        <OnboardingNavigation
          currentStep={currentStep}
          steps={steps}
          completingOnboarding={completingOnboarding}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onAction={handleAction}
          onComplete={handleCompleteOnboarding}
        />

        <StepIndicators
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
      </div>
    </div>
  );
}
