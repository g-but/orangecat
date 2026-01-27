'use client';

/**
 * PROFILE WIZARD (REFACTORED)
 *
 * Multi-step profile setup wizard with progress tracking.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { Form } from '@/components/ui/form';
import { useProfileWizard } from './hooks';
import {
  BasicsStep,
  LocationStep,
  BioStep,
  WalletsStep,
  WizardHeader,
  StepNavigation,
  WizardFooter,
} from './components';
import type { ProfileWizardProps } from './types';

export default function ProfileWizard({
  profile,
  userId: _userId,
  userEmail,
  onSave,
  onCancel,
}: ProfileWizardProps) {
  const {
    currentStep,
    isSaving,
    form,
    steps,
    currentStepData,
    handleNext,
    handlePrevious,
    canProceed,
    calculateProgress,
  } = useProfileWizard(profile, userEmail, onSave);

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'basics':
        return <BasicsStep form={form} />;
      case 'location':
        return <LocationStep form={form} />;
      case 'bio':
        return <BioStep form={form} />;
      case 'wallets':
        return <WalletsStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with Progress */}
        <WizardHeader progress={calculateProgress()} onCancel={onCancel} />

        {/* Step Navigation */}
        <StepNavigation steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form className="max-w-2xl mx-auto">{renderStepContent()}</form>
          </Form>
        </div>

        {/* Footer with Navigation */}
        <WizardFooter
          currentStep={currentStep}
          steps={steps}
          isSaving={isSaving}
          canProceed={canProceed()}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
