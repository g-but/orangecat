'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TimelineComponent from '@/components/timeline/TimelineComponent';
import TimelineComposer from '@/components/timeline/TimelineComposer';
import { TimelineFeedResponse } from '@/types/timeline';
import {
  BookOpen,
  MessageSquare,
  Compass,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

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
    <main className="lg:col-span-9 space-y-6">
      {/* Timeline Composer - Use existing component! */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <TimelineComposer
            targetOwnerId={userId}
            targetOwnerType="profile"
            allowProjectSelection={true}
            onPostCreated={onPostSuccess}
            placeholder="Share an update..."
            buttonText="Post"
          />
        </CardContent>
      </Card>

      {/* Timeline Feed */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Timeline</CardTitle>
              <CardDescription>Recent activities, posts, and updates</CardDescription>
            </div>
            <Link href="/timeline">
              <Button variant="outline" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                View Full Timeline
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your activity feed...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p className="mb-2">Failed to load timeline</p>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : timelineFeed && timelineFeed.events.length > 0 ? (
            <TimelineComponent
              feed={timelineFeed}
              onLoadMore={() => {
                // TODO: Implement pagination
              }}
              showFilters={false}
              compact={true}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Timeline</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Share your first update! Your timeline will show your posts, project updates, and interactions with the community.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push('/timeline?compose=true')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Share Your First Post
                </Button>
                <Link href="/discover">
                  <Button variant="outline">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore Community
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
