import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TimelineFeedResponse } from '@/types/timeline';
import TimelineComponent from './TimelineComponent';
import { cn } from '@/lib/utils';

export interface TimelineLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  feed: TimelineFeedResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEventUpdate: (eventId: string, updates: any) => void;
  onLoadMore: () => void;
  isLoadingMore?: boolean;
  stats?: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalFollowers?: number;
  };
  showFilters?: boolean;
  compact?: boolean;
  enableMultiSelect?: boolean; // Enable multi-select mode for bulk operations
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
  gradientFrom: _gradientFrom,
  gradientVia: _gradientVia,
  gradientTo: _gradientTo,
  feed,
  onEventUpdate,
  onLoadMore,
  isLoadingMore = false,
  stats: _stats,
  showFilters = false,
  compact = false,
  enableMultiSelect = false,
  additionalHeaderContent,
  emptyState,
  postComposer,
  inlineComposer,
}: TimelineLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto flex justify-center px-0 sm:px-4 lg:px-8">
        <div className="w-full max-w-2xl border-x border-gray-200 bg-white">
          <div
            className={cn(
              'sticky top-0 z-20 flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/95 backdrop-blur'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 text-gray-700">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {description && <p className="text-sm text-gray-500">{description}</p>}
              </div>
            </div>
            {additionalHeaderContent && (
              <div className="flex items-center gap-2">{additionalHeaderContent}</div>
            )}
          </div>

          {inlineComposer || postComposer}

          {emptyState ? (
            emptyState
          ) : (
            <TimelineComponent
              feed={feed}
              onEventUpdate={onEventUpdate}
              onLoadMore={onLoadMore}
              isLoadingMore={isLoadingMore}
              showFilters={showFilters}
              compact={compact}
              enableMultiSelect={enableMultiSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
