'use client';

/**
 * ONBOARDING FLOW (REFACTORED)
 *
 * Multi-step onboarding wizard for new users.
 * Split into smaller subcomponents and hooks for maintainability.
 *
 * Context-aware: Adapts messaging based on user's actual state.
 * OnboardingContext lets step components navigate away while
 * ensuring onboarding_completed is persisted first.
 */

import { useMemo } from 'react';
import { Sparkles, Layers, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress } from './hooks';
import { OnboardingContext } from './context';
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
    isInitialized,
    handleNext,
    handlePrevious,
    handleSkip,
    handleAction,
    handleCompleteOnboarding,
    setCurrentStep,
  } = useOnboardingProgress(steps, user?.id);

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Avoid flash — wait for localStorage progress to load
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={{ onNavigateAway: handleAction }}>
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
    </OnboardingContext.Provider>
  );
}
