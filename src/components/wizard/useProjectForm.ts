/**
 * useProjectForm Hook
 *
 * Manages project form state, validation, and API operations.
 * Extracted from ProjectWizard for better separation of concerns.
 *
 * @module components/wizard
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/lib/routes';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { satoshisToBitcoin, bitcoinToSatoshis } from '@/services/currency';
import type { ProjectFormData, FormErrors, ProjectStatus } from './types';
import { getCompletionPercentage } from './constants';
import { validateField, validateForm as validateFormUtil } from './validation';

interface UseProjectFormProps {
  projectId?: string;
  initialData?: Partial<ProjectFormData>;
  onSave?: () => void;
  onProgressChange?: (progress: number) => void;
  onGoalAmountChange?: (amount: number | undefined) => void;
  onGoalCurrencyChange?: (currency: string) => void;
}

export function useProjectForm({
  projectId,
  initialData,
  onSave,
  onProgressChange,
  onGoalAmountChange,
  onGoalCurrencyChange,
}: UseProjectFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { loadProjects, updateProjectStatus } = useProjectStore();

  // Check both prop and query param for edit mode
  const editIdFromQuery = searchParams?.get('edit') || searchParams?.get('draft');
  const [isEditMode, setIsEditMode] = useState(!!projectId || !!editIdFromQuery);
  const [editProjectId, setEditProjectId] = useState<string | null>(
    projectId || editIdFromQuery || null
  );
  const [loadingProject, setLoadingProject] = useState(false);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    goalAmount: initialData?.goalAmount || '',
    goalCurrency:
      initialData?.goalCurrency &&
      ['CHF', 'USD', 'EUR', 'BTC', 'SATS'].includes(initialData.goalCurrency)
        ? initialData.goalCurrency
        : 'CHF',
    fundingPurpose: initialData?.fundingPurpose || '',
    bitcoinAddress: initialData?.bitcoinAddress || '',
    websiteUrl: initialData?.websiteUrl || '',
    selectedCategories: initialData?.selectedCategories || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Notify parent of progress changes
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(getCompletionPercentage(formData));
    }
  }, [formData, onProgressChange]);

  // Notify parent of goal amount changes
  useEffect(() => {
    if (onGoalAmountChange) {
      const amount = formData.goalAmount ? parseFloat(formData.goalAmount) : undefined;
      onGoalAmountChange(amount);
    }
  }, [formData.goalAmount, onGoalAmountChange]);

  // Notify parent of currency changes
  useEffect(() => {
    if (onGoalCurrencyChange) {
      onGoalCurrencyChange(formData.goalCurrency);
    }
  }, [formData.goalCurrency, onGoalCurrencyChange]);

  // Load draft from localStorage for new projects
  useEffect(() => {
    if (!isEditMode && !editProjectId) {
      const savedDraft = localStorage.getItem('project-draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          toast.info('Draft loaded');
        } catch (error) {
          logger.error('Failed to parse draft:', error);
          localStorage.removeItem('project-draft');
        }
      }
    }
  }, [isEditMode, editProjectId]);

  // Load project for editing
  const loadProjectForEdit = useCallback(
    async (id: string) => {
      if (!user) {
        return;
      }
      setLoadingProject(true);
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load project');
        }
        const result = await response.json();
        const project = result.data;

        const currency = project.currency || PLATFORM_DEFAULT_CURRENCY;
        const isBitcoinCurrency = currency === 'BTC' || currency === 'SATS';
        const goalAmount = project.goal_amount
          ? isBitcoinCurrency
            ? satoshisToBitcoin(project.goal_amount).toString()
            : project.goal_amount.toString()
          : '';

        setFormData({
          title: project.title || '',
          description: project.description || '',
          goalAmount,
          goalCurrency: currency,
          fundingPurpose: project.funding_purpose || '',
          bitcoinAddress: project.bitcoin_address || '',
          websiteUrl: project.website_url || '',
          selectedCategories: project.tags || [],
        });

        setProjectStatus((project.status || 'draft') as ProjectStatus);
        setIsEditMode(true);
        setEditProjectId(id);
        toast.info('Project loaded for editing');
      } catch (error) {
        logger.error('Failed to load project:', error);
        toast.error('Failed to load project');
        router.push(ROUTES.DASHBOARD.PROJECTS);
      } finally {
        setLoadingProject(false);
      }
    },
    [user, router]
  );

  // Auto-load from query params
  useEffect(() => {
    const editId = searchParams?.get('edit') || searchParams?.get('draft');
    if (editId) {
      loadProjectForEdit(editId);
    }
  }, [searchParams, loadProjectForEdit]);

  // Auto-save draft for new projects
  useEffect(() => {
    if (!isEditMode && !editProjectId) {
      const interval = setInterval(() => {
        const hasContent = formData.title.trim() || formData.description.trim();
        if (hasContent) {
          localStorage.setItem('project-draft', JSON.stringify(formData));
        }
      }, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [formData, isEditMode, editProjectId]);

  const updateFormData = useCallback((updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof FormErrors, value: string) => {
      updateFormData({ [field]: value });
      setTouched(prev => new Set(prev).add(field));
      if (touched.has(field)) {
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
      }
    },
    [touched, updateFormData]
  );

  const handleFieldBlur = useCallback(
    (field: keyof FormErrors) => {
      setTouched(prev => new Set(prev).add(field));
      const error = validateField(field, formData[field as keyof ProjectFormData] as string);
      setErrors(prev => ({ ...prev, [field]: error }));
    },
    [formData]
  );

  const toggleCategory = useCallback((category: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
    }));
  }, []);

  const handleTemplateSelect = useCallback((template: Partial<Record<string, unknown>>) => {
    setFormData(prev => ({ ...prev, ...template }) as ProjectFormData);
    setErrors({});
    setTouched(new Set());
    toast.success('Template loaded!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canSubmit =
    formData.title.trim() && formData.description.trim() && !errors.title && !errors.description;

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to create a project');
      return;
    }
    const validation = validateFormUtil(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl =
        isEditMode && editProjectId ? `/api/projects/${editProjectId}` : '/api/projects';
      const method = isEditMode ? 'PUT' : 'POST';

      let goalAmount = null;
      if (formData.goalAmount) {
        const amount = parseFloat(formData.goalAmount);
        goalAmount =
          formData.goalCurrency === 'BTC' || formData.goalCurrency === 'SATS'
            ? bitcoinToSatoshis(amount)
            : Math.round(amount);
      }

      let websiteUrl = formData.websiteUrl.trim() || null;
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
        websiteUrl = `https://${websiteUrl}`;
      }

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          goal_amount: goalAmount,
          currency: formData.goalCurrency || PLATFORM_DEFAULT_CURRENCY,
          funding_purpose: formData.fundingPurpose.trim() || null,
          bitcoin_address: formData.bitcoinAddress.trim() || null,
          website_url: websiteUrl,
          category: formData.selectedCategories[0] || 'other',
          tags: formData.selectedCategories,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create project');
      }

      localStorage.removeItem('project-draft');
      toast.success(isEditMode ? 'Project updated!' : 'Project created!');

      if (user?.id && !isEditMode) {
        await loadProjects(user.id);
      }

      if (onSave) {
        onSave();
      } else if (isEditMode && editProjectId) {
        router.push(ROUTES.PROJECTS.VIEW(editProjectId));
      } else {
        router.push(ROUTES.DASHBOARD.HOME);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(errorMessage);
      logger.error('Project creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, formData, isEditMode, editProjectId, loadProjects, onSave, router]);

  const handleStatusChange = useCallback(
    async (newStatus: ProjectStatus) => {
      if (!editProjectId || !user) {
        return;
      }

      setIsUpdatingStatus(true);
      try {
        const response = await fetch(`/api/projects/${editProjectId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update status');
        }

        setProjectStatus(newStatus);
        toast.success(`Project status updated to ${newStatus}`);

        if (editProjectId) {
          await updateProjectStatus(editProjectId, newStatus);
        }

        if (user.id) {
          loadProjects(user.id);
        }
      } catch (error) {
        logger.error('Failed to update project status:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update status');
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [editProjectId, user, updateProjectStatus, loadProjects]
  );

  return {
    // State
    formData,
    errors,
    touched,
    isSubmitting,
    loadingProject,
    isEditMode,
    editProjectId,
    projectStatus,
    isUpdatingStatus,
    canSubmit,

    // Actions
    updateFormData,
    handleFieldChange,
    handleFieldBlur,
    toggleCategory,
    handleTemplateSelect,
    handleSubmit,
    handleStatusChange,
  };
}
