'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Save, X, MapPin, Link as LinkIcon, User, Camera, Mail, Phone } from 'lucide-react';
import { LocationInput } from '@/components/ui/LocationInput';

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
import {
  buildLocationContext,
  parseLocationContext,
  type LocationMode,
} from '@/lib/location-privacy';
import { ProfileStorageService } from '@/services/profile/storage';
import ProfileWizard from './ProfileWizard';
import { SocialLinksEditor } from './SocialLinksEditor';
import { SocialLink } from '@/types/social';
import { ProfileFieldType } from '@/lib/profile-guidance';

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
  onFieldFocus?: (field: ProfileFieldType) => void; // For guidance sidebar
  inline?: boolean; // If true, render inline instead of as modal
}

export default function ModernProfileEditor({
  profile,
  userId,
  userEmail,
  onSave,
  onCancel,
  useWizard = false,
  onFieldFocus,
  inline = false,
}: ModernProfileEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Get user from auth context or props
  const user = { id: userId };

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
      // CRITICAL: Fallback to legacy location field if location_search is not set
      // This ensures consistency between view mode and edit mode
      location_search: profile.location_search || profile.location || '',
      latitude: profile.latitude || undefined,
      longitude: profile.longitude || undefined,
      // Include context so privacy/group can be persisted
      // Note: may contain tokens like [HIDE] or [GROUP]:<label>
      location_context: (profile as any).location_context || '',
      // Keep legacy location for backward compatibility
      location: profile.location || '',
      avatar_url: profile.avatar_url || '',
      banner_url: profile.banner_url || '',
      website: profile.website || '',
      // Social & Contact
      social_links: socialLinks.length > 0 ? { links: socialLinks } : undefined,
      contact_email: (profile as any).contact_email || userEmail || '',
      phone: (profile as any).phone || '',
      // Wallet fields (kept for backward compatibility, but wallets managed separately)
      bitcoin_address: profile.bitcoin_address || '',
      lightning_address: profile.lightning_address || '',
    },
  });

  // Watch for username changes to auto-update display name if empty
  const watchedUsername = form.watch('username');
  const watchedDisplayName = form.watch('name');
  const watchedLocationContext = form.watch('location_context');
  const watchedLocationSearch = form.watch('location_search');

  // Local UI state for location visibility/group
  const [locationMode, setLocationMode] = useState<LocationMode>(() =>
    parseLocationContext((profile as any).location_context).mode
  );
  const [locationGroupLabel, setLocationGroupLabel] = useState<string>(() => {
    const parsed = parseLocationContext((profile as any).location_context);
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

        // Note: Success toast will be shown when profile is saved
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
      let adjusted: ProfileFormValues = { ...data };
      if (locationMode === 'hidden') {
        adjusted.location_context = buildLocationContext(
          adjusted.location_context,
          'hidden'
        );
        // Keep stored location data, but UI will hide it
      } else if (locationMode === 'group') {
        const group = locationGroupLabel?.trim() || '';
        // Use group label as the display location and clear structured geo
        adjusted.location_search = group;
        adjusted.location_country = '' as any;
        adjusted.location_city = '' as any;
        adjusted.location_zip = '' as any;
        adjusted.latitude = undefined;
        adjusted.longitude = undefined;
        adjusted.location_context = buildLocationContext(adjusted.location_context, 'group', group);
      } else {
        // actual: ensure tokens removed
        adjusted.location_context = buildLocationContext(adjusted.location_context, 'actual');
      }

      // Ensure social_links includes current state, converting null labels to undefined
      const normalizedLinks =
        socialLinks.length > 0
          ? {
              links: socialLinks.map(link => ({
                platform: link.platform,
                value: link.value,
                label: link.label || undefined, // Convert null to undefined
              })),
            }
          : undefined;

      const dataWithSocialLinks = {
        ...adjusted,
        social_links: normalizedLinks,
      };

      // Normalize the data using our helper function
      const normalizedData = normalizeProfileData(dataWithSocialLinks);
      // Type assertion needed because normalizeProfileData may return types with null labels
      const formData = normalizedData as ProfileFormData;

      await onSave(formData);
      // Success toast is shown by useUnifiedProfile hook

      // Don't call onCancel here - let the parent handle navigation
      // The edit page will navigate after showing success toast
    } catch (error) {
      // Extract error message properly
      let errorMessage = 'Please try again';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract message from error object
        errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
      }

      toast.error('Failed to save profile', {
        description: errorMessage,
      });

      // Also log to console for debugging
      console.error('Profile save error:', error);
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
        userEmail={(typeof userEmail === 'string' ? userEmail : '') || ''}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  // Render inline (for dedicated edit page) or as modal (for popup editing)
  if (inline) {
    // Inline mode: clean form layout without modal wrapper (page provides header/layout)
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Debug: Show form errors if any */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 mb-2">
                      Please fix the following errors:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      {Object.entries(form.formState.errors).map(([field, error]) => (
                        <li key={field}>
                          <span className="font-medium">{field}:</span>{' '}
                          {error?.message?.toString() || 'Invalid value'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
            <div className="space-y-8">
              {/* SECTION: Profile */}
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Profile
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Your basic profile information – username, name, bio and location.
                  </p>
                </div>

                {/* Username - Required field (moved early) */}
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
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium z-10 pointer-events-none">
                              @
                            </span>
                            <Input
                              placeholder="your_unique_username"
                              className="pl-8"
                              {...rest}
                              value={value || ''}
                              onFocus={() => onFieldFocus?.('username')}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Name - Display name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem id="name">
                      <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your display name"
                          {...field}
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('name')}
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
                    <FormItem id="bio">
                      <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell your story..."
                          className="min-h-[80px] resize-none"
                          {...field}
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('bio')}
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
                    <FormItem id="location">
                      <FormLabel className="text-sm font-medium text-gray-700">Location</FormLabel>
                      <FormControl>
                        <LocationInput
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('location')}
                          onChange={locationData => {
                            if (locationData) {
                              // Update the structured location fields
                              form.setValue('location_country', locationData.country);
                              form.setValue('location_city', locationData.city);
                              form.setValue('location_zip', locationData.zipCode);
                              form.setValue('location_search', locationData.formattedAddress);

                              // Store canton/state information in location_context
                              if (locationData.country === 'CH' && locationData.canton) {
                                // Swiss canton
                                const cantonInfo = locationData.cantonCode
                                  ? `${locationData.canton} (${locationData.cantonCode})`
                                  : locationData.canton;
                                form.setValue('location_context', cantonInfo);
                              } else if (locationData.state) {
                                // Other countries - store state/province
                                const stateInfo = locationData.stateCode
                                  ? `${locationData.state} (${locationData.stateCode})`
                                  : locationData.state;
                                form.setValue('location_context', stateInfo);
                              }

                              // Store coordinates if available (for future use)
                              if (locationData.latitude && locationData.longitude) {
                                form.setValue('latitude', locationData.latitude);
                                form.setValue('longitude', locationData.longitude);
                              }
                              // If user was in group mode, switch back to actual
                              if (locationMode !== 'actual') {
                                setLocationMode('actual');
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
                          placeholder="Type your city or address..."
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Choose how this appears below: show real city, hide it, or use a custom
                        group like "Moon" or "Hell".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location visibility/group controls */}
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Location visibility</div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="location_mode"
                        className="accent-orange-600"
                        checked={locationMode === 'actual'}
                        onChange={() => setLocationMode('actual')}
                      />
                      Show actual city/region
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="location_mode"
                        className="accent-orange-600"
                        checked={locationMode === 'hidden'}
                        onChange={() => setLocationMode('hidden')}
                      />
                      Hide my location
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="location_mode"
                        className="accent-orange-600"
                        checked={locationMode === 'group'}
                        onChange={() => setLocationMode('group')}
                      />
                      Use custom group
                    </label>
                  </div>
                  {locationMode === 'group' && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        placeholder="e.g., Hell, Moon, 69420"
                        value={locationGroupLabel}
                        onChange={e => setLocationGroupLabel(e.target.value)}
                        className="max-w-sm"
                      />
                      <span className="text-xs text-gray-500">People with the same label see each other.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden fields for structured location data */}
              <input type="hidden" {...form.register('location_country')} />
              <input type="hidden" {...form.register('location_city')} />
              <input type="hidden" {...form.register('location_zip')} />
              <input type="hidden" {...form.register('latitude')} />
              <input type="hidden" {...form.register('longitude')} />
              <input type="hidden" {...form.register('location_context')} />

              {/* SECTION: Online presence */}
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Online Presence
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Your website and social media – where people can find you online.
                  </p>
                </div>

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem id="website">
                      <FormLabel className="text-sm font-medium text-gray-700">Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-website.com"
                          {...field}
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('website')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Social Media & Links */}
                <div id="socialLinks" className="pt-4 mt-2 border-t border-gray-100">
                  <div onFocus={() => onFieldFocus?.('socialLinks')} tabIndex={-1}>
                    <SocialLinksEditor
                      links={socialLinks}
                      onChange={setSocialLinks}
                      maxLinks={15}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    💡 Want to add wallets? Manage them in{' '}
                    <a
                      href="/dashboard/wallets"
                      className="text-orange-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      My Wallets
                    </a>
                  </p>
                </div>
              </div>

              {/* SECTION: Contact Information */}
              <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Contact Information
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">How people can reach you directly.</p>
                </div>

                {/* Contact Email */}
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem id="contactEmail">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Contact Email (public)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          {...field}
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('contactEmail')}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Visible on your public profile. Defaults to your registration email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Registration Email (read-only) */}
                {userEmail && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        Registration Email (private)
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{userEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">Used for account login only</p>
                  </div>
                )}

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem id="phone">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Phone (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+41 XX XXX XX XX"
                          {...field}
                          value={field.value || ''}
                          onFocus={() => onFieldFocus?.('phone')}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Helps supporters contact you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons - Save is primary CTA */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200 mt-6 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
                className="px-4 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !watchedUsername?.trim()}
                className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-bitcoinOrange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Modal mode (default)
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
              <div className="space-y-8">
                {/* SECTION: Profile */}
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                  <div className="mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Profile
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Your basic profile information – username, name, bio and location.
                    </p>
                  </div>

                  {/* Username - Required field (moved early) */}
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
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium z-10 pointer-events-none">
                                @
                              </span>
                              <Input
                                placeholder="your-username"
                                className="pl-8"
                                {...rest}
                                value={value || ''}
                                onFocus={() => onFieldFocus?.('username')}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Your unique identifier. Cannot be changed later.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Display Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Display Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Name"
                            {...field}
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('name')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem id="bio">
                        <FormLabel className="text-sm font-medium text-gray-700">Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell your story..."
                            className="min-h-[80px] resize-none"
                            {...field}
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('bio')}
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
                      <FormItem id="location">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Location
                        </FormLabel>
                        <FormControl>
                          <LocationInput
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('location')}
                            onChange={locationData => {
                              if (locationData) {
                                // Update the structured location fields
                                form.setValue('location_country', locationData.country);
                                form.setValue('location_city', locationData.city);
                                form.setValue('location_zip', locationData.zipCode);
                                form.setValue('location_search', locationData.formattedAddress);

                                // Store canton/state information in location_context
                                if (locationData.country === 'CH' && locationData.canton) {
                                  // Swiss canton
                                  const cantonInfo = locationData.cantonCode
                                    ? `${locationData.canton} (${locationData.cantonCode})`
                                    : locationData.canton;
                                  form.setValue('location_context', cantonInfo);
                                } else if (locationData.state) {
                                  // Other countries - store state/province
                                  const stateInfo = locationData.stateCode
                                    ? `${locationData.state} (${locationData.stateCode})`
                                    : locationData.state;
                                  form.setValue('location_context', stateInfo);
                                }

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
                            placeholder="Type your city or address..."
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Just type your city or address – we'll find it. Works everywhere in the
                          world.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Hidden fields for structured location data */}
                <input type="hidden" {...form.register('location_country')} />
                <input type="hidden" {...form.register('location_city')} />
                <input type="hidden" {...form.register('location_zip')} />
                <input type="hidden" {...form.register('latitude')} />
                <input type="hidden" {...form.register('longitude')} />

                {/* SECTION: Online presence */}
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                  <div className="mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Online Presence
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Your website and social media – where people can find you online.
                    </p>
                  </div>

                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem id="website">
                        <FormLabel className="text-sm font-medium text-gray-700">Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-website.com"
                            {...field}
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('website')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Social Media & Links */}
                  <div id="socialLinks" className="pt-4 mt-2 border-t border-gray-100">
                    <div onFocus={() => onFieldFocus?.('socialLinks')} tabIndex={-1}>
                      <SocialLinksEditor
                        links={socialLinks}
                        onChange={setSocialLinks}
                        maxLinks={15}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      💡 Want to add wallets? Manage them in{' '}
                      <a
                        href="/dashboard/wallets"
                        className="text-orange-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        My Wallets
                      </a>
                    </p>
                  </div>
                </div>

                {/* SECTION: Contact Information */}
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white/80 px-4 py-5 sm:px-5 sm:py-6">
                  <div className="mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Contact Information
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">How people can reach you directly.</p>
                  </div>

                  {/* Contact Email */}
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem id="contactEmail">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Contact Email (public)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@example.com"
                            {...field}
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('contactEmail')}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Visible on your public profile. Defaults to your registration email.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Registration Email (read-only) */}
                  {userEmail && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">
                          Registration Email (private)
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{userEmail}</p>
                      <p className="text-xs text-gray-500 mt-1">Used for account login only</p>
                    </div>
                  )}

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem id="phone">
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Phone (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+41 XX XXX XX XX"
                            {...field}
                            value={field.value || ''}
                            onFocus={() => onFieldFocus?.('phone')}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Helps supporters contact you
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons - Save is primary CTA */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-lg">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="px-4 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !watchedUsername?.trim()}
                  className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-bitcoinOrange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Profile
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
