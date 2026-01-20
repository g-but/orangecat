/**
 * PROJECT CREATION WIZARD
 *
 * Multi-step wizard for creating projects with progressive disclosure.
 * Reduces cognitive load by showing only relevant fields at each step.
 *
 * Features:
 * - 4-step guided flow
 * - Per-step validation
 * - Auto-save across all steps
 * - Framer-motion transitions
 * - Skip optional steps
 *
 * Created: 2026-01-16
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { projectConfig } from '@/config/entity-configs/project-config';
import { EntityForm } from './EntityForm';
import type { ProjectData } from '@/lib/validation';

// ==================== TYPES ====================

interface WizardStep {
  id: string;
  title: string;
  description: string;
  optional?: boolean;
  fields: string[]; // Field names to show in this step
}

interface ProjectCreationWizardProps {
  initialData?: Partial<ProjectData>;
  onSuccess?: (data: ProjectData & { id: string }) => void;
  onCancel?: () => void;
}

// ==================== STEPS CONFIGURATION ====================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'template',
    title: 'Choose Template (Optional)',
    description: 'Start with a pre-built template or create from scratch',
    optional: true,
    fields: [], // Template selector only
  },
  {
    id: 'basic',
    title: 'Basic Information',
    description: "Name your project and describe what you're funding",
    optional: false,
    fields: ['title', 'description'],
  },
  {
    id: 'funding',
    title: 'Funding Details',
    description: 'Set your goal and Bitcoin payment addresses',
    optional: false,
    fields: ['goal_amount', 'funding_purpose', 'bitcoin_address', 'lightning_address'],
  },
  {
    id: 'advanced',
    title: 'Additional Details',
    description: 'Timeline, website, and other optional information',
    optional: true,
    fields: [
      'website_url',
      'category',
      'tags',
      'start_date',
      'target_completion',
      'show_on_profile',
    ],
  },
];

// ==================== COMPONENT ====================

export function ProjectCreationWizard({
  initialData,
  onSuccess,
  onCancel,
}: ProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const router = useRouter();

  const currentStepConfig = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (currentStepConfig.optional) {
      handleNext();
    }
  }, [currentStepConfig.optional, handleNext]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Allow jumping to completed steps or current step
      if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep, completedSteps]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard/projects');
    }
  }, [onCancel, router]);

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Project</h1>
          <p className="text-gray-600 mt-1">Let's build your Bitcoin-powered project together</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStepConfig.optional && (
              <Badge variant="secondary" className="text-xs">
                Optional
              </Badge>
            )}
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-gray-200" />

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {WIZARD_STEPS.map((step, index) => {
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
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span
                  className={`text-xs font-medium max-w-[100px] text-center ${
                    isCurrent ? 'text-orange-600' : 'text-gray-600'
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
                  {currentStepConfig.id === 'template' && (
                    <Sparkles className="h-6 w-6 text-orange-500" />
                  )}
                  <div>
                    <CardTitle>{currentStepConfig.title}</CardTitle>
                    <CardDescription>{currentStepConfig.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Step Content */}
                {currentStepConfig.id === 'template' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Choose a template to get started quickly, or skip to create from scratch.
                    </p>
                    {/* TODO: Add TemplatePicker component */}
                    <div className="text-center py-12 text-gray-500">
                      Template selection will appear here
                    </div>
                  </div>
                ) : (
                  <EntityForm
                    config={projectConfig}
                    initialValues={initialData}
                    onSuccess={onSuccess}
                    wizardMode={{
                      currentStep,
                      totalSteps: WIZARD_STEPS.length,
                      visibleFields: currentStepConfig.fields,
                      onNext: handleNext,
                      onPrevious: currentStep > 0 ? handlePrevious : undefined,
                      onSkip: currentStepConfig.optional ? handleSkip : undefined,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStepConfig.optional && currentStep < WIZARD_STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button className="bg-orange-600 hover:bg-orange-700">
                Create Project
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
