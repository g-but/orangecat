'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CardDescription, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TimelineComponent from '@/components/timeline/TimelineComponent';
import TimelineComposer from '@/components/timeline/TimelineComposer';
import { TimelineFeedResponse } from '@/types/timeline';
import { BookOpen, MessageSquare, Compass, RefreshCw, AlertCircle } from 'lucide-react';
import { TimelinePostSkeleton } from '@/components/ui/Skeleton';

interface DashboardTimelineProps {
  timelineFeed: TimelineFeedResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onPostSuccess: () => void;
  userId?: string;
}

/**
 * DashboardTimeline - Modular timeline component for dashboard
 *
 * Uses existing TimelineComponent and TimelineComposer (DRY principle).
 * No duplicate implementations - reuses established patterns.
 */
export function DashboardTimeline({
  timelineFeed,
  isLoading,
  error,
  onRefresh,
  onPostSuccess,
  userId,
}: DashboardTimelineProps) {
  const router = useRouter();

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Composer surface matches timeline UI */}
      <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <TimelineComposer
          targetOwnerId={userId}
          targetOwnerType="profile"
          allowProjectSelection={true}
          onPostCreated={onPostSuccess}
          placeholder="Share an update..."
          buttonText="Post"
        />
      </div>

      {/* Timeline feed surface matches timeline UI */}
      <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">My Timeline</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-500">
              Recent activities, posts, and updates
            </CardDescription>
          </div>
          <Link href="/timeline" className="shrink-0">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">View Full Timeline</span>
              <span className="sm:hidden">Full Timeline</span>
            </Button>
          </Link>
        </div>
        <div className="p-0">
          {isLoading ? (
            <div className="py-3 sm:py-4 px-4 sm:px-0">
              {[...Array(3)].map((_, idx) => (
                <TimelinePostSkeleton key={idx} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 sm:py-10 text-red-600 px-4 sm:px-6">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base font-medium mb-2">Failed to load timeline</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{error}</p>
              <Button variant="outline" onClick={onRefresh} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : timelineFeed && timelineFeed.events.length > 0 ? (
            <div className="min-h-[200px]">
              <TimelineComponent
                feed={timelineFeed}
                onLoadMore={onRefresh}
                showFilters={false}
                compact={false}
              />
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 px-4 text-gray-500">
              <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Start My Timeline</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
                Share your first update! My timeline will show your posts, project updates, and
                interactions with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Button
                  onClick={() => router.push('/timeline?compose=true')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Share Your First Post
                </Button>
                <Link href="/discover">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore Community
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardTimeline;
