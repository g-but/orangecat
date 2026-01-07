/**
import { logger } from '@/utils/logger';
 * useProfileEditor Hook
 *
 * Extracts all profile editing logic from ModernProfileEditor component.
 * Handles form state, file uploads, social links, location privacy, and submission.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted profile editing logic from ModernProfileEditor component
 */

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Profile } from '@/types/profile';
import { ProfileFormData } from '@/types/database';
import {
  buildLocationContext,
  parseLocationContext,
  type LocationMode,
} from '@/lib/location-privacy';
import { ProfileStorageService } from '@/services/profile/storage';
import { SocialLink } from '@/types/social';
import { profileSchema as serverProfileSchema, normalizeProfileData } from '@/lib/validation';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

// Use server-side schema for consistency
const profileSchema = serverProfileSchema;
type ProfileFormValues = z.infer<typeof profileSchema>;

export interface UseProfileEditorOptions {
  profile: Profile;
  userId: string;
  userEmail?: string;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  onFieldFocus?: (field: string) => void;
}

export interface UseProfileEditorReturn {
  // Form
  form: ReturnType<typeof useForm<ProfileFormValues>>;
  isSaving: boolean;
  
  // Image uploads
  avatarPreview: string | null;
  bannerPreview: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File, type: 'avatar' | 'banner') => Promise<void>;
  
  // Social links
  socialLinks: SocialLink[];
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
  
  // Location
  locationMode: LocationMode;
  setLocationMode: React.Dispatch<React.SetStateAction<LocationMode>>;
  locationGroupLabel: string;
  setLocationGroupLabel: React.Dispatch<React.SetStateAction<string>>;
  
  // Form submission
  onSubmit: (data: ProfileFormValues) => Promise<void>;
}

export function useProfileEditor({
  profile,
  userId,
  userEmail,
  onSave,
  onCancel,
  onFieldFocus,
}: UseProfileEditorOptions): UseProfileEditorReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Parse social links from profile
  useEffect(() => {
    if (profile.social_links) {
      if (typeof profile.social_links === 'object' && 'links' in profile.social_links) {
        setSocialLinks((profile.social_links as { links: SocialLink[] }).links || []);
      } else if (Array.isArray(profile.social_links)) {
        setSocialLinks(profile.social_links as SocialLink[]);
      }
    }
  }, [profile.social_links]);

  // Form setup with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      username: profile.username || (typeof userEmail === 'string' && userEmail.includes('@') ? userEmail.split('@')[0] : userEmail || ''),
      name: profile.name || '',
      bio: profile.bio || '',
      location_country: profile.location_country || '',
      location_city: profile.location_city || '',
      location_zip: profile.location_zip || '',
      location_search: profile.location_search || profile.location || '',
      latitude: profile.latitude || undefined,
      longitude: profile.longitude || undefined,
      location_context: profile.location_context || '',
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      website: profile.website || '',
      social_links: socialLinks.length > 0 ? { links: socialLinks } : undefined,
      contact_email: profile.contact_email || userEmail || '',
      phone: profile.phone || '',
      bitcoin_address: profile.bitcoin_address || '',
      lightning_address: profile.lightning_address || '',
      currency: profile.currency || PLATFORM_DEFAULT_CURRENCY,
    },
  });

  // Watch for username changes to auto-update display name if empty
  const watchedUsername = form.watch('username');
  const watchedDisplayName = form.watch('name');

  // Local UI state for location visibility/group
  const [locationMode, setLocationMode] = useState<LocationMode>(() =>
    parseLocationContext(profile.location_context || '').mode
  );
  const [locationGroupLabel, setLocationGroupLabel] = useState<string>(() => {
    const parsed = parseLocationContext(profile.location_context || '');
    return parsed.groupLabel || '';
  });

  useEffect(() => {
    if (watchedUsername && !watchedDisplayName) {
      form.setValue('name', watchedUsername);
    }
  }, [watchedUsername, watchedDisplayName, form]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel, isSaving]);

  // Handle file upload
  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!userId) {
      toast.error('You must be logged in to upload files');
      return;
    }

    const setPreview = type === 'avatar' ? setAvatarPreview : setBannerPreview;

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload file using ProfileStorageService
      const result = await ProfileStorageService.uploadAvatar(userId, file);

      if (result.success && result.url) {
        // Update form data with new URL
        form.setValue(`${type}_url` as keyof ProfileFormValues, result.url);
        setPreview(result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setPreview(null);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update form when social links change
  useEffect(() => {
    form.setValue('social_links', socialLinks.length > 0 ? { links: socialLinks } : undefined);
  }, [socialLinks, form]);

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);

    try {
      // Apply location privacy/group mode before normalization/save
      const adjusted: ProfileFormValues = { ...data };
      if (locationMode === 'hidden') {
        adjusted.location_context = buildLocationContext(
          adjusted.location_context,
          'hidden'
        );
      } else if (locationMode === 'group') {
        const group = locationGroupLabel?.trim() || '';
        adjusted.location_search = group;
        adjusted.location_country = null;
        adjusted.location_city = null;
        adjusted.location_zip = null;
        adjusted.latitude = undefined;
        adjusted.longitude = undefined;
        adjusted.location_context = buildLocationContext(adjusted.location_context, 'group', group);
      } else {
        adjusted.location_context = buildLocationContext(adjusted.location_context, 'actual');
      }

      // Ensure social_links includes current state, converting null labels to undefined
      const normalizedLinks =
        socialLinks.length > 0
          ? {
              links: socialLinks.map(link => ({
                platform: link.platform,
                value: link.value,
                label: link.label || undefined,
              })),
            }
          : undefined;

      const dataWithSocialLinks = {
        ...adjusted,
        social_links: normalizedLinks,
      };

      // Normalize the data using our helper function
      const normalizedData = normalizeProfileData(dataWithSocialLinks);
      const formData = normalizedData as ProfileFormData;

      await onSave(formData);
    } catch (error) {
      let errorMessage = 'Please try again';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        errorMessage = 
          (typeof errorObj.message === 'string' ? errorObj.message : null) ||
          (typeof errorObj.error === 'string' ? errorObj.error : null) ||
          JSON.stringify(error);
      }

      toast.error('Failed to save profile', {
        description: errorMessage,
      });

      logger.error('Profile save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    form,
    isSaving,
    avatarPreview,
    bannerPreview,
    avatarInputRef,
    bannerInputRef,
    handleFileUpload,
    socialLinks,
    setSocialLinks,
    locationMode,
    setLocationMode,
    locationGroupLabel,
    setLocationGroupLabel,
    onSubmit,
  };
}

