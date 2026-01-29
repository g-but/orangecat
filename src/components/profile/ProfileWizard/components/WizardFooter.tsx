/**
 * WIZARD FOOTER COMPONENT
 * Navigation buttons and encouragement messages
 */

import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { WizardStep } from '../types';

interface WizardFooterProps {
  currentStep: number;
  steps: WizardStep[];
  isSaving: boolean;
  canProceed: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onCancel: () => void;
}

export function WizardFooter({
  currentStep,
  steps,
  isSaving,
  canProceed,
  onNext,
  onPrevious,
  onCancel,
}: WizardFooterProps) {
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  return (
    <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-orange-50 border-t">
      {/* Progress encouragement */}
      <div className="text-center mb-4">
        <div className="text-sm text-gray-600 mb-2">
          {currentStep === 0 && "🚀 Let's get your profile started!"}
          {currentStep === 1 && '📍 Great! Local supporters will love this.'}
          {currentStep === 2 && '📖 Your story matters - share it!'}
          {isLastStep && '₿ Almost there! Funding awaits.'}
        </div>
        <div className="text-xs text-gray-500">
          {steps.filter((_, i) => i <= currentStep).length} of {steps.length} steps completed
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 0 ? onCancel : onPrevious}
          disabled={isSaving}
          className="px-6"
        >
          {currentStep === 0 ? (
            'Maybe Later'
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </>
          )}
        </Button>

        <div className="flex items-center gap-3">
          {/* Skip option for optional steps */}
          {currentStep > 0 && !currentStepData.required && (
            <Button
              type="button"
              variant="ghost"
              onClick={onNext}
              disabled={isSaving}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </Button>
          )}

          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isSaving}
            className="px-8 py-2 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSaving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Complete Profile
              </>
            ) : (
              <>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Optional encouragement for completion */}
      {isLastStep && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🎉 Completing your profile unlocks funding features and helps you stand out!
          </p>
        </div>
      )}
    </div>
  );
}
