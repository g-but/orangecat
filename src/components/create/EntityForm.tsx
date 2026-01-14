'use client';

/**
 * UNIFIED ENTITY FORM COMPONENT
 *
 * Modular, reusable form component for creating/editing any entity type.
 * Integrates with DynamicSidebar for contextual guidance.
 *
 * Features:
 * - Type-safe form handling
 * - Field-level validation
 * - Contextual guidance sidebar
 * - Responsive two-column layout
 * - Consistent UX across all entity types
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial unified entity form implementation
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ZodError } from 'zod';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import { FormField } from './FormField';
import { GuidancePanel } from './GuidancePanel';
import { TemplatePicker } from './templates/TemplatePicker';
import type { EntityConfig, FormState, EntityTemplate } from './types';

// ==================== COMPONENT ====================

interface EntityFormProps<T extends Record<string, any>> {
  config: EntityConfig<T>;
  initialValues?: Partial<T>;
  onSuccess?: (data: T & { id: string }) => void;
  onError?: (error: string) => void;
  mode?: 'create' | 'edit';
  entityId?: string;
}

export function EntityForm<T extends Record<string, any>>({
  config,
  initialValues,
  onSuccess,
  onError,
  mode = 'create',
  entityId,
}: EntityFormProps<T>) {
  const { user, isLoading: authLoading, hydrated } = useAuth();
  const router = useRouter();
  const userCurrency = useUserCurrency();

  // Initialize form data with user's currency preference if currency field exists
  const initialFormData = useMemo(() => {
    const data = { ...config.defaultValues, ...initialValues } as T;
    // Always use user's preferred currency as default if currency field exists
    // Only override if initialValues explicitly provides a currency (e.g., when editing)
    if ('currency' in data) {
      // If no currency is explicitly provided in initialValues, use user's preference
      if (
        !initialValues?.currency &&
        (data.currency === undefined || data.currency === null || data.currency === '')
      ) {
        (data as any).currency = userCurrency;
      }
      // If initialValues has currency, keep it (for edit mode)
    }
    return data;
  }, [config.defaultValues, initialValues, userCurrency]);

  // Form state
  const [formState, setFormState] = useState<FormState<T>>({
    data: initialFormData,
    errors: {},
    isSubmitting: false,
    isDirty: false,
    activeField: null,
  });

  // Allow callers to re-prefill the form (e.g., templates)
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      data: { ...config.defaultValues, ...initialValues } as T,
      errors: {},
      isDirty: false,
      activeField: null,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, config.defaultValues]);

  // Color theme mapping
  const themeColors = useMemo(
    () => ({
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
    }),
    []
  );

  const theme = themeColors[config.colorTheme];

  // Field change handler
  const handleFieldChange = useCallback(
    (field: keyof T, value: any) => {
      const updatedData = { ...formState.data, [field]: value };

      // Auto-generate slug from name for groups
      if (field === 'name' && config.type === 'group') {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
          .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        (updatedData as Record<string, unknown>).slug = slug;
      }

      setFormState(prev => ({
        ...prev,
        data: updatedData,
        errors: { ...prev.errors, [field as string]: '' },
        isDirty: true,
      }));
    },
    [formState.data, config.type]
  );

  // Field focus handler
  const handleFieldFocus = useCallback((field: string) => {
    setFormState(prev => ({ ...prev, activeField: field }));
  }, []);

  // Template selection handler - fills form with template data
  const handleTemplateSelect = useCallback(
    (template: EntityTemplate<T>) => {
      const templateData: Partial<T> = {
        ...initialFormData,
        ...template.defaults,
      };
      setFormState(prev => ({
        ...prev,
        data: { ...prev.data, ...templateData } as T,
        isDirty: true,
      }));
      // Scroll to top to show filled form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [config.defaultValues]
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      console.log('EntityForm: handleSubmit called for', config.name);
      console.log('EntityForm: form data before validation:', formState.data);
      console.log('EntityForm: default values:', config.defaultValues);

      try {
        setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

        // Merge form data with defaults to ensure all required fields are present
        const dataToValidate = { ...config.defaultValues, ...formState.data };
        console.log('EntityForm: merged data for validation:', dataToValidate);
        console.log('EntityForm: start_date in merged data:', dataToValidate.start_date);
        console.log('EntityForm: start_date type:', typeof dataToValidate.start_date);

        // Validate with Zod
        const validatedData = config.validationSchema.parse(dataToValidate);
        console.log('EntityForm: validation passed, validated data:', validatedData);
        console.log('EntityForm: start_date in validated data:', validatedData.start_date);
        console.log('EntityForm: data being sent to API:', JSON.stringify(validatedData, null, 2));

        // API call
        const url =
          mode === 'edit' && entityId ? `${config.apiEndpoint}/${entityId}` : config.apiEndpoint;

        const response = await fetch(url, {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies so server can read auth session
          body: JSON.stringify(validatedData),
        });

        if (!response.ok) {
          let errorMessage = `Failed to ${mode} ${config.name.toLowerCase()}`;
          try {
            // Clone response to read it multiple times if needed
            const responseClone = response.clone();
            const errorData = await responseClone.json();
            console.error(
              'EntityForm: Full API error response:',
              JSON.stringify(errorData, null, 2)
            );
            // Check for different error response formats
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.error?.code) {
              errorMessage = `${errorData.error.code}: ${errorData.error.message || 'Unknown error'}`;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.error) {
              errorMessage = JSON.stringify(errorData.error);
            }
          } catch (e) {
            // If response isn't JSON, get text
            try {
              const responseClone = response.clone();
              const text = await responseClone.text();
              console.error('EntityForm: API error (non-JSON):', text);
              errorMessage = text || errorMessage;
            } catch (textError) {
              console.error('EntityForm: Could not read error response:', textError);
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        // Show success toast
        toast.success(`${config.name} ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
          description:
            mode === 'create'
              ? `Your ${config.name.toLowerCase()} "${result.data?.title || result.data?.name || ''}" has been created.`
              : `Your changes have been saved.`,
          duration: 4000,
        });

        // Success callback
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          // Default: redirect to success URL with dynamic placeholder replacement
          // Supports both :field and [field] patterns
          let redirectUrl = config.successUrl;
          if (result.data) {
            // Replace :field patterns (e.g., :id, :slug)
            redirectUrl = redirectUrl.replace(/:(\w+)/g, (_, field) => result.data[field] || '');
            // Replace [field] patterns (e.g., [id], [slug])
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
          setFormState(prev => ({ ...prev, errors: fieldErrors, isSubmitting: false }));
        } else {
          const errorMsg =
            error instanceof Error
              ? error.message
              : `Failed to ${mode} ${config.name.toLowerCase()}`;
          setFormState(prev => ({
            ...prev,
            errors: { general: errorMsg },
            isSubmitting: false,
          }));

          // Show error toast
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
    [config, formState.data, mode, entityId, onSuccess, onError, router]
  );

  // Check visibility conditions for fields
  const isFieldVisible = useCallback(
    (field: { showWhen?: { field: string; value: string | string[] | boolean } }) => {
      if (!field.showWhen) {
        return true;
      }
      const { field: condField, value: condValue } = field.showWhen;
      const currentValue = formState.data[condField as keyof T];

      if (Array.isArray(condValue)) {
        return condValue.includes(currentValue as string);
      }
      return currentValue === condValue;
    },
    [formState.data]
  );

  // Check visibility conditions for field groups
  const isGroupVisible = useCallback(
    (group: { conditionalOn?: { field: string; value: string | string[] } }) => {
      if (!group.conditionalOn) {
        return true;
      }
      const { field: condField, value: condValue } = group.conditionalOn;
      const currentValue = formState.data[condField as keyof T];

      if (Array.isArray(condValue)) {
        return condValue.includes(currentValue as string);
      }
      return currentValue === condValue;
    },
    [formState.data]
  );

  // Loading state
  if (!hydrated || authLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  if (!user) {
    return null; // Auth redirect handled by layout
  }

  const Icon = config.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme.bg} via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8`}
    >
      {/* Header */}
      <div className="mb-6">
        <Link
          href={config.backUrl}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {config.namePlural}
        </Link>
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 text-${config.colorTheme}-600`} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Create' : 'Edit'} {config.name}
            </h1>
            <p className="text-gray-600 mt-1">{config.pageDescription}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{mode === 'create' ? config.formTitle : `Edit ${config.name}`}</CardTitle>
              <CardDescription>
                {mode === 'create'
                  ? config.formDescription
                  : `Update your ${config.name.toLowerCase()} details. Changes will be saved when you submit.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Render Field Groups */}
                {config.fieldGroups.map(group => {
                  // Skip hidden groups based on conditionalOn
                  if (!isGroupVisible(group)) {
                    return null;
                  }

                  // Render custom component if provided
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

                  // Render standard fields
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

                            return (
                              <div
                                key={field.name}
                                className={field.colSpan === 2 ? 'md:col-span-2' : ''}
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
                                    field.type === 'currency' && 'currency' in formState.data
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
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Info Banner */}
                {config.infoBanner && (
                  <div
                    className={`rounded-md p-4 ${
                      config.infoBanner.variant === 'warning'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : config.infoBanner.variant === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold mb-2 ${
                        config.infoBanner.variant === 'warning'
                          ? 'text-yellow-900'
                          : config.infoBanner.variant === 'success'
                            ? 'text-green-900'
                            : 'text-blue-900'
                      }`}
                    >
                      {config.infoBanner.title}
                    </h4>
                    <p
                      className={`text-sm ${
                        config.infoBanner.variant === 'warning'
                          ? 'text-yellow-700'
                          : config.infoBanner.variant === 'success'
                            ? 'text-green-700'
                            : 'text-blue-700'
                      }`}
                    >
                      {config.infoBanner.content}
                    </p>
                  </div>
                )}

                {/* General Error */}
                {formState.errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600 text-sm">{formState.errors.general}</p>
                  </div>
                )}

                {/* Template Examples - Show at bottom of form after all fields */}
                {config.templates && config.templates.length > 0 && mode === 'create' && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <TemplatePicker
                      label={config.namePlural}
                      templates={config.templates as EntityTemplate<T>[]}
                      onSelectTemplate={handleTemplateSelect}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={formState.isSubmitting}
                    className={`bg-gradient-to-r ${theme.gradient}`}
                  >
                    {formState.isSubmitting
                      ? `${mode === 'create' ? 'Creating' : 'Saving'}...`
                      : `${mode === 'create' ? 'Create' : 'Save'} ${config.name}`}
                  </Button>
                  <Link href={config.backUrl}>
                    <Button variant="outline" disabled={formState.isSubmitting}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Guidance Sidebar */}
        <div className="lg:col-span-1">
          <GuidancePanel
            activeField={formState.activeField}
            guidanceContent={config.guidanceContent}
            defaultGuidance={config.defaultGuidance}
          />
        </div>
      </div>
    </div>
  );
}
