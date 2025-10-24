'use client';

import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Target, Rocket, X, CheckCircle, Loader2 } from 'lucide-react';

interface ProjectFormData {
  title: string;
  description: string;
  goalAmount: string;
  goalCurrency: string;
  fundingPurpose: string;
  bitcoinAddress: string;
  selectedCategories: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  goalAmount?: string;
  bitcoinAddress?: string;
}

const AVAILABLE_CATEGORIES = [
  'education',
  'health',
  'technology',
  'community',
  'charity',
  'business',
  'creative',
  'environment',
  'humanitarian',
  'research',
];

// Helper function to calculate form completion percentage
const getCompletionPercentage = (formData: ProjectFormData): number => {
  const fields = [
    { value: formData.title.trim(), weight: 25 },
    { value: formData.description.trim(), weight: 30 },
    { value: formData.goalAmount.trim(), weight: 15 },
    { value: formData.fundingPurpose.trim(), weight: 10 },
    { value: formData.bitcoinAddress.trim(), weight: 15 },
    { value: formData.selectedCategories.length > 0, weight: 5 },
  ];

  const completedWeight = fields.reduce((sum, field) => sum + (field.value ? field.weight : 0), 0);

  return Math.min(completedWeight, 100);
};

export function ProjectWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    goalAmount: '',
    goalCurrency: 'CHF',
    fundingPurpose: '',
    bitcoinAddress: '',
    selectedCategories: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Validation functions
  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'title':
        if (!value.trim()) {
          return 'Project title is required';
        }
        if (value.length < 3) {
          return 'Title must be at least 3 characters';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
        break;
      case 'description':
        if (!value.trim()) {
          return 'Project description is required';
        }
        if (value.length < 10) {
          return 'Description must be at least 10 characters';
        }
        if (value.length > 2000) {
          return 'Description must be less than 2000 characters';
        }
        break;
      case 'goalAmount':
        if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
          return 'Goal amount must be a positive number';
        }
        break;
      case 'bitcoinAddress':
        if (value && !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}$/.test(value)) {
          return 'Please enter a valid Bitcoin address';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check required fields
    const titleError = validateField('title', formData.title);
    if (titleError) {
      newErrors.title = titleError;
      isValid = false;
    }

    const descError = validateField('description', formData.description);
    if (descError) {
      newErrors.description = descError;
      isValid = false;
    }

    // Check optional fields
    const amountError = validateField('goalAmount', formData.goalAmount);
    if (amountError) {
      newErrors.goalAmount = amountError;
      isValid = false;
    }

    const addressError = validateField('bitcoinAddress', formData.bitcoinAddress);
    if (addressError) {
      newErrors.bitcoinAddress = addressError;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    // For edit mode, try to load edit-specific draft first
    if (isEditMode && editProjectId) {
      const editDraft = localStorage.getItem(`project-edit-${editProjectId}`);
      if (editDraft) {
        try {
          const parsed = JSON.parse(editDraft);
          setFormData(parsed);
          toast.info('Edit draft loaded from previous session');
          return;
        } catch (error) {
          logger.error('Failed to parse edit draft:', error);
          localStorage.removeItem(`project-edit-${editProjectId}`);
        }
      }
    }

    // For create mode or if no edit draft, load general draft
    const savedDraft = localStorage.getItem('project-draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        toast.info('Draft loaded from previous session');
      } catch (error) {
        logger.error('Failed to parse saved draft:', error);
        localStorage.removeItem('project-draft');
      }
    }
  }, [isEditMode, editProjectId]);

  // Check for edit mode on mount
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setEditProjectId(editId);
      loadProjectForEdit(editId);
    }
  }, [searchParams]);

  // Load existing project data for editing
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

      // Convert satoshis back to display format
      const goalAmount = project.goal_amount ? (project.goal_amount / 100000000).toString() : '';

      setFormData({
        title: project.title || '',
        description: project.description || '',
        goalAmount,
        goalCurrency: project.currency || 'SATS',
        fundingPurpose: project.funding_purpose || '',
        bitcoinAddress: project.bitcoin_address || '',
        selectedCategories: project.tags || [],
      });

      toast.info('Project loaded for editing');
    } catch (error) {
      logger.error('Failed to load project for editing:', error);
      toast.error('Failed to load project for editing');
      router.push('/dashboard/projects');
    } finally {
      setLoadingProject(false);
    }
  };

  // Autosave every 10 seconds (for both create and edit modes)
  useEffect(() => {
    const interval = setInterval(() => {
      const hasContent = formData.title.trim() || formData.description.trim();
      if (hasContent) {
        const key = isEditMode && editProjectId ? `project-edit-${editProjectId}` : 'project-draft';
        localStorage.setItem(key, JSON.stringify(formData));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [formData, isEditMode, editProjectId]);

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleFieldChange = (field: keyof FormErrors, value: string) => {
    updateFormData({ [field]: value });

    // Mark field as touched
    setTouched(prev => new Set(prev).add(field));

    // Validate field in real-time if it's been touched
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

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category],
    }));
  };

  const canSubmit =
    formData.title.trim() && formData.description.trim() && !errors.title && !errors.description;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create a project');
      return;
    }

    // Validate all fields before submission
    const isValid = validateForm();
    if (!isValid) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl =
        isEditMode && editProjectId ? `/api/projects/${editProjectId}` : '/api/projects';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          goal_amount: formData.goalAmount
            ? Math.round(parseFloat(formData.goalAmount) * 100000000)
            : null, // Convert to satoshis
          currency: formData.goalCurrency || 'SATS',
          funding_purpose: formData.fundingPurpose.trim() || null,
          bitcoin_address: formData.bitcoinAddress.trim() || null,
          category: formData.selectedCategories[0] || 'other', // Primary category
          tags: formData.selectedCategories, // Multi-select categories as tags
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create project';
        try {
          const errorData = await response.json();
          logger.error('API Error Response:', errorData);

          // Handle specific error types
          if (response.status === 400) {
            errorMessage = 'Invalid project data. Please check your inputs and try again.';
          } else if (response.status === 401) {
            errorMessage = 'You must be signed in to create a project.';
          } else if (response.status === 403) {
            errorMessage = 'You do not have permission to create projects.';
          } else if (response.status === 409) {
            errorMessage =
              'A project with this title already exists. Please choose a different title.';
          } else if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again in a few minutes.';
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } catch (e) {
          logger.error('Could not parse error response:', await response.text());
          if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      logger.debug(isEditMode ? 'Project updated:' : 'Project created:', data);

      // Clear draft on successful submission
      if (isEditMode && editProjectId) {
        localStorage.removeItem(`project-edit-${editProjectId}`);
      } else {
        localStorage.removeItem('project-draft');
      }

      toast.success(isEditMode ? 'Project updated successfully!' : 'Project created successfully!');
      router.push(`/dashboard/projects`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(errorMessage);
      logger.error('Project creation error:', error, error instanceof Error ? error.stack : '');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-tiffany-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading project for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Your Project' : 'Create Your Project'}
          </h2>
          <p className="text-gray-600">
            {isEditMode ? 'Update your project details' : 'Share your vision and launch in seconds'}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Form Completion</span>
          <span>{Math.round(getCompletionPercentage(formData))}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage(formData)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span className={formData.title.trim() ? 'text-green-600' : ''}>
            {formData.title.trim() ? '✓' : '○'} Title
          </span>
          <span className={formData.description.trim() ? 'text-green-600' : ''}>
            {formData.description.trim() ? '✓' : '○'} Description
          </span>
          <span className={formData.bitcoinAddress.trim() ? 'text-green-600' : ''}>
            {formData.bitcoinAddress.trim() ? '✓' : '○'} Bitcoin Address
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
          <Input
            value={formData.title}
            onChange={e => handleFieldChange('title', e.target.value)}
            onBlur={() => handleFieldBlur('title')}
            placeholder="e.g., Community Garden Project"
            className={`w-full ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
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
            onBlur={() => handleFieldBlur('description')}
            placeholder="What's your project about? Tell us your story..."
            rows={4}
            className={`w-full ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/2000 characters
          </p>
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
              onBlur={() => handleFieldBlur('goalAmount')}
              placeholder="5000"
              className={`w-full ${errors.goalAmount ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.goalAmount && <p className="mt-1 text-sm text-red-600">{errors.goalAmount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={formData.goalCurrency}
              onChange={e => updateFormData({ goalCurrency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="CHF">CHF (Swiss Francs)</option>
              <option value="USD">USD (US Dollars)</option>
              <option value="EUR">EUR (Euros)</option>
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="SATS">SATS (Satoshis)</option>
            </select>
          </div>
        </div>

        {/* Funding Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What will the funds be used for? (optional)
          </label>
          <Input
            value={formData.fundingPurpose}
            onChange={e => updateFormData({ fundingPurpose: e.target.value })}
            placeholder="e.g., equipment, team salaries, marketing"
            className="w-full"
          />
        </div>

        {/* Multi-Select Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Categories (select as many as apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.selectedCategories.includes(category)
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
                {formData.selectedCategories.includes(category) && (
                  <X className="w-3 h-3 inline-block ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bitcoin Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bitcoin Address (optional)
          </label>
          <Input
            value={formData.bitcoinAddress}
            onChange={e => handleFieldChange('bitcoinAddress', e.target.value)}
            onBlur={() => handleFieldBlur('bitcoinAddress')}
            placeholder="bc1q... (add this later if you want to accept donations)"
            className={`w-full ${errors.bitcoinAddress ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          {errors.bitcoinAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.bitcoinAddress}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Add a Bitcoin or Lightning address later to accept donations directly
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={() => router.push('/dashboard')} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditMode ? 'Updating your project...' : 'Creating your project...'}
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
  );
}
