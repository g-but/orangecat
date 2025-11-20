'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import Loading from '@/components/Loading';
import ModernProfileEditor from '@/components/profile/ModernProfileEditor';
import { Profile, ProfileFormData } from '@/types/database';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

/**
 * Dashboard Info Page
 *
 * Private page for users to edit their profile information.
 * Reuses ModernProfileEditor component following DRY principles.
 *
 * Single source of truth: Auth store for profile data
 * Separation of concerns: This page handles editing, auth store handles fetching
 */
export default function DashboardInfoPage() {
  const { user, profile: storeProfile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use profile from auth store instead of fetching
  useEffect(() => {
    if (!authLoading) {
      if (storeProfile) {
        setProfile(storeProfile);
      }
      setIsLoading(false);
    }
  }, [storeProfile, authLoading]);

  // Handle profile save
  const handleSave = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');

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

      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
      throw error; // Re-throw so ModernProfileEditor can handle it
    }
  };

  // Handle cancel - navigate back to dashboard
  const handleCancel = () => {
    router.push('/dashboard');
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

  // No profile loaded
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile Information</h1>
        </div>
        <p className="text-gray-600">
          Update your profile details. This information will be visible on your public profile.
        </p>
      </div>

      {/* Profile Editor */}
      <ModernProfileEditor
        profile={profile}
        userId={user.id}
        userEmail={user.email}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
