'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import Loading from '@/components/Loading';
import ModernProfileEditor from '@/components/profile/ModernProfileEditor';
import { Profile, ProfileFormData } from '@/types/database';
import { toast } from 'sonner';
import { Edit, HelpCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { DynamicSidebar } from '@/components/create/DynamicSidebar';
import {
  profileGuidanceContent,
  profileDefaultContent,
  type ProfileFieldType,
} from '@/lib/profile-guidance';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

/**
 * Shared config for profile completion.
 * Keeps the scoring logic and the "what's missing" list in sync.
 */
const PROFILE_COMPLETION_FIELDS = [
  {
    label: 'Username',
    weight: 20,
    isComplete: (profile: Profile) => !!profile.username?.trim(),
  },
  {
    label: 'Name',
    weight: 10,
    isComplete: (profile: Profile) => !!profile.name?.trim(),
  },
  {
    label: 'Bio',
    weight: 15,
    isComplete: (profile: Profile) => !!profile.bio?.trim(),
  },
  {
    label: 'Profile picture',
    weight: 10,
    isComplete: (profile: Profile) => !!profile.avatar_url?.trim(),
  },
  {
    label: 'Location',
    weight: 5,
    isComplete: (profile: Profile) =>
      !!(profile.location_search?.trim() || profile.location?.trim()),
  },
  {
    label: 'Website',
    weight: 5,
    isComplete: (profile: Profile) => !!profile.website?.trim(),
  },
  {
    label: 'Public contact email',
    weight: 5,
    isComplete: (profile: Profile) => !!profile.contact_email?.trim(),
  },
  {
    label: 'At least one social link',
    weight: 5,
    isComplete: (profile: Profile) => !!(profile.social_links as any)?.links?.length,
  },
  {
    label: 'Phone number',
    weight: 5,
    isComplete: (profile: Profile) => !!profile.phone?.trim(),
  },
] as const;

/**
 * Return human-readable list of which fields are still missing
 * so a non‑100% completion score is always explainable.
 */
const getProfileMissingFields = (profile: Profile | null): string[] => {
  if (!profile) {
    return [];
  }

  return PROFILE_COMPLETION_FIELDS.filter(field => !field.isComplete(profile)).map(
    field => field.label
  );
};

/**
 * Calculate profile completion percentage based on how many fields
 * from PROFILE_COMPLETION_FIELDS are complete.
 * This guarantees:
 *  - 0% when nothing is filled
 *  - 100% whenever getProfileMissingFields(profile).length === 0
 */
const getProfileCompletionPercentage = (profile: Profile | null): number => {
  if (!profile) {
    return 0;
  }

  const total = PROFILE_COMPLETION_FIELDS.length;
  if (total === 0) {
    return 0;
  }

  const completed = PROFILE_COMPLETION_FIELDS.filter(field => field.isComplete(profile)).length;

  return Math.round((completed / total) * 100);
};

/**
 * Dashboard Info Edit Page
 *
 * Edit mode for profile information.
 * Accessed via "Edit Profile" button from view mode or dropdown menu.
 * Includes guidance sidebar and completion tracking.
 *
 * UX Principles:
 * - Edit is explicit action (user navigated here intentionally)
 * - Guidance sidebar helps users complete profile
 * - Clear save/cancel actions
 * - Returns to view mode after save
 */
export default function DashboardInfoEditPage() {
  const { user, profile: storeProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedField, setFocusedField] = useState<ProfileFieldType>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showMobileGuidance, setShowMobileGuidance] = useState(false);

  // Use profile from auth store instead of fetching
  useEffect(() => {
    if (!authLoading) {
      if (storeProfile) {
        setProfile(storeProfile);
        setCompletionPercentage(getProfileCompletionPercentage(storeProfile));
      }
      setIsLoading(false);
    }
  }, [storeProfile, authLoading]);

  // Update completion percentage when profile changes
  useEffect(() => {
    if (profile) {
      setCompletionPercentage(getProfileCompletionPercentage(profile));
    }
  }, [profile]);

  // Handle hash navigation to scroll to specific field
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Focus the input if it exists
          const input = element.querySelector('input, textarea');
          if (input) {
            (input as HTMLElement).focus();
          }
        }
      }, 300);
    }
  }, []);

  // Handle profile save
  const handleSave = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save profile';
        let errorData;
        try {
          errorData = await response.json();
          console.error('Profile save error response:', errorData);

          // API returns: { success: false, error: { code, message, details } }
          if (errorData?.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error?.message) {
              errorMessage = errorData.error.message;
              // Include field details if available
              if (errorData.error.details?.field) {
                errorMessage = `${errorData.error.details.field}: ${errorMessage}`;
              }
            } else {
              errorMessage = errorData.error.code || 'Validation error';
            }
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            // Fallback: try to extract any meaningful message
            errorMessage = JSON.stringify(errorData);
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // If JSON parsing fails, use response status text
          errorMessage = response.statusText || `HTTP ${response.status}: Failed to save profile`;
        }

        // Log full error for debugging
        console.error('Profile save failed:', {
          status: response.status,
          errorData,
          errorMessage,
          sentData: data,
        });

        throw new Error(errorMessage);
      }

      // Refresh profile data from API
      const updatedResponse = await fetch('/api/profile');
      if (updatedResponse.ok) {
        const result = await updatedResponse.json();
        // Unwrap the API response structure
        if (result.success && result.data) {
          setProfile(result.data);
          // Update auth store as well
          useAuthStore.getState().fetchProfile();
        }
      }

      // Show success toast
      toast.success('Profile saved successfully! 💾', {
        description: 'Your profile has been updated',
        duration: 3000,
      });

      // Navigate back to view mode immediately
      router.push('/dashboard/info');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
      throw error; // Re-throw so ModernProfileEditor can handle it
    }
  };

  // Handle cancel - navigate back to view mode
  const handleCancel = () => {
    router.push('/dashboard/info');
  };

  // Loading state
  if (authLoading || isLoading) {
    return <Loading />;
  }

  // Not authenticated
  if (!user) {
    router.push('/auth');
    return <Loading />;
  }

  // No profile loaded yet – fall back to loading state instead of error to avoid flash
  if (!profile) {
    return <Loading />;
  }

  const missingFields = getProfileMissingFields(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Mobile: Compact Progress Bar at Top */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completionPercentage === 100 ? (
              <div className="flex items-center gap-2 text-xs text-green-700 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">Profile complete!</span>
              </div>
            ) : (
              <div className="mt-3 text-xs text-gray-700">
                <div className="font-medium mb-1">To reach 100%, add:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {missingFields.map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/dashboard/info">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to View
              </Button>
            </Link>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Edit className="w-5 h-5 text-orange-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Edit Profile</h1>
          </div>
          <p className="text-base text-gray-600 ml-12">
            Update your profile details. This information will be visible on your public profile.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12">
          {/* Desktop: Progress Card & Guidance Sidebar */}
          <div className="hidden lg:block lg:col-span-5 lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Progress Card */}
              <Card className="p-6 shadow-sm border-gray-200">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Profile Completion</h3>
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                {completionPercentage < 100 && (
                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-medium mb-1">To reach 100%, add:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {getProfileMissingFields(profile).map(field => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 mt-4">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Profile complete!</span>
                  </div>
                )}
              </Card>

              {/* Dynamic Guidance - Desktop Only */}
              <DynamicSidebar<ProfileFieldType>
                activeField={focusedField}
                guidanceContent={profileGuidanceContent}
                defaultContent={profileDefaultContent}
              />
            </div>
          </div>

          {/* Main Content - Profile Form */}
          <div className="lg:col-span-7 lg:order-1">
            <ModernProfileEditor
              profile={profile}
              userId={user.id}
              userEmail={user.email}
              onSave={handleSave}
              onCancel={handleCancel}
              onFieldFocus={setFocusedField}
              inline={true}
            />
          </div>
        </div>

        {/* Mobile: Floating Help Button */}
        {focusedField && (
          <button
            onClick={() => setShowMobileGuidance(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Get help"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        )}

        {/* Mobile: Guidance Modal */}
        {showMobileGuidance && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            onClick={() => setShowMobileGuidance(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Help & Guidance</h3>
                <button
                  onClick={() => setShowMobileGuidance(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <DynamicSidebar<ProfileFieldType>
                  activeField={focusedField}
                  guidanceContent={profileGuidanceContent}
                  defaultContent={profileDefaultContent}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
