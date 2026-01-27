/**
 * ONBOARDING STATE HOOK
 * Manages all state and handlers for the onboarding wizard
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAIProvider, getRecommendedProvider, validateApiKeyFormat } from '@/data/aiProviders';
import type { ModelTier } from '@/config/ai-models';
import type { AIOnboardingProps, OnboardingState, OnboardingActions } from '../types';

interface UseOnboardingStateReturn extends OnboardingState, OnboardingActions {
  provider: ReturnType<typeof getAIProvider>;
  recommendedProvider: ReturnType<typeof getRecommendedProvider>;
  progress: number;
  totalSteps: number;
}

export function useOnboardingState(
  props: AIOnboardingProps,
  totalSteps: number = 5
): UseOnboardingStateReturn {
  const { onComplete, onAddKey, onUpdatePreferences } = props;
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('');
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; message?: string } | null>(
    null
  );
  const [selectedTier, setSelectedTier] = useState<ModelTier>('economy');
  const [autoRouterEnabled, setAutoRouterEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [keyAdded, setKeyAdded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Get provider data
  const provider = selectedProvider ? getAIProvider(selectedProvider) : undefined;
  const recommendedProvider = getRecommendedProvider();

  // Calculate progress
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Validate API key when it changes
  const handleApiKeyChange = useCallback(
    (value: string) => {
      setApiKey(value);
      if (selectedProvider && value) {
        setKeyValidation(validateApiKeyFormat(selectedProvider, value));
      } else {
        setKeyValidation(null);
      }
    },
    [selectedProvider]
  );

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }, []);

  // Add API key
  const handleAddKey = useCallback(async () => {
    if (!onAddKey || !selectedProvider || !apiKey) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onAddKey({
        provider: selectedProvider,
        apiKey,
        keyName: keyName || `${provider?.name || selectedProvider} Key`,
      });
      setKeyAdded(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add key');
    } finally {
      setIsSubmitting(false);
    }
  }, [onAddKey, selectedProvider, apiKey, keyName, provider?.name]);

  // Complete onboarding
  const handleComplete = useCallback(async () => {
    if (onUpdatePreferences) {
      setIsSubmitting(true);
      try {
        await onUpdatePreferences({
          default_tier: selectedTier,
          auto_router_enabled: autoRouterEnabled,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        });
      } catch (error) {
        // Log error but don't block completion
        console.error('Failed to save preferences:', error);
      } finally {
        setIsSubmitting(false);
      }
    }

    onComplete?.();
    router.push('/settings/ai');
  }, [onUpdatePreferences, onComplete, router, selectedTier, autoRouterEnabled]);

  // Navigation
  const handleNext = useCallback(() => {
    if (currentStep === totalSteps - 1) {
      void handleComplete();
    } else {
      setCurrentStep(Math.min(totalSteps - 1, currentStep + 1));
    }
  }, [currentStep, totalSteps, handleComplete]);

  const handleBack = useCallback(() => {
    setCurrentStep(Math.max(0, currentStep - 1));
  }, [currentStep]);

  return {
    // State
    currentStep,
    selectedProvider,
    apiKey,
    keyName,
    keyValidation,
    selectedTier,
    autoRouterEnabled,
    isSubmitting,
    submitError,
    keyAdded,
    copiedUrl,
    // Derived
    provider,
    recommendedProvider,
    progress,
    totalSteps,
    // Actions
    setCurrentStep,
    setSelectedProvider,
    handleApiKeyChange,
    setKeyName,
    setSelectedTier,
    setAutoRouterEnabled,
    handleCopyUrl,
    handleAddKey,
    handleComplete,
    handleNext,
    handleBack,
  };
}
