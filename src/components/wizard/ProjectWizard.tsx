/**
 * ProjectWizard Component
 *
 * Simplified project creation form that communicates with parent via callbacks.
 * Form logic extracted to useProjectForm hook, fields to ProjectFormFields.
 *
 * @module components/wizard
 */

'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Rocket, Loader2 } from 'lucide-react';
import { ProjectTemplates } from '@/components/create/templates';
import type { ProjectFieldType } from '@/lib/project-guidance';
import type { ProjectWizardProps } from './types';
import { useProjectForm } from './useProjectForm';
import { ProjectFormFields } from './ProjectFormFields';
import ProjectStatusManager from './ProjectStatusManager';

export function ProjectWizard({
  projectId,
  initialData,
  onSave,
  onCancel,
  onFieldFocus,
  onProgressChange,
  onGoalAmountChange,
  onGoalCurrencyChange,
}: ProjectWizardProps = {}) {
  const router = useRouter();

  const {
    formData,
    errors,
    isSubmitting,
    loadingProject,
    isEditMode,
    editProjectId,
    projectStatus,
    isUpdatingStatus,
    canSubmit,
    updateFormData,
    handleFieldChange,
    handleFieldBlur,
    toggleCategory,
    handleTemplateSelect,
    handleSubmit,
    handleStatusChange,
  } = useProjectForm({
    projectId,
    initialData,
    onSave,
    onProgressChange,
    onGoalAmountChange,
    onGoalCurrencyChange,
  });

  const handleCurrencyChange = (currency: 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS') => {
    updateFormData({ goalCurrency: currency });
  };

  const handleLocalFieldFocus = (field: ProjectFieldType) => {
    if (onFieldFocus) {
      onFieldFocus(field);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Status Controls - Only show in edit mode */}
      {isEditMode && editProjectId && (
        <ProjectStatusManager
          projectId={editProjectId}
          currentStatus={projectStatus}
          isUpdating={isUpdatingStatus}
          onStatusChange={handleStatusChange}
        />
      )}

      <Card className="p-6">
        <ProjectFormFields
          formData={formData}
          errors={errors}
          isEditMode={isEditMode}
          editProjectId={editProjectId}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          onFieldFocus={handleLocalFieldFocus}
          onCurrencyChange={handleCurrencyChange}
          onCategoryToggle={toggleCategory}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => (onCancel ? onCancel() : router.push(ROUTES.DASHBOARD.HOME))}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Project' : 'Create Project'}
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Templates */}
      <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
    </div>
  );
}
