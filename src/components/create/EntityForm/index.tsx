'use client';

/**
 * UNIFIED ENTITY FORM COMPONENT (REFACTORED)
 *
 * Modular, reusable form component for creating/editing any entity type.
 * Split into smaller subcomponents for maintainability.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ZodError } from 'zod';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { FormField } from '../FormField';
import { GuidancePanel } from '../GuidancePanel';
import { TemplatePicker } from '../templates/TemplatePicker';
import { AIPrefillBar } from '../AIPrefillBar';
import type { EntityConfig, EntityTemplate } from '../types';
import { logger } from '@/utils/logger';

import { useEntityFormState } from './hooks/useEntityFormState';
import { useFieldVisibility } from './hooks/useFieldVisibility';
import { FormHeader } from './components/FormHeader';
import { FormInfoBanner } from './components/FormInfoBanner';
import { FormActions } from './components/FormActions';
import { AIGeneratedIndicator } from './components/AIGeneratedIndicator';

// Theme colors configuration
const THEME_COLORS = {
  orange: {
    gradient: 'from-orange-600 to-orange-700',
    focus: 'focus:ring-orange-500',
    bg: 'from-orange-50/30',
  },
  tiffany: {
    gradient: 'from-tiffany-600 to-tiffany-700',
    focus: 'focus:ring-tiffany-500',
    bg: 'from-tiffany-50/30',
  },
  rose: {
    gradient: 'from-rose-600 to-rose-700',
    focus: 'focus:ring-rose-500',
    bg: 'from-rose-50/30',
  },
  blue: {
    gradient: 'from-blue-600 to-blue-700',
    focus: 'focus:ring-blue-500',
    bg: 'from-blue-50/30',
  },
  green: {
    gradient: 'from-green-600 to-green-700',
    focus: 'focus:ring-green-500',
    bg: 'from-green-50/30',
  },
  purple: {
    gradient: 'from-purple-600 to-purple-700',
    focus: 'focus:ring-purple-500',
    bg: 'from-purple-50/30',
  },
  indigo: {
    gradient: 'from-indigo-600 to-indigo-700',
    focus: 'focus:ring-indigo-500',
    bg: 'from-indigo-50/30',
  },
} as const;

interface WizardMode {
  currentStep: number;
  totalSteps: number;
  visibleFields: string[];
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isLastStep?: boolean;
}

interface EntityFormProps<T extends Record<string, unknown>> {
  config: EntityConfig<T>;
  initialValues?: Partial<T>;
  onSuccess?: (data: T & { id: string }) => void;
  onError?: (error: string) => void;
  mode?: 'create' | 'edit';
  entityId?: string;
  wizardMode?: WizardMode;
}

export function EntityForm<T extends Record<string, unknown>>({
  config,
  initialValues,
  onSuccess,
  onError,
  mode = 'create',
  entityId,
  wizardMode,
}: EntityFormProps<T>) {
  const { user, isLoading: authLoading, hydrated } = useAuth();
  const router = useRouter();
  const userCurrency = useUserCurrency();

  const {
    formState,
    aiGeneratedFields,
    lastSavedAt,
    initialFormData,
    handleFieldChange,
    handleFieldFocus,
    handleAIPrefill,
    clearDraft,
    setSubmitting,
    setErrors,
    formatRelativeTime,
  } = useEntityFormState({
    config,
    initialValues,
    userCurrency,
    userId: user?.id,
    mode,
  });

  const { isFieldVisible, isGroupVisible, visibleFieldGroups } = useFieldVisibility({
    formData: formState.data,
    fieldGroups: config.fieldGroups,
    wizardMode,
  });

  const theme = THEME_COLORS[config.colorTheme];

  // Template selection handler
  const handleTemplateSelect = useCallback(
    (template: EntityTemplate<T>) => {
      handleFieldChange('__template__' as keyof T, { ...initialFormData, ...template.defaults });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [initialFormData, handleFieldChange]
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        setSubmitting(true);

        const dataToValidate = { ...config.defaultValues, ...formState.data };
        const validatedData = config.validationSchema.parse(dataToValidate);

        const url =
          mode === 'edit' && entityId ? `${config.apiEndpoint}/${entityId}` : config.apiEndpoint;

        const response = await fetch(url, {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
          let errorMessage = `Failed to ${mode} ${config.name.toLowerCase()}`;
          try {
            const errorData = await response.clone().json();
            logger.error('EntityForm: API error response', { errorData }, 'EntityForm');
            errorMessage =
              errorData.error?.message || errorData.message || errorData.error || errorMessage;
          } catch {
            try {
              const text = await response.clone().text();
              logger.error('EntityForm: API error (non-JSON)', { text }, 'EntityForm');
              errorMessage = text || errorMessage;
            } catch (textError) {
              logger.error(
                'EntityForm: Could not read error response',
                { textError },
                'EntityForm'
              );
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (mode === 'create') {
          clearDraft();
        }

        toast.success(`${config.name} ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
          description:
            mode === 'create'
              ? `Your ${config.name.toLowerCase()} "${result.data?.title || result.data?.name || ''}" has been created.`
              : 'Your changes have been saved.',
          duration: 4000,
        });

        if (onSuccess) {
          onSuccess(result.data);
        } else {
          let redirectUrl = config.successUrl;
          if (result.data) {
            redirectUrl = redirectUrl.replace(/:(\w+)/g, (_, field) => result.data[field] || '');
            redirectUrl = redirectUrl.replace(/\[(\w+)\]/g, (_, field) => result.data[field] || '');
          }
          router.push(redirectUrl);
        }
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach(err => {
            const path = err.path[0] as string;
            fieldErrors[path] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          const errorMsg =
            error instanceof Error
              ? error.message
              : `Failed to ${mode} ${config.name.toLowerCase()}`;
          setErrors({ general: errorMsg });

          toast.error(`Failed to ${mode} ${config.name.toLowerCase()}`, {
            description: errorMsg,
            duration: 5000,
          });

          if (onError) {
            onError(errorMsg);
          }
        }
      }
    },
    [
      config,
      formState.data,
      mode,
      entityId,
      onSuccess,
      onError,
      router,
      clearDraft,
      setSubmitting,
      setErrors,
    ]
  );

  if (!hydrated || authLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const Icon = config.icon;

  return (
    <div
      className={
        wizardMode
          ? ''
          : `min-h-screen bg-gradient-to-br ${theme.bg} via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8`
      }
    >
      {!wizardMode && (
        <FormHeader
          icon={Icon}
          colorTheme={config.colorTheme}
          name={config.name}
          namePlural={config.namePlural}
          pageDescription={config.pageDescription}
          backUrl={config.backUrl}
          mode={mode}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{mode === 'create' ? config.formTitle : `Edit ${config.name}`}</CardTitle>
              <CardDescription>
                {mode === 'create'
                  ? config.formDescription
                  : `Update your ${config.name.toLowerCase()} details.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {mode === 'create' && !wizardMode && (
                  <AIPrefillBar
                    entityType={config.type}
                    onPrefill={handleAIPrefill}
                    disabled={formState.isSubmitting}
                    existingData={formState.data}
                  />
                )}

                {visibleFieldGroups.map(group => {
                  if (!isGroupVisible(group)) {
                    return null;
                  }

                  if (group.customComponent) {
                    const CustomComponent = group.customComponent;
                    return (
                      <div key={group.id} className="space-y-4">
                        <CustomComponent
                          formData={formState.data}
                          onFieldChange={handleFieldChange}
                          disabled={formState.isSubmitting}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={group.id} className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                      </div>

                      {group.fields && group.fields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.fields.map(field => {
                            if (!isFieldVisible(field)) {
                              return null;
                            }

                            const isAIGenerated = aiGeneratedFields.fields.has(field.name);
                            const aiConfidence = aiGeneratedFields.confidence[field.name] || 0.7;

                            return (
                              <div
                                key={field.name}
                                className={`${field.colSpan === 2 ? 'md:col-span-2' : ''} ${isAIGenerated ? 'relative' : ''}`}
                              >
                                {isAIGenerated && (
                                  <AIGeneratedIndicator confidence={aiConfidence} />
                                )}
                                <div
                                  className={
                                    isAIGenerated ? 'ring-1 ring-purple-200 rounded-md p-0.5' : ''
                                  }
                                >
                                  <FormField
                                    config={field}
                                    value={formState.data[field.name as keyof T]}
                                    error={formState.errors[field.name]}
                                    onChange={value =>
                                      handleFieldChange(field.name as keyof T, value)
                                    }
                                    onFocus={() => handleFieldFocus(field.name)}
                                    disabled={formState.isSubmitting}
                                    currency={
                                      'currency' in formState.data
                                        ? (formState.data.currency as string)
                                        : undefined
                                    }
                                    onCurrencyChange={
                                      field.type === 'currency' && 'currency' in formState.data
                                        ? currency =>
                                            handleFieldChange('currency' as keyof T, currency)
                                        : undefined
                                    }
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {config.infoBanner && <FormInfoBanner banner={config.infoBanner} />}

                {formState.errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600 text-sm">{formState.errors.general}</p>
                  </div>
                )}

                {config.templates &&
                  config.templates.length > 0 &&
                  mode === 'create' &&
                  !wizardMode && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <TemplatePicker
                        label={config.namePlural}
                        templates={config.templates as EntityTemplate<T>[]}
                        onSelectTemplate={handleTemplateSelect}
                      />
                    </div>
                  )}

                <FormActions
                  isSubmitting={formState.isSubmitting}
                  mode={mode}
                  entityName={config.name}
                  backUrl={config.backUrl}
                  theme={theme}
                  wizardMode={wizardMode}
                  lastSavedAt={lastSavedAt}
                  formatRelativeTime={formatRelativeTime}
                />
              </form>
            </CardContent>
          </Card>
        </div>

        {!wizardMode && (
          <div className="lg:col-span-1">
            <GuidancePanel
              activeField={formState.activeField}
              guidanceContent={config.guidanceContent}
              defaultGuidance={config.defaultGuidance}
            />
          </div>
        )}
      </div>
    </div>
  );
}
