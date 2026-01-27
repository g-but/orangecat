'use client';

/**
 * ONBOARDING FLOW (REFACTORED)
 *
 * Multi-step onboarding wizard for new users.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { useMemo } from 'react';
import { Sparkles, Bitcoin, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress } from './hooks';
import {
  WelcomeStep,
  WalletSetupStep,
  GetStartedStep,
  OnboardingHeader,
  OnboardingNavigation,
  StepIndicators,
  StepContent,
} from './components';
import type { OnboardingStep } from './types';

export function OnboardingFlow() {
  const { user } = useAuth();

  // Build steps with their content
  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: 'Welcome to OrangeCat! 🟠',
        description: 'Your gateway to Bitcoin-powered crowdfunding and community lending',
        icon: Sparkles,
        content: <WelcomeStep />,
      },
      {
        id: 'wallet-setup',
        title: 'Add Your Bitcoin Address',
        description: 'Paste your Bitcoin address to receive funds',
        icon: Bitcoin,
        content: <WalletSetupStep />,
        action: {
          label: 'Add My Bitcoin Address',
          href: '/dashboard/wallets',
        },
      },
      {
        id: 'get-started',
        title: 'Ready to Start Your Journey?',
        description: 'Choose your first action and begin building with OrangeCat',
        icon: TrendingUp,
        content: <GetStartedStep />,
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
