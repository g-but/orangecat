/**
 * AI ONBOARDING TYPES
 * Shared types for the onboarding wizard
 */

import type { ModelTier } from '@/config/ai-models';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
  canProceed?: boolean;
}

export interface AIOnboardingProps {
  onComplete?: () => void;
  onAddKey?: (params: { provider: string; apiKey: string; keyName: string }) => Promise<any>;
  onUpdatePreferences?: (preferences: Record<string, any>) => Promise<any>;
}

export interface OnboardingState {
  currentStep: number;
  selectedProvider: string | null;
  apiKey: string;
  keyName: string;
  keyValidation: { valid: boolean; message?: string } | null;
  selectedTier: ModelTier;
  autoRouterEnabled: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  keyAdded: boolean;
  copiedUrl: boolean;
}

export interface OnboardingActions {
  setCurrentStep: (step: number) => void;
  setSelectedProvider: (provider: string | null) => void;
  handleApiKeyChange: (value: string) => void;
  setKeyName: (name: string) => void;
  setSelectedTier: (tier: ModelTier) => void;
  setAutoRouterEnabled: (enabled: boolean) => void;
  handleCopyUrl: (url: string) => Promise<void>;
  handleAddKey: () => Promise<void>;
  handleComplete: () => Promise<void>;
  handleNext: () => void;
  handleBack: () => void;
}
