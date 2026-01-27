'use client';

/**
 * AI ONBOARDING (REFACTORED)
 *
 * 5-step wizard for AI setup: provider selection, key management, preferences.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Layers, Key, Lock, Cpu } from 'lucide-react';

import { useOnboardingState } from './hooks';
import {
  WelcomeStep,
  ProviderStep,
  GetKeyStep,
  AddKeyStep,
  ConfigureStep,
  OnboardingHeader,
  OnboardingNavigation,
} from './components';
import { aiOnboardingContent } from '@/lib/ai-guidance';
import type { AIOnboardingProps, OnboardingStep } from './types';

export function AIOnboarding(props: AIOnboardingProps) {
  const state = useOnboardingState(props, 5);

  // Build steps with current state
  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: aiOnboardingContent.welcome.title,
        description: aiOnboardingContent.welcome.description,
        icon: Bot,
        canProceed: true,
        content: <WelcomeStep />,
      },
      {
        id: 'provider',
        title: aiOnboardingContent.provider.title,
        description: aiOnboardingContent.provider.description,
        icon: Layers,
        canProceed: !!state.selectedProvider,
        content: (
          <ProviderStep
            selectedProvider={state.selectedProvider}
            onSelectProvider={state.setSelectedProvider}
          />
        ),
      },
      {
        id: 'getKey',
        title: aiOnboardingContent.getKey.title,
        description: state.provider
          ? `Follow these steps to get your ${state.provider.name} API key.`
          : aiOnboardingContent.getKey.description,
        icon: Key,
        canProceed: !!state.selectedProvider,
        content: (
          <GetKeyStep
            provider={state.provider}
            copiedUrl={state.copiedUrl}
            onCopyUrl={state.handleCopyUrl}
          />
        ),
      },
      {
        id: 'addKey',
        title: aiOnboardingContent.addKey.title,
        description: aiOnboardingContent.addKey.description,
        icon: Lock,
        canProceed: state.keyAdded,
        content: (
          <AddKeyStep
            provider={state.provider}
            apiKey={state.apiKey}
            keyName={state.keyName}
            keyValidation={state.keyValidation}
            keyAdded={state.keyAdded}
            isSubmitting={state.isSubmitting}
            submitError={state.submitError}
            onApiKeyChange={state.handleApiKeyChange}
            onKeyNameChange={state.setKeyName}
            onAddKey={state.handleAddKey}
          />
        ),
      },
      {
        id: 'configure',
        title: aiOnboardingContent.configure.title,
        description: aiOnboardingContent.configure.description,
        icon: Cpu,
        canProceed: true,
        content: (
          <ConfigureStep
            selectedTier={state.selectedTier}
            autoRouterEnabled={state.autoRouterEnabled}
            onTierChange={state.setSelectedTier}
            onAutoRouterChange={state.setAutoRouterEnabled}
          />
        ),
      },
    ],
    [state]
  );

  const currentStepData = steps[state.currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50">
      <OnboardingHeader
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
        currentStepTitle={currentStepData.title}
        progress={state.progress}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Step Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <currentStepData.icon className="w-8 h-8 text-tiffany-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{currentStepData.description}</p>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">{currentStepData.content}</div>

            {/* Navigation */}
            <OnboardingNavigation
              currentStep={state.currentStep}
              totalSteps={state.totalSteps}
              canProceed={currentStepData.canProceed ?? false}
              isSubmitting={state.isSubmitting}
              onBack={state.handleBack}
              onNext={state.handleNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AIOnboarding;
