'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Save,
  X,
  MapPin,
  Link as LinkIcon,
  User,
  Camera,
  Bitcoin,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { LocationAutocomplete } from '@/components/ui/LocationAutocomplete';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Profile } from '@/types/profile';
import { ProfileFormData } from '@/types/database';
import { ProfileStorageService } from '@/services/profile/storage';
import { WalletManager } from '@/components/wallets/WalletManager';
import { Wallet, WalletFormData } from '@/types/wallet';
import ProfileWizard from './ProfileWizard';

// Import server-side schema to keep validation consistent
import { profileSchema as serverProfileSchema, normalizeProfileData } from '@/lib/validation';

// Profile Images Section Component
function ProfileImagesSection({
  profile,
  avatarPreview,
  bannerPreview,
  avatarInputRef,
  bannerInputRef,
  handleFileUpload,
}: {
  profile: Profile;
  avatarPreview: string | null;
  bannerPreview: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File, type: 'avatar' | 'banner') => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {/* Banner Upload */}
      <div className="relative">
        <div
          className="relative h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerPreview || profile.banner_url ? (
            <img
              src={bannerPreview || profile.banner_url || ''}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" data-testid="camera-icon" />
                <p className="text-sm text-gray-500">Add banner photo</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'banner')}
          className="hidden"
        />
      </div>

      {/* Avatar Upload */}
      <div className="flex items-start gap-4">
        <div
          className="relative w-20 h-20 bg-gray-100 rounded-full border-2 border-gray-300 cursor-pointer overflow-hidden flex-shrink-0"
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarPreview || profile.avatar_url ? (
            <img
              src={avatarPreview || profile.avatar_url || ''}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <User className="w-8 h-8 text-gray-400" data-testid="camera-icon" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center rounded-full">
            <Camera className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
          className="hidden"
        />
      </div>
    </div>
  );
}

// Use server-side schema for consistency
const profileSchema = serverProfileSchema;

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ModernProfileEditorProps {
  profile: Profile;
  userId: string;
  userEmail?: string;
  onSave: (data: ProfileFormData) => Promise<void>;
  onCancel: () => void;
  useWizard?: boolean; // Whether to use the step-by-step wizard
}

export default function ModernProfileEditor({
  profile,
  userId,
  userEmail,
  onSave,
  onCancel,
  useWizard = false,
}: ModernProfileEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Get user from auth context or props
  const user = { id: userId };

  // Form setup with default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: profile.username || userEmail?.split('@')[0] || '',
      name: profile.name || '',
      bio: profile.bio || '',
      location_country: profile.location_country || '',
      location_city: profile.location_city || '',
      location_zip: profile.location_zip || '',
      // CRITICAL: Fallback to legacy location field if location_search is not set
      // This ensures consistency between view mode and edit mode
      location_search: profile.location_search || profile.location || '',
      latitude: profile.latitude || undefined,
      longitude: profile.longitude || undefined,
      // Keep legacy location for backward compatibility
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      website: profile.website || '',
      bitcoin_address: profile.bitcoin_address || '',
      lightning_address: profile.lightning_address || '',
    },
  });

  // Watch for username changes to auto-update display name if empty
  const watchedUsername = form.watch('username');
  const watchedDisplayName = form.watch('name');

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

        // Note: Success toast will be shown when profile is saved
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setPreview(null);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Fetch wallets on component mount
  useEffect(() => {
    if (profile.id) {
      fetch(`/api/wallets?profile_id=${profile.id}`)
        .then(res => res.json())
        .then(data => setWallets(data.wallets || []))
        .catch(err => {
          console.error('Failed to fetch wallets:', err);
        });
    }
  }, [profile.id]);

  // Wallet CRUD handlers
  const handleAddWallet = async (data: WalletFormData) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, profile_id: profile.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add wallet');
      }

      const { wallet } = await res.json();
      setWallets([...wallets, wallet]);
      toast.success('Wallet added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add wallet');
      throw error;
    }
  };

  const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update wallet');
      }

      const { wallet } = await res.json();
      setWallets(wallets.map(w => (w.id === walletId ? wallet : w)));
      toast.success('Wallet updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update wallet');
      throw error;
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete wallet');
      }

      setWallets(wallets.filter(w => w.id !== walletId));
      toast.success('Wallet deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete wallet');
      throw error;
    }
  };

  const handleRefreshWallet = async (walletId: string) => {
    try {
      const res = await fetch(`/api/wallets/${walletId}/refresh`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to refresh balance');
      }

      const { wallet } = await res.json();
      setWallets(wallets.map(w => (w.id === walletId ? wallet : w)));
      toast.success('Balance updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh balance');
      throw error;
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);

    try {
      // Normalize the data using our helper function
      const normalizedData = normalizeProfileData(data);
      const formData: ProfileFormData = normalizedData;

      await onSave(formData);
      // Success toast is shown by useUnifiedProfile hook

      // Close modal after successful save
      onCancel();
    } catch (error) {
      toast.error('Failed to save profile', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Use wizard if requested
  if (useWizard) {
    return (
      <ProfileWizard
        profile={profile}
        userId={userId}
        userEmail={userEmail}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Edit profile</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="rounded-full w-8 h-8 p-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Images Section */}
              <ProfileImagesSection
                profile={profile}
                avatarPreview={avatarPreview}
                bannerPreview={bannerPreview}
                avatarInputRef={avatarInputRef}
                bannerInputRef={bannerInputRef}
                handleFileUpload={handleFileUpload}
              />

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name - Main field like X */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your display name"
                          className="text-lg"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        This is how others will see you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your story..."
                          className="min-h-[80px] resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Share your story with the community
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location - Smart autocomplete */}
                <FormField
                  control={form.control}
                  name="location_search"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <LocationAutocomplete
                          value={field.value || ''}
                          onChange={locationData => {
                            if (locationData) {
                              // Update the structured location fields
                              form.setValue('location_country', locationData.country);
                              form.setValue('location_city', locationData.city);
                              form.setValue('location_zip', locationData.zipCode);
                              form.setValue('location_search', locationData.formattedAddress);

                              // Store coordinates if available (for future use)
                              if (locationData.latitude && locationData.longitude) {
                                form.setValue('latitude', locationData.latitude);
                                form.setValue('longitude', locationData.longitude);
                              }
                            } else {
                              // Clear location data
                              form.setValue('location_country', '');
                              form.setValue('location_city', '');
                              form.setValue('location_zip', '');
                              form.setValue('location_search', '');
                              form.setValue('latitude', undefined);
                              form.setValue('longitude', undefined);
                            }
                          }}
                          placeholder="Search for your city or address..."
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Start typing to find your location. This helps local people and projects
                        find you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hidden fields for structured location data */}
                <input type="hidden" {...form.register('location_country')} />
                <input type="hidden" {...form.register('location_city')} />
                <input type="hidden" {...form.register('location_zip')} />
                <input type="hidden" {...form.register('latitude')} />
                <input type="hidden" {...form.register('longitude')} />

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-website.com"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Username - Required field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => {
                    const { value, ...rest } = field;
                    return (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Username <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              @
                            </span>
                            <Input
                              placeholder="your_unique_username"
                              className="pl-8"
                              {...rest}
                              value={value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Multi-Wallet System */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bitcoin className="w-4 h-4 text-orange-500" />
                    Bitcoin Wallets
                  </h3>

                  <WalletManager
                    wallets={wallets}
                    entityType="profile"
                    entityId={profile.id}
                    onAdd={handleAddWallet}
                    onUpdate={handleUpdateWallet}
                    onDelete={handleDeleteWallet}
                    onRefresh={handleRefreshWallet}
                    maxWallets={10}
                    isOwner={true}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !watchedUsername?.trim()}
                  className="px-6 bg-black hover:bg-gray-800"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
