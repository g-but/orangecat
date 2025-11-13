import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TimelineFeedResponse } from '@/types/timeline';
import TimelineComponent from './TimelineComponent';

export interface TimelineLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  feed: TimelineFeedResponse;
  onEventUpdate: (eventId: string, updates: any) => void;
  onLoadMore: () => void;
  stats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers?: number;
  };
  showFilters?: boolean;
  compact?: boolean;
  additionalHeaderContent?: React.ReactNode;
  emptyState?: React.ReactNode;
  postComposer?: React.ReactNode;
  inlineComposer?: React.ReactNode;
}

/**
 * Reusable Timeline Layout Component
 *
 * DRY-compliant layout for timeline-based pages (Journey, Community, etc.)
 * Provides consistent styling, structure, and behavior across all timeline views.
 */
export default function TimelineLayout({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientVia,
  gradientTo,
  feed,
  onEventUpdate,
  onLoadMore,
  stats,
  showFilters = false,
  compact = false,
  additionalHeaderContent,
  emptyState,
  postComposer,
  inlineComposer,
}: TimelineLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Timeline Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/40 rounded-3xl border border-white/50 backdrop-blur-sm p-8">
          {/* Background decoration */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-bitcoinOrange/10 to-tiffany-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-tiffany-400/10 to-orange-300/10 rounded-full blur-xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-bitcoinOrange/20 to-orange-400/20 rounded-2xl backdrop-blur-sm">
                <Icon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
              </div>
            </div>

            {/* Additional header content (sort controls, etc.) */}
            {additionalHeaderContent && <div className="flex gap-2">{additionalHeaderContent}</div>}
          </div>
        </div>

        {/* Post Composer - Show inline composer first, or standalone composer */}
        {inlineComposer || postComposer}

        {/* Timeline Stats - Only show if there's content */}
        {stats && feed.events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPosts}</div>
                <div className="text-sm text-gray-600">Posts & Updates</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
                <div className="text-sm text-gray-600">Likes Received</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalComments}</div>
                <div className="text-sm text-gray-600">Comments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalFollowers || 0}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline Feed - Simplified, no extra Card wrapper */}
        {emptyState ? (
          emptyState
        ) : (
          <TimelineComponent
            feed={feed}
            onEventUpdate={onEventUpdate}
            onLoadMore={onLoadMore}
            showFilters={showFilters}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}
