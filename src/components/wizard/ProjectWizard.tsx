/**
 * ProjectWizard Component (Clean)
 *
 * Simplified project creation form that communicates with parent via callbacks.
 * No duplicate sidebars or progress indicators - all handled by parent page.
 *
 * @module components/wizard
 */

'use client';

import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { useProjectStore } from '@/stores/projectStore';
import { toast } from 'sonner';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Rocket, X, Loader2, ExternalLink } from 'lucide-react';
import { ProjectTemplates, type ProjectTemplate } from '@/components/create/templates';
import type { ProjectFieldType } from '@/lib/project-guidance';
import { satoshisToBitcoin, bitcoinToSatoshis } from '@/services/currency';
import ProjectMediaUpload from '@/components/project/ProjectMediaUpload';
import ProjectStatusManager from './ProjectStatusManager';
import type { ProjectFormData, FormErrors, ProjectWizardProps, ProjectStatus } from './types';
import { AVAILABLE_CATEGORIES, getCompletionPercentage } from './constants';
import { validateField, validateForm as validateFormUtil } from './validation';

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { loadProjects, updateProjectStatus } = useProjectStore();

  // Check both prop and query param for edit mode
  const editIdFromQuery = searchParams.get('edit') || searchParams.get('draft');
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

  // Validation uses extracted utility functions

  useEffect(() => {
    // Only load localStorage drafts when creating NEW projects (not editing)
    // When editing, we ALWAYS load from the API to ensure data integrity
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

  useEffect(() => {
    // Support both 'edit' and 'draft' query parameters
    const editId = searchParams.get('edit') || searchParams.get('draft');
    if (editId) {
      loadProjectForEdit(editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadProjectForEdit = async (projectId: string) => {
    if (!user) {
      return;
    }
    setLoadingProject(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }
      const result = await response.json();
      const project = result.data;

      // Only convert from satoshis if currency is BTC or SATS
      // CHF/USD/EUR are stored as-is in the database
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

      // Set project status
      setProjectStatus((project.status || 'draft') as typeof projectStatus);

      // Set edit mode and project ID when loading from query param
      setIsEditMode(true);
      setEditProjectId(projectId);

      toast.info('Project loaded for editing');
    } catch (error) {
      logger.error('Failed to load project:', error);
      toast.error('Failed to load project');
      router.push(ROUTES.DASHBOARD.PROJECTS);
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    // Only auto-save drafts for NEW projects, not when editing
    // When editing, changes are saved explicitly via the Save button
    if (!isEditMode && !editProjectId) {
      const interval = setInterval(() => {
        const hasContent = formData.title.trim() || formData.description.trim();
        if (hasContent) {
          localStorage.setItem('project-draft', JSON.stringify(formData));
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [formData, isEditMode, editProjectId]);

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFieldChange = (field: keyof FormErrors, value: string) => {
    updateFormData({ [field]: value });
    setTouched(prev => new Set(prev).add(field));
    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: keyof FormErrors) => {
    setTouched(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field as keyof ProjectFormData] as string);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleFieldFocus = (field: ProjectFieldType) => {
    if (onFieldFocus) {
      onFieldFocus(field);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
    }));
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setFormData(prev => ({ ...prev, ...template.data }));
    setErrors({}); // Clear validation errors when template is loaded
    setTouched(new Set()); // Reset touched fields
    toast.success(`Template "${template.name}" loaded!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canSubmit =
    formData.title.trim() && formData.description.trim() && !errors.title && !errors.description;

  const handleSubmit = async () => {
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

      // Normalize website URL: add https:// if no protocol
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

      // Clean up draft after successful save
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
  };

  // Handle status change
  const handleStatusChange = async (newStatus: typeof projectStatus) => {
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

      // Update project store
      if (editProjectId) {
        await updateProjectStatus(editProjectId, newStatus);
      }

      // Reload projects to reflect status change
      if (user.id) {
        loadProjects(user.id);
      }
    } catch (error) {
      logger.error('Failed to update project status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Status management extracted to ProjectStatusManager component

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
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
            <Input
              value={formData.title}
              onChange={e => handleFieldChange('title', e.target.value)}
              onFocus={() => handleFieldFocus('title')}
              onBlur={() => handleFieldBlur('title')}
              placeholder="e.g., Community Garden Project"
              className={errors.title ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <Textarea
              value={formData.description}
              onChange={e => handleFieldChange('description', e.target.value)}
              onFocus={() => handleFieldFocus('description')}
              onBlur={() => handleFieldBlur('description')}
              placeholder="What's your project about?"
              rows={6}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.description.length}/2000</p>
          </div>

          {/* Goal Amount & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Amount (optional)
              </label>
              <Input
                type="number"
                value={formData.goalAmount}
                onChange={e => handleFieldChange('goalAmount', e.target.value)}
                onFocus={() => handleFieldFocus('goalAmount')}
                onBlur={() => handleFieldBlur('goalAmount')}
                placeholder="5000"
                className={errors.goalAmount ? 'border-red-500' : ''}
              />
              {errors.goalAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.goalAmount}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Currency
              </label>
              <select
                value={formData.goalCurrency}
                onChange={e => {
                  const value = e.target.value;
                  if (['CHF', 'USD', 'EUR', 'BTC', 'SATS'].includes(value)) {
                    updateFormData({
                      goalCurrency: value as 'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS',
                    });
                  }
                  handleFieldFocus('currency');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="CHF">CHF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BTC">BTC</option>
                <option value="SATS">SATS</option>
              </select>
            </div>
          </div>

          {/* Funding Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funding Purpose (optional)
            </label>
            <Input
              value={formData.fundingPurpose}
              onChange={e => updateFormData({ fundingPurpose: e.target.value })}
              onFocus={() => handleFieldFocus('fundingPurpose')}
              placeholder="e.g., Equipment, salaries, marketing"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    toggleCategory(category);
                    handleFieldFocus('categories');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    formData.selectedCategories.includes(category)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {formData.selectedCategories.includes(category) && (
                    <X className="w-3 h-3 inline ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Website (optional)
            </label>
            <Input
              value={formData.websiteUrl}
              onChange={e => handleFieldChange('websiteUrl', e.target.value)}
              onFocus={() => handleFieldFocus('websiteUrl' as ProjectFieldType)}
              onBlur={() => handleFieldBlur('websiteUrl')}
              placeholder="https://yourproject.com"
              className={errors.websiteUrl ? 'border-red-500' : ''}
            />
            {errors.websiteUrl && <p className="mt-1 text-sm text-red-600">{errors.websiteUrl}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Link to your project's website or social media page
            </p>
          </div>

          {/* Bitcoin Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Address (add later)
            </label>
            <Input
              value={formData.bitcoinAddress}
              onChange={e => handleFieldChange('bitcoinAddress', e.target.value)}
              onFocus={() => handleFieldFocus('bitcoinAddress')}
              onBlur={() => handleFieldBlur('bitcoinAddress')}
              placeholder="bc1q..."
              className={errors.bitcoinAddress ? 'border-red-500' : ''}
            />
            {errors.bitcoinAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.bitcoinAddress}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <span>Don't have a wallet?</span>
              <Link
                href="/wallets"
                target="_blank"
                className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Get one <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Project Images - Only in Edit Mode */}
          {isEditMode && editProjectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Images (optional)
              </label>
              <ProjectMediaUpload projectId={editProjectId} />
              <p className="mt-2 text-xs text-gray-500">
                Upload up to 3 images to showcase your project. First image will be the cover.
              </p>
            </div>
          )}
        </div>

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
