'use client';

import { Suspense, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Profile } from '@/types/database';
import TimelineView from '@/components/timeline/TimelineView';
import TimelineComposer from '@/components/timeline/TimelineComposer';

interface ProfileTimelineTabProps {
  profile: Profile;
  isOwnProfile?: boolean;
}

/**
 * ProfileTimelineTab Component
 *
 * Displays timeline for profile pages using modular architecture.
 * - Shows posts that appear on this profile's timeline (subject_id = profile.id)
 * - Allows posting to profile timeline (anyone can post if enabled)
 * - Reuses TimelineView and TimelineComposer components (DRY)
 */
export default function ProfileTimelineTab({ profile, isOwnProfile }: ProfileTimelineTabProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = useCallback(() => {
    // Trigger timeline refresh by updating key
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Composer - Allow posting on profile timeline */}
      <TimelineComposer
        targetOwnerId={profile.id}
        targetOwnerType="profile"
        targetOwnerName={profile.display_name || profile.username || 'User'}
        allowProjectSelection={true}
        onPostCreated={handlePostCreated}
        showBanner={!isOwnProfile}
      />

      {/* Timeline Feed - Posts on this profile */}
      <Suspense fallback={<TimelineLoadingSkeleton />}>
        <TimelineView
          key={refreshKey}
          feedType="profile"
          ownerId={profile.id}
          ownerType="profile"
          showComposer={false} // Composer shown above
          compact={false}
          showFilters={false}
          emptyStateTitle="No posts yet"
          emptyStateDescription={
            isOwnProfile
              ? 'Your timeline is empty. Share your first update!'
              : 'No posts on this timeline yet. Be the first to post!'
          }
          onPostCreated={handlePostCreated}
        />
      </Suspense>
    </div>
  );
}

/**
 * Loading skeleton for timeline
 */
function TimelineLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
