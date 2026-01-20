'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Key,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Shield,
  Zap,
  Layers,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  aiProviders,
  getAIProvider,
  getRecommendedProvider,
  validateApiKeyFormat,
} from '@/data/aiProviders';
import { aiOnboardingContent, tierDescriptions } from '@/lib/ai-guidance';
import { MODEL_TIERS, TIER_CONFIG, type ModelTier } from '@/config/ai-models';

// ==================== TYPES ====================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
  canProceed?: boolean;
}

interface AIOnboardingProps {
  onComplete?: () => void;
  onAddKey?: (params: { provider: string; apiKey: string; keyName: string }) => Promise<any>;
  onUpdatePreferences?: (preferences: Record<string, any>) => Promise<any>;
}

// ==================== MAIN COMPONENT ====================

export function AIOnboarding({ onComplete, onAddKey, onUpdatePreferences }: AIOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // State for each step
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
  const provider = selectedProvider ? getAIProvider(selectedProvider) : null;
  const recommendedProvider = getRecommendedProvider();

  // Validate API key when it changes
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (selectedProvider && value) {
      setKeyValidation(validateApiKeyFormat(selectedProvider, value));
    } else {
      setKeyValidation(null);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

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
        console.error('Failed to save preferences:', error);
      } finally {
        setIsSubmitting(false);
      }
    }

    onComplete?.();
    router.push('/settings/ai');
  }, [onUpdatePreferences, onComplete, router, selectedTier, autoRouterEnabled]);

  // Step content components
  const steps: OnboardingStep[] = [
    // Step 1: Welcome
    {
      id: 'welcome',
      title: aiOnboardingContent.welcome.title,
      description: aiOnboardingContent.welcome.description,
      icon: Bot,
      canProceed: true,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-10 h-10 text-tiffany-600" />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">{aiOnboardingContent.welcome.whyTitle}</h3>
            <p className="text-gray-600">{aiOnboardingContent.welcome.whyContent}</p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 text-left">
            {aiOnboardingContent.welcome.tips?.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-tiffany-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{tip}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="bg-tiffany-50 border border-tiffany-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-tiffany-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-semibold text-tiffany-900 mb-1">Pro Tip</h4>
                <p className="text-tiffany-800 text-sm">
                  We recommend OpenRouter for beginners - one key gives you access to 100+ AI models
                  with simple, prepaid billing.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Step 2: Choose Provider
    {
      id: 'provider',
      title: aiOnboardingContent.provider.title,
      description: aiOnboardingContent.provider.description,
      icon: Layers,
      canProceed: !!selectedProvider,
      content: (
        <div className="space-y-6">
          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiProviders.map(p => (
              <Card
                key={p.id}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-lg p-6',
                  selectedProvider === p.id
                    ? 'ring-2 ring-tiffany-500 border-tiffany-500 bg-tiffany-50/50'
                    : ''
                )}
                onClick={() => setSelectedProvider(p.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {p.name}
                      {p.recommended && (
                        <Badge className="bg-tiffany-100 text-tiffany-700 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {p.type === 'aggregator' ? 'Aggregator' : 'Direct Provider'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      p.difficulty === 'beginner'
                        ? 'border-green-300 text-green-700'
                        : p.difficulty === 'intermediate'
                          ? 'border-yellow-300 text-yellow-700'
                          : 'border-red-300 text-red-700'
                    )}
                  >
                    {p.difficulty}
                  </Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">{p.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {p.supportedModels.slice(0, 3).map(model => (
                    <Badge key={model} variant="outline" className="text-xs text-gray-500">
                      {model}
                    </Badge>
                  ))}
                  {p.supportedModels.length > 3 && (
                    <Badge variant="outline" className="text-xs text-gray-400">
                      +{p.supportedModels.length - 3} more
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-1">
                  {aiOnboardingContent.provider.whyTitle}
                </h4>
                <p className="text-blue-800 text-sm">{aiOnboardingContent.provider.whyContent}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Step 3: Get Your Key
    {
      id: 'getKey',
      title: aiOnboardingContent.getKey.title,
      description: provider
        ? `Follow these steps to get your ${provider.name} API key.`
        : aiOnboardingContent.getKey.description,
      icon: Key,
      canProceed: !!selectedProvider,
      content: provider ? (
        <div className="space-y-6">
          {/* Provider Info */}
          <Card className="p-6 bg-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-tiffany-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-tiffany-600" />
              </div>
              <div>
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="text-sm text-gray-600">
                  {provider.type === 'aggregator' ? 'Aggregator' : 'Direct Provider'} • Setup time:
                  ~{provider.setupTime} min
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Visit {provider.name}</p>
                  <p className="text-xs text-gray-500">Create an account if you do not have one</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Go to API Keys page</p>
                  <p className="text-xs text-gray-500">Usually under Settings or Account</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Create a new API key</p>
                  <p className="text-xs text-gray-500">
                    Name it "OrangeCat" for easy identification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium">Copy your key</p>
                  <p className="text-xs text-gray-500">
                    Keys start with{' '}
                    <code className="bg-gray-200 px-1 rounded">
                      {provider.apiKeyPrefix || 'sk-'}
                    </code>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.open(provider.apiKeyUrl, '_blank')}
                className="bg-tiffany-600 hover:bg-tiffany-700 text-white"
              >
                Open {provider.name}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => handleCopyUrl(provider.apiKeyUrl)}>
                {copiedUrl ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Security Warnings */}
          <div className="space-y-3">
            {aiOnboardingContent.getKey.warnings?.map((warning, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-800">{warning}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Tips
            </h4>
            <ul className="space-y-1">
              {aiOnboardingContent.getKey.tips?.map((tip, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Please select a provider first.</div>
      ),
    },

    // Step 4: Add Your Key
    {
      id: 'addKey',
      title: aiOnboardingContent.addKey.title,
      description: aiOnboardingContent.addKey.description,
      icon: Lock,
      canProceed: keyAdded,
      content: (
        <div className="space-y-6">
          {/* Key Input Form */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Provider Display */}
              {provider && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-tiffany-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-tiffany-600" />
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-gray-500">
                      Key format:{' '}
                      <code className="bg-gray-200 px-1 rounded">{provider.apiKeyExample}</code>
                    </p>
                  </div>
                </div>
              )}

              {/* Key Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name (optional)
                </label>
                <Input
                  type="text"
                  placeholder={`${provider?.name || 'API'} Key`}
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  disabled={keyAdded}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A friendly name to identify this key later
                </p>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder={provider?.apiKeyExample || 'sk-...'}
                  value={apiKey}
                  onChange={e => handleApiKeyChange(e.target.value)}
                  disabled={keyAdded}
                  className={cn(
                    keyValidation && !keyValidation.valid && 'border-red-300 focus:border-red-500'
                  )}
                />
                {keyValidation && !keyValidation.valid && (
                  <p className="text-xs text-red-600 mt-1">{keyValidation.message}</p>
                )}
                {keyValidation?.valid && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Key format looks correct
                  </p>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Success Message */}
              {keyAdded && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Key added successfully!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your key has been encrypted and saved securely.
                  </p>
                </div>
              )}

              {/* Add Key Button */}
              {!keyAdded && (
                <Button
                  onClick={handleAddKey}
                  disabled={!apiKey || !keyValidation?.valid || isSubmitting}
                  className="w-full bg-tiffany-600 hover:bg-tiffany-700 text-white"
                >
                  {isSubmitting ? 'Adding Key...' : 'Add API Key'}
                </Button>
              )}
            </div>
          </Card>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  {aiOnboardingContent.addKey.whyTitle}
                </h4>
                <p className="text-sm text-blue-800">{aiOnboardingContent.addKey.whyContent}</p>
              </div>
            </div>
          </div>

          {/* Encryption Details */}
          <div className="flex flex-wrap gap-3">
            {aiOnboardingContent.addKey.tips?.map((tip, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full"
              >
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // Step 5: Configure Preferences
    {
      id: 'configure',
      title: aiOnboardingContent.configure.title,
      description: aiOnboardingContent.configure.description,
      icon: Cpu,
      canProceed: true,
      content: (
        <div className="space-y-6">
          {/* Auto Router Toggle */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-tiffany-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-tiffany-600" />
                </div>
                <div>
                  <h3 className="font-medium">Auto Router</h3>
                  <p className="text-sm text-gray-600">
                    Automatically selects the best model based on message complexity
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoRouterEnabled}
                onClick={() => setAutoRouterEnabled(!autoRouterEnabled)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  autoRouterEnabled ? 'bg-tiffany-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    autoRouterEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            {autoRouterEnabled && (
              <div className="mt-3 p-3 bg-tiffany-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-tiffany-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-tiffany-700">
                    Simple messages use cheaper models. Complex tasks use more powerful ones. Saves
                    money without sacrificing quality.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Default Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Tier
              {autoRouterEnabled && (
                <span className="text-gray-500 font-normal ml-2">
                  (fallback when auto-router is uncertain)
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {MODEL_TIERS.map(tier => {
                const config = TIER_CONFIG[tier];
                const tierInfo = tierDescriptions[tier];
                const isSelected = selectedTier === tier;

                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-tiffany-500 bg-tiffany-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{config.label}</span>
                      {config.badge && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0">
                          {config.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{tierInfo?.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier Details */}
          {selectedTier && tierDescriptions[selectedTier] && (
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium mb-2">{tierDescriptions[selectedTier].title}</h4>
              <p className="text-sm text-gray-600 mb-3">
                Best for: {tierDescriptions[selectedTier].bestFor}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tierDescriptions[selectedTier].models.map(model => (
                  <Badge key={model} variant="outline" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips
            </h4>
            <ul className="space-y-1">
              {aiOnboardingContent.configure.tips?.map((tip, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-tiffany-50">
      {/* Header */}
      <div className="bg-white border-b border-tiffany-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bot className="w-8 h-8 text-tiffany-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Set Up My AI</h1>
                <p className="text-sm text-gray-600">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/settings/ai')}>
              Skip for Now
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{currentStepData.title}</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
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
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={!currentStepData.canProceed || isSubmitting}
                className="bg-tiffany-600 hover:bg-tiffany-700 text-white"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Complete Setup
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AIOnboarding;
