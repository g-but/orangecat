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
import { ArrowLeft, Save } from 'lucide-react';
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
import { AIPrefillButton } from './AIPrefillButton';
import type {
  EntityConfig,
  FormState,
  EntityTemplate,
  AIGeneratedFields,
  FieldConfidence,
} from './types';
import { logger } from '@/utils/logger';

// ==================== HELPERS ====================

/**
 * Format a timestamp as relative time (e.g., "2 minutes ago", "1 hour ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) {
    return 'just now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) > 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  }
  return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
}

// ==================== COMPONENT ====================

interface WizardMode {
  currentStep: number;
  totalSteps: number;
  visibleFields: string[];
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isLastStep?: boolean;
}

interface EntityFormProps<T extends Record<string, any>> {
  config: EntityConfig<T>;
  initialValues?: Partial<T>;
  onSuccess?: (data: T & { id: string }) => void;
  onError?: (error: string) => void;
  mode?: 'create' | 'edit';
  entityId?: string;
  wizardMode?: WizardMode;
}

export function EntityForm<T extends Record<string, any>>({
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

  // Draft persistence state
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // AI prefill state - tracks which fields were AI-generated
  const [aiGeneratedFields, setAiGeneratedFields] = useState<AIGeneratedFields>({
    fields: new Set<string>(),
    confidence: {},
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

  // Load draft on mount (only in create mode, not edit mode)
  // Skip draft loading if initialValues has meaningful content (e.g., from URL params/Cat actions)
  useEffect(() => {
    if (mode === 'edit' || !user?.id) {
      return;
    }

    // If initialValues has meaningful content (title or description), skip draft loading
    // This ensures URL params from Cat action buttons take priority over saved drafts
    const hasInitialContent =
      initialValues &&
      (('title' in initialValues && initialValues.title) ||
        ('description' in initialValues && initialValues.description));

    if (hasInitialContent) {
      // Clear any existing draft since user is starting fresh with prefilled data
      const draftKey = `${config.type}-draft-${user.id}`;
      localStorage.removeItem(draftKey);
      return;
    }

    const draftKey = `${config.type}-draft-${user.id}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const { formData, savedAt } = JSON.parse(savedDraft);
        const age = Date.now() - new Date(savedAt).getTime();

        // Expire drafts after 7 days
        if (age < 7 * 24 * 60 * 60 * 1000) {
          setFormState(prev => ({ ...prev, data: { ...prev.data, ...formData } }));
          const relativeTime = formatRelativeTime(savedAt);
          toast.info(`Draft loaded from ${relativeTime}`, {
            description: 'Your previous work has been restored',
            duration: 4000,
          });
          setLastSavedAt(new Date(savedAt));
        } else {
          // Remove expired draft
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        logger.error('Failed to parse draft:', error);
        localStorage.removeItem(draftKey);
      }
    }
  }, [config.type, user?.id, mode, initialValues]);

  // Auto-save draft every 10 seconds (only in create mode)
  useEffect(() => {
    if (mode === 'edit' || !user?.id) {
      return;
    }

    const interval = setInterval(() => {
      // Check if there's meaningful content to save
      const hasContent = Object.values(formState.data).some(v => {
        if (typeof v === 'string') {
          return v.trim().length > 0;
        }
        if (Array.isArray(v)) {
          return v.length > 0;
        }
        return v !== null && v !== undefined;
      });

      if (!hasContent) {
        return;
      }

      const draftKey = `${config.type}-draft-${user.id}`;
      const savedAt = new Date().toISOString();
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData: formState.data,
          savedAt,
        })
      );
      setLastSavedAt(new Date(savedAt));
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [formState.data, config.type, user?.id, mode]);

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
      indigo: {
        gradient: 'from-indigo-600 to-indigo-700',
        focus: 'focus:ring-indigo-500',
        bg: 'from-indigo-50/30',
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

      // Clear AI-generated status for this field when user edits it
      setAiGeneratedFields(prev => {
        if (prev.fields.has(field as string)) {
          const newFields = new Set(prev.fields);
          newFields.delete(field as string);
          const newConfidence = { ...prev.confidence };
          delete newConfidence[field as string];
          return { fields: newFields, confidence: newConfidence };
        }
        return prev;
      });
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
      // Clear AI-generated field tracking when using template
      setAiGeneratedFields({ fields: new Set(), confidence: {} });
      // Scroll to top to show filled form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [initialFormData]
  );

  // AI prefill handler - fills form with AI-generated data
  const handleAIPrefill = useCallback(
    (data: Record<string, unknown>, confidence: Record<string, FieldConfidence>) => {
      setFormState(prev => ({
        ...prev,
        data: { ...prev.data, ...data } as T,
        isDirty: true,
      }));

      // Track which fields were AI-generated
      const newFields = new Set<string>(Object.keys(data));
      setAiGeneratedFields({
        fields: newFields,
        confidence,
      });

      // Scroll to top to show filled form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      logger.debug('EntityForm: handleSubmit called for', { entity: config.name }, 'EntityForm');
      logger.debug(
        'EntityForm: form data before validation:',
        { data: formState.data },
        'EntityForm'
      );
      logger.debug('EntityForm: default values:', { defaults: config.defaultValues }, 'EntityForm');

      try {
        setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

        // Merge form data with defaults to ensure all required fields are present
        const dataToValidate = { ...config.defaultValues, ...formState.data };
        logger.debug(
          'EntityForm: merged data for validation:',
          { data: dataToValidate },
          'EntityForm'
        );
        logger.debug(
          'EntityForm: start_date in merged data:',
          { start_date: dataToValidate.start_date },
          'EntityForm'
        );
        logger.debug(
          'EntityForm: start_date type:',
          { type: typeof dataToValidate.start_date },
          'EntityForm'
        );

        // Validate with Zod
        const validatedData = config.validationSchema.parse(dataToValidate);
        logger.debug('EntityForm: validation passed', { data: validatedData }, 'EntityForm');
        logger.debug(
          'EntityForm: start_date in validated data:',
          { start_date: validatedData.start_date },
          'EntityForm'
        );
        logger.debug('EntityForm: data being sent to API:', { data: validatedData }, 'EntityForm');

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
          } catch {
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

        // Clear draft on successful create
        if (mode === 'create' && user?.id) {
          const draftKey = `${config.type}-draft-${user.id}`;
          localStorage.removeItem(draftKey);
        }

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

  // Filter field groups and fields based on wizard mode
  const visibleFieldGroups = useMemo(() => {
    if (!wizardMode) {
      return config.fieldGroups;
    }

    // In wizard mode, filter to only show fields in visibleFields
    return config.fieldGroups
      .map(group => {
        if (!group.fields) {
          return group;
        }

        const filteredFields = group.fields.filter(field =>
          wizardMode.visibleFields.includes(field.name)
        );

        return {
          ...group,
          fields: filteredFields,
        };
      })
      .filter(group => !group.fields || group.fields.length > 0); // Remove empty groups
  }, [config.fieldGroups, wizardMode]);

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
      className={
        wizardMode
          ? ''
          : `min-h-screen bg-gradient-to-br ${theme.bg} via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8`
      }
    >
      {/* Header - Hidden in wizard mode */}
      {!wizardMode && (
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
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {mode === 'create' ? config.formTitle : `Edit ${config.name}`}
                </CardTitle>
                {mode === 'create' && !wizardMode && (
                  <AIPrefillButton
                    entityType={config.type}
                    onPrefill={handleAIPrefill}
                    disabled={formState.isSubmitting}
                    existingData={formState.data}
                  />
                )}
              </div>
              <CardDescription>
                {mode === 'create'
                  ? config.formDescription
                  : `Update your ${config.name.toLowerCase()} details. Changes will be saved when you submit.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Render Field Groups */}
                {visibleFieldGroups.map(group => {
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

                            const isAIGenerated = aiGeneratedFields.fields.has(field.name);
                            const aiConfidence = aiGeneratedFields.confidence[field.name];

                            return (
                              <div
                                key={field.name}
                                className={`${field.colSpan === 2 ? 'md:col-span-2' : ''} ${
                                  isAIGenerated ? 'relative' : ''
                                }`}
                              >
                                {/* AI-generated indicator */}
                                {isAIGenerated && (
                                  <div className="absolute -top-1 -right-1 z-10">
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200"
                                      title={`AI generated (${Math.round((aiConfidence || 0.7) * 100)}% confidence)`}
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477l-3.763 1.105 1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
                                      </svg>
                                      AI
                                    </span>
                                  </div>
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

                {/* Template Examples - Show at bottom of form after all fields (hidden in wizard mode) */}
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

                {/* Actions */}
                <div className="pt-6 border-t space-y-3">
                  {/* Draft save indicator */}
                  {mode === 'create' && lastSavedAt && !wizardMode && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Save className="h-3.5 w-3.5" />
                      <span>Draft saved {formatRelativeTime(lastSavedAt.toISOString())}</span>
                    </div>
                  )}

                  {wizardMode ? (
                    /* Wizard navigation - controlled by wizard */
                    <div className="flex justify-between">
                      {wizardMode.onPrevious && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={wizardMode.onPrevious}
                          disabled={formState.isSubmitting}
                        >
                          Previous
                        </Button>
                      )}
                      <div className="flex gap-3 ml-auto">
                        {wizardMode.onSkip && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={wizardMode.onSkip}
                            disabled={formState.isSubmitting}
                          >
                            Skip
                          </Button>
                        )}
                        {wizardMode.onNext ? (
                          <Button
                            type="button"
                            onClick={wizardMode.onNext}
                            disabled={formState.isSubmitting}
                          >
                            Next
                          </Button>
                        ) : wizardMode.isLastStep ? (
                          /* Submit button on last step */
                          <Button
                            type="submit"
                            disabled={formState.isSubmitting}
                            className={`bg-gradient-to-r ${theme.gradient}`}
                          >
                            {formState.isSubmitting ? 'Creating...' : `Create ${config.name}`}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    /* Standard form actions */
                    <div className="flex gap-4">
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
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Guidance Sidebar - Hidden in wizard mode */}
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
