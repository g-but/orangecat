'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CampaignStorageService } from '@/services/projects/projectStorageService';
import { isValidBitcoinAddress } from '@/utils/validation';
import { z } from 'zod';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

const projectFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  bitcoin_address: z.string().refine(isValidBitcoinAddress, 'Invalid Bitcoin address'),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  goal_amount: z
    .string()
    .refine(val => !isNaN(parseFloat(val)), 'Invalid number')
    .optional()
    .or(z.literal('')),
  tags: z.string().optional(),
  banner_url: z.string().optional(),
  gallery_images: z.array(z.string()).optional(),
});

export interface CampaignFormData {
  title: string;
  description: string;
  bitcoin_address: string;
  website_url: string;
  goal_amount: string;
  tags: string;
  banner_url: string;
  gallery_images: string[];
}

interface CreateCampaignFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onPreviewToggle: () => void;
  showPreview: boolean;
}

export default function CreateCampaignForm({
  currentStep,
  setCurrentStep,
  onPreviewToggle: _onPreviewToggle,
  showPreview: _showPreview,
}: CreateCampaignFormProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<z.ZodError | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    bitcoin_address: '',
    website_url: '',
    goal_amount: '',
    tags: '',
    banner_url: '',
    gallery_images: [],
  });

  // Auto-save draft
  useEffect(() => {
    if (!user || !formData.title.trim()) {
      return;
    }

    const saveTimer = setTimeout(() => {
      const draftData = { formData, currentStep };
      localStorage.setItem(`project-draft-${user.id}`, JSON.stringify(draftData));
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [formData, currentStep, user]);

  // Load draft on mount
  useEffect(() => {
    if (!user) {
      return;
    }

    const savedDraft = localStorage.getItem(`project-draft-${user.id}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(draftData.formData);
        setCurrentStep(draftData.currentStep);
        toast.info('Draft loaded');
      } catch {
        // Silently handle parsing errors
      }
    }
  }, [user, setCurrentStep]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    const result = projectFormSchema.safeParse(newFormData);
    if (!result.success) {
      setFormErrors(result.error);
    } else {
      setFormErrors(null);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, tags: e.target.value }));
  };

  const handleFileUpload = async (file: File, type: 'banner' | 'gallery') => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));

      // Generate temporary project ID for uploads
      const tempCampaignId = `temp-${user.id}-${Date.now()}`;

      let result;
      if (type === 'banner') {
        result = await CampaignStorageService.uploadBanner(tempCampaignId, file, progress => {
          setUploadProgress(prev => ({ ...prev, [type]: progress.percentage }));
        });
      } else {
        const imageIndex = formData.gallery_images.length;
        result = await CampaignStorageService.uploadGalleryImage(
          tempCampaignId,
          file,
          imageIndex,
          progress => {
            setUploadProgress(prev => ({ ...prev, [type]: progress.percentage }));
          }
        );
      }

      if (!result.success) {
        toast.error(result.error || 'Upload failed');
        return;
      }

      // Update form data
      if (type === 'banner') {
        setFormData(prev => ({ ...prev, banner_url: result.url! }));
        toast.success('Banner uploaded successfully!');
      } else {
        setFormData(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, result.url!],
        }));
        toast.success('Image added to gallery!');
      }

      // Clear progress
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      }, 1000);
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'banner' | 'gallery') => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFileUpload(imageFile, type);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = projectFormSchema.safeParse(formData);
    if (!result.success) {
      setFormErrors(result.error);
      toast.error('Please fix the errors in the form');
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('You must be logged in to create a project');
      }

      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      // Create the project via API (auth handled server-side)
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        bitcoin_address: formData.bitcoin_address.trim() || null,
        website_url: formData.website_url,
        goal_amount: formData.goal_amount
          ? (() => {
              const parsed = parseFloat(formData.goal_amount);
              if (Number.isNaN(parsed) || parsed < 0) {
                throw new Error('Goal amount must be a positive number');
              }
              return parsed;
            })()
          : null,
        category: tags.length > 0 ? tags[0] : null,
        tags: tags.length > 1 ? tags.slice(1) : [],
        banner_url: formData.banner_url || null,
        gallery_images: formData.gallery_images,
        is_active: true,
        is_public: true,
        total_funding: 0,
        contributor_count: 0,
        currency: 'BTC',
      };

      const response = await fetch(ENTITY_REGISTRY.project.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      const data = result.data ?? result;

      // Clear the draft from localStorage
      localStorage.removeItem(`project-draft-${user.id}`);

      toast.success('🎉 Project created successfully!');
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    const total = 7;

    if (formData.title.trim()) {
      completed++;
    }
    if (formData.description.trim()) {
      completed++;
    }
    if (formData.tags.trim().length > 0) {
      completed++;
    }
    if (formData.bitcoin_address.trim()) {
      completed++;
    }
    if (formData.website_url.trim()) {
      completed++;
    }
    if (formData.goal_amount.trim()) {
      completed++;
    }
    if (formData.banner_url) {
      completed++;
    }
    if (formData.gallery_images.length > 0) {
      completed++;
    }

    return Math.round((completed / total) * 100);
  };

  return {
    formData,
    loading,
    error,
    uploadProgress,
    isUploading,
    formErrors,
    handleChange,
    handleTagsChange,
    handleFileUpload,
    handleDrop,
    handleDragOver,
    nextStep,
    prevStep,
    handleSubmit,
    getCompletionPercentage,
    canProceedToStep2: formData.title.trim().length > 0,
    canProceedToStep3: formData.bitcoin_address.trim().length > 0,
    canProceedToStep4: true,
  };
}
