'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import Loading from '@/components/Loading';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import ProfileOverviewTab from '@/components/profile/ProfileOverviewTab';
import { Profile } from '@/types/database';
import { Info, Edit, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

/**
 * Dashboard Info Page - VIEW MODE
 *
 * Shows profile information in read-only mode.
 * This is the default view when accessing "My Info" from the sidebar.
 * Users can click "Edit Profile" button to switch to edit mode.
 *
 * UX Principles:
 * - View is default (less cognitive load, see info first)
 * - Edit is explicit action (user chooses to edit)
 * - Clear separation of concerns (view vs edit)
 * - Consistent with dashboard patterns
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

  // Refresh profile after edits (called when returning from edit page)
  useEffect(() => {
    // Refresh profile when component mounts or when returning from edit
    if (storeProfile) {
      setProfile(storeProfile);
    }
  }, [storeProfile]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-4xl lg:max-w-5xl px-3 sm:px-4 py-5 sm:py-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Info className="w-5 h-5 text-orange-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Info</h1>
            </div>
            <div className="sm:inline-flex">
              <Link href="/dashboard/info/edit">
                <Button className="w-full sm:w-auto justify-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <p className="mt-1 text-sm sm:text-base text-gray-600 sm:ml-12">
            View your profile information. This is what others see on your public profile.
          </p>
        </div>

        {/* Profile Information Display */}
        <div className="space-y-6">
          {/* Overview Section */}
          <ProfileOverviewTab profile={profile} isOwnProfile={true} context="dashboard" />

          {/* Detailed Info Section - Read-only view */}
          <ProfileInfoTab
            profile={profile as any}
            isOwnProfile={true}
            userId={user.id}
            userEmail={user.email}
            context="dashboard"
            // Don't pass onSave - this makes it read-only view mode
            // Edit functionality is handled by navigating to /dashboard/info/edit
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {profile.username && (
                  <Link href={`/profiles/${profile.username}`}>
                    <Button variant="outline">
                      <Info className="w-4 h-4 mr-2" />
                      View Public Profile
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/wallets">
                  <Button variant="outline">Manage Wallets</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
