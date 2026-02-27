'use client';

import { logger } from '@/utils/logger';
import { useState } from 'react';
import { Profile as DatabaseProfile, ProfileFormData } from '@/types/database';
import { Profile } from '@/types/profile';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Shield, Edit as EditIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import ModernProfileEditor from './ModernProfileEditor';
import { ProfileDetailsCard } from './ProfileDetailsCard';

interface ProfileInfoTabProps {
  profile: DatabaseProfile & { email?: string | null };
  isOwnProfile?: boolean;
  userId?: string;
  userEmail?: string;
  onSave?: (data: ProfileFormData) => Promise<void>;
  /**
   * Context in which the info tab is rendered.
   * - "public": full public profile info (used on public profile pages)
   * - "dashboard": owner-focused view on /dashboard/info with less duplication
   */
  context?: 'public' | 'dashboard';
}

export default function ProfileInfoTab({
  profile,
  isOwnProfile = false,
  userId,
  userEmail,
  onSave,
  context = 'public',
}: ProfileInfoTabProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const isDashboardView = context === 'dashboard';

  const handleSave = async (data: ProfileFormData) => {
    if (onSave) {
      try {
        await onSave(data);
        setMode('view');
      } catch (error) {
        logger.error('Failed to save profile:', error);
      }
    }
  };

  if (mode === 'edit' && isOwnProfile && userId && onSave) {
    return (
      <div className="space-y-6">
        <ModernProfileEditor
          profile={profile as Profile}
          userId={userId}
          userEmail={userEmail}
          onSave={handleSave}
          onCancel={() => setMode('view')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && userId && onSave && (
        <div className="flex justify-end">
          <Button onClick={() => setMode('edit')} variant="outline">
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      )}

      <ProfileDetailsCard
        profile={profile}
        isOwnProfile={isOwnProfile}
        userEmail={userEmail}
        isDashboardView={isDashboardView}
      />

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Account Status
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email Verified</span>
            <span className={profile.email ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {profile.email ? '✓ Verified' : 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Profile Complete</span>
            <span className="text-green-600 font-medium">
              {profile.bio && profile.avatar_url ? '✓ Complete' : 'In Progress'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
