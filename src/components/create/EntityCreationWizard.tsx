/**
 * ENTITY CREATION WIZARD
 *
 * Generic multi-step wizard for creating any entity with progressive disclosure.
 * Reduces cognitive load by showing only relevant fields at each step.
 *
 * Features:
 * - Configurable steps via EntityConfig.wizardConfig
 * - Per-step validation
 * - Auto-save across all steps
 * - Framer-motion transitions
 * - Skip optional steps
 * - Template selection step (optional)
 * - Template-only flow (template page → form, no wizard steps)
 *
 * This is the SINGLE SOURCE OF TRUTH for ALL entity creation flows.
 * Replaces both wizard flows and simple template→form flows (CreateEntityWorkflow).
 *
 * Modes:
 * 1. Full Wizard: wizardConfig.enabled && wizardConfig.steps.length > 0
 * 2. Template → Form: config.templates exists but no/disabled wizardConfig
 * 3. Simple Form: No templates and no wizardConfig
 *
 * Created: 2026-01-22
 * Last Modified: 2026-01-22
 * Last Modified Summary: Added template-only flow mode to replace CreateEntityWorkflow
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EntityForm } from './EntityForm';
import { WizardTemplatePicker } from './templates/WizardTemplatePicker';
import type { EntityConfig, EntityTemplate, WizardStep } from './types';

// ==================== TYPES ====================

interface EntityCreationWizardProps<T extends Record<string, unknown>> {
  /** Entity configuration with wizardConfig defined */
  config: EntityConfig<T>;
  /** Optional initial data (from URL params, localStorage, etc.) */
  initialData?: Partial<T>;
  /** Callback when entity is successfully created */
  onSuccess?: (data: T & { id: string }) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Build wizard steps from config
 * Prepends template step if configured
 */
function buildWizardSteps<T extends Record<string, unknown>>(
  config: EntityConfig<T>
): WizardStep[] {
  if (!config.wizardConfig?.steps) {
    return [];
  }

  const steps = [...config.wizardConfig.steps];

  // Prepend template step if configured and templates exist
  if (config.wizardConfig.includeTemplateStep && config.templates?.length) {
    steps.unshift({
      id: 'template',
      title: 'Choose Template (Optional)',
      description: 'Start with a pre-built template or create from scratch',
      optional: true,
      fields: [],
    });
  }

  return steps;
}

// ==================== COMPONENT ====================

export function EntityCreationWizard<T extends Record<string, unknown>>({
  config,
  initialData,
  onSuccess,
  onCancel,
}: EntityCreationWizardProps<T>) {
  const router = useRouter();

  // Build steps from config
  const wizardSteps = useMemo(() => buildWizardSteps(config), [config]);

  // Determine the mode based on config
  const hasWizard = config.wizardConfig?.enabled && config.wizardConfig.steps?.length > 0;
  const hasTemplates = (config.templates?.length ?? 0) > 0;
  const isTemplateOnlyMode = !hasWizard && hasTemplates && !initialData;

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<EntityTemplate<T> | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<Partial<T> | undefined>(initialData);
  // Template-only mode: show template selection first, then form
  const [showTemplateSelection, setShowTemplateSelection] = useState(isTemplateOnlyMode);

  const currentStepConfig = wizardSteps[currentStep];
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;
  const isTemplateStep = currentStepConfig?.id === 'template';
  const isLastStep = currentStep === wizardSteps.length - 1;

  // Theme based on config
  const theme = useMemo(() => {
    const themes: Record<string, { gradient: string; ring: string; bg: string }> = {
      orange: {
        gradient: 'from-orange-500 to-amber-500',
        ring: 'ring-orange-100',
        bg: 'bg-orange-500',
      },
      tiffany: {
        gradient: 'from-tiffany to-tiffany-dark',
        ring: 'ring-tiffany-light',
        bg: 'bg-tiffany',
      },
      rose: {
        gradient: 'from-rose-500 to-pink-500',
        ring: 'ring-rose-100',
        bg: 'bg-rose-500',
      },
      blue: {
        gradient: 'from-blue-500 to-indigo-500',
        ring: 'ring-blue-100',
        bg: 'bg-blue-500',
      },
      green: {
        gradient: 'from-green-500 to-emerald-500',
        ring: 'ring-green-100',
        bg: 'bg-green-500',
      },
      purple: {
        gradient: 'from-purple-500 to-violet-500',
        ring: 'ring-purple-100',
        bg: 'bg-purple-500',
      },
      indigo: {
        gradient: 'from-indigo-500 to-blue-500',
        ring: 'ring-indigo-100',
        bg: 'bg-indigo-500',
      },
    };
    return themes[config.colorTheme] || themes.orange;
  }, [config.colorTheme]);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (currentStep < wizardSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, wizardSteps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (currentStepConfig?.optional) {
      handleNext();
    }
  }, [currentStepConfig?.optional, handleNext]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Allow jumping to completed steps or current step
      if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep, completedSteps]
  );

  // Handle template selection (for wizard mode)
  const handleTemplateSelect = useCallback(
    (template: EntityTemplate<T> | null) => {
      setSelectedTemplate(template);
      if (template?.defaults) {
        // Merge template defaults with any existing initial data
        setFormInitialValues(prev => ({
          ...prev,
          ...template.defaults,
        }));
      } else {
        // Starting from scratch - clear template defaults but keep any user-provided initial data
        setFormInitialValues(initialData);
      }
    },
    [initialData]
  );

  // Handle template selection (for template-only mode)
  const handleTemplateOnlySelect = useCallback(
    (template: EntityTemplate<T> | null) => {
      if (template?.defaults) {
        setFormInitialValues({
          ...config.defaultValues,
          ...template.defaults,
        });
      } else {
        // Start from scratch
        setFormInitialValues(config.defaultValues as Partial<T>);
      }
      setShowTemplateSelection(false);
    },
    [config.defaultValues]
  );

  // Handle start from scratch in template-only mode
  const handleStartFromScratch = useCallback(() => {
    setFormInitialValues(config.defaultValues as Partial<T>);
    setShowTemplateSelection(false);
  }, [config.defaultValues]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(config.backUrl);
    }
  }, [onCancel, router, config.backUrl]);

  // Animation variants
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Mode 2: Template-only flow (no wizard, but has templates)
  // Shows template selection page, then transitions to form
  if (showTemplateSelection && isTemplateOnlyMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.pageTitle}</h1>
          <p className="text-gray-600">{config.pageDescription}</p>
        </div>

        <WizardTemplatePicker
          templates={(config.templates || []) as EntityTemplate<T>[]}
          onSelectTemplate={handleTemplateOnlySelect}
          selectedTemplateId={null}
          showStartFromScratch
        />

        <div className="text-center pt-6 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={handleStartFromScratch}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Or start from scratch →
          </button>
        </div>
      </div>
    );
  }

  // Mode 3: Simple form (no wizard, no templates OR template already selected)
  if (!config.wizardConfig?.enabled || wizardSteps.length === 0) {
    return (
      <EntityForm
        config={config}
        initialValues={formInitialValues || initialData}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={handleCancel}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{config.pageTitle}</h1>
          <p className="text-gray-600 mt-1">{config.pageDescription}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {wizardSteps.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStepConfig?.optional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-gray-200" />

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {wizardSteps.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStep;
            const isAccessible = index <= currentStep || completedSteps.has(index);

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!isAccessible}
                className={`flex flex-col items-center gap-2 transition-all ${
                  isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? `${theme.bg} text-white ring-4 ${theme.ring}`
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span
                  className={`text-xs font-medium max-w-[100px] text-center ${
                    isCurrent ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {step.title.split(' (')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait" custom={currentStep}>
          <motion.div
            key={currentStep}
            custom={currentStep}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {isTemplateStep && <Sparkles className="h-6 w-6 text-orange-500" />}
                  <div>
                    <CardTitle>{currentStepConfig.title}</CardTitle>
                    <CardDescription>{currentStepConfig.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Step Content */}
                {isTemplateStep ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Choose a template to get started quickly, or start from scratch with a blank
                      canvas.
                    </p>
                    <WizardTemplatePicker
                      templates={(config.templates || []) as EntityTemplate<T>[]}
                      onSelectTemplate={handleTemplateSelect}
                      selectedTemplateId={selectedTemplate?.id}
                      showStartFromScratch
                    />
                  </div>
                ) : (
                  <EntityForm
                    config={config}
                    initialValues={formInitialValues}
                    onSuccess={onSuccess}
                    wizardMode={{
                      currentStep,
                      totalSteps: wizardSteps.length,
                      visibleFields: currentStepConfig.fields,
                      // Don't pass onNext on the last step - EntityForm will show submit button
                      onNext: !isLastStep ? handleNext : undefined,
                      onPrevious: currentStep > 0 ? handlePrevious : undefined,
                      onSkip: currentStepConfig.optional ? handleSkip : undefined,
                      isLastStep,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation - Only show for template step (EntityForm handles its own navigation in wizard mode) */}
        {isTemplateStep && (
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStepConfig.optional && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}

              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
