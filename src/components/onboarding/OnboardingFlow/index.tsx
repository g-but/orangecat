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
import { Sparkles, Bitcoin, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress } from './hooks';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
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
  const { user, profile } = useAuth();

  // Derive user state from profile
  const hasWallet = Boolean(profile?.bitcoin_address || profile?.lightning_address);
  const hasProjects = Boolean(profile?.project_count && profile.project_count > 0);

  // Build steps with their content - context-aware
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
        id: 'wallet-setup',
        title: 'Add Your Bitcoin Address',
        description: 'Paste your Bitcoin address to receive funds',
        icon: Bitcoin,
        content: <WalletSetupStep />,
        action: {
          label: 'Add My Bitcoin Address',
          href: ENTITY_REGISTRY.wallet.basePath,
        },
      },
      {
        id: 'get-started',
        title: 'Ready to Start Your Journey?',
        description: 'Choose your first action and begin building with OrangeCat',
        icon: TrendingUp,
        content: <GetStartedStep hasWallet={hasWallet} hasProjects={hasProjects} />,
      },
    ],
    [hasWallet, hasProjects]
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
