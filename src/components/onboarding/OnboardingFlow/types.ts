/**
 * ONBOARDING FLOW TYPES
 * Shared types for the onboarding wizard
 */

import type { ComponentType } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  content: React.ReactNode;
  action?: {
    label: string;
    href: string;
    primary?: boolean;
  };
}

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  lastUpdated: string;
}

export interface OnboardingState {
  currentStep: number;
  completedSteps: Set<number>;
  completingOnboarding: boolean;
  isInitialized: boolean;
}

export interface OnboardingActions {
  handleNext: () => void;
  handlePrevious: () => void;
  handleSkip: () => Promise<void>;
  handleAction: (href: string) => void;
  handleCompleteOnboarding: () => Promise<void>;
  setCurrentStep: (step: number) => void;
}
