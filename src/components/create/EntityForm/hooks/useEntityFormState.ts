/**
 * ENTITY FORM STATE HOOK
 * Manages form state, draft persistence, and AI prefill tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { FormState, AIGeneratedFields, FieldConfidence, EntityConfig } from '../../types';

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

interface UseEntityFormStateOptions<T extends Record<string, unknown>> {
  config: EntityConfig<T>;
  initialValues?: Partial<T>;
  userCurrency: string;
  userId?: string;
  mode: 'create' | 'edit';
}

export function useEntityFormState<T extends Record<string, unknown>>({
  config,
  initialValues,
  userCurrency,
  userId,
  mode,
}: UseEntityFormStateOptions<T>) {
  // Initialize form data with user's currency preference
  const initialFormData = useMemo(() => {
    const data = { ...config.defaultValues, ...initialValues } as T;
    if ('currency' in data && !initialValues?.currency) {
      if (data.currency === undefined || data.currency === null || data.currency === '') {
        (data as Record<string, unknown>).currency = userCurrency;
      }
    }
    return data;
  }, [config.defaultValues, initialValues, userCurrency]);

  const [formState, setFormState] = useState<FormState<T>>({
    data: initialFormData,
    errors: {},
    isSubmitting: false,
    isDirty: false,
    activeField: null,
  });

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const [aiGeneratedFields, setAiGeneratedFields] = useState<AIGeneratedFields>({
    fields: new Set<string>(),
    confidence: {},
  });

  // Reset form when initialValues change
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      data: { ...config.defaultValues, ...initialValues } as T,
      errors: {},
      isDirty: false,
      activeField: null,
    }));
  }, [initialValues, config.defaultValues]);

  // Load draft on mount (create mode only)
  useEffect(() => {
    if (mode === 'edit' || !userId) {
      return;
    }

    const hasInitialContent =
      initialValues &&
      (('title' in initialValues && initialValues.title) ||
        ('description' in initialValues && initialValues.description));

    if (hasInitialContent) {
      const draftKey = `${config.type}-draft-${userId}`;
      localStorage.removeItem(draftKey);
      return;
    }

    const draftKey = `${config.type}-draft-${userId}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const { formData, savedAt } = JSON.parse(savedDraft);
        const age = Date.now() - new Date(savedAt).getTime();

        if (age < 7 * 24 * 60 * 60 * 1000) {
          setFormState(prev => ({ ...prev, data: { ...prev.data, ...formData } }));
          toast.info(`Draft loaded from ${formatRelativeTime(savedAt)}`, {
            description: 'Your previous work has been restored',
            duration: 4000,
          });
          setLastSavedAt(new Date(savedAt));
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (error) {
        logger.error('Failed to parse draft', { error }, 'EntityForm');
        localStorage.removeItem(draftKey);
      }
    }
  }, [config.type, userId, mode, initialValues]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (mode === 'edit' || !userId) {
      return;
    }

    const interval = setInterval(() => {
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

      const draftKey = `${config.type}-draft-${userId}`;
      const savedAt = new Date().toISOString();
      localStorage.setItem(draftKey, JSON.stringify({ formData: formState.data, savedAt }));
      setLastSavedAt(new Date(savedAt));
    }, 10000);

    return () => clearInterval(interval);
  }, [formState.data, config.type, userId, mode]);

  const handleFieldChange = useCallback(
    (field: keyof T, value: unknown) => {
      const updatedData = { ...formState.data, [field]: value };

      // Auto-generate slug from name for groups
      if (field === 'name' && config.type === 'group') {
        const slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        (updatedData as Record<string, unknown>).slug = slug;
      }

      setFormState(prev => ({
        ...prev,
        data: updatedData,
        errors: { ...prev.errors, [field as string]: '' },
        isDirty: true,
      }));

      // Clear AI-generated status when user edits
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

  const handleFieldFocus = useCallback((field: string) => {
    setFormState(prev => ({ ...prev, activeField: field }));
  }, []);

  const handleAIPrefill = useCallback(
    (data: Record<string, unknown>, confidence: Record<string, FieldConfidence>) => {
      setFormState(prev => ({
        ...prev,
        data: { ...prev.data, ...data } as T,
        isDirty: true,
      }));

      const newFields = new Set<string>(Object.keys(data));
      setAiGeneratedFields({ fields: newFields, confidence });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const clearDraft = useCallback(() => {
    if (userId) {
      const draftKey = `${config.type}-draft-${userId}`;
      localStorage.removeItem(draftKey);
    }
  }, [config.type, userId]);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setFormState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setFormState(prev => ({ ...prev, errors, isSubmitting: false }));
  }, []);

  return {
    formState,
    setFormState,
    aiGeneratedFields,
    setAiGeneratedFields,
    lastSavedAt,
    initialFormData,
    handleFieldChange,
    handleFieldFocus,
    handleAIPrefill,
    clearDraft,
    setSubmitting,
    setErrors,
    formatRelativeTime,
  };
}
