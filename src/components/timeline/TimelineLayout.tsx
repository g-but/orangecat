import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TimelineFeedResponse } from '@/types/timeline';
import TimelineComponent from './TimelineComponent';
import { useHeaderScroll } from '@/hooks/useHeaderScroll';
import { cn } from '@/lib/utils';

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
  gradientFrom,
  gradientVia,
  gradientTo,
  feed,
  onEventUpdate,
  onLoadMore,
  stats,
  showFilters = false,
  compact = false,
  enableMultiSelect = false,
  additionalHeaderContent,
  emptyState,
  postComposer,
  inlineComposer,
}: TimelineLayoutProps) {
  const { isHidden } = useHeaderScroll({ hideOnScrollDown: true, scrollThreshold: 50 });
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}>
      <div className="max-w-7xl mx-auto">
        {/* Desktop: Full header card - Hidden on mobile */}
        <div className="hidden sm:block p-4 sm:p-6 lg:p-8 space-y-8">
          <div className={cn(
            "relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/40 rounded-3xl border border-white/50 backdrop-blur-sm p-8 transition-all duration-300",
            isHidden && "opacity-0 -translate-y-full h-0 p-0 mb-0 pointer-events-none"
          )}>
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
        </div>

        {/* Content area - Mobile: no extra padding, Desktop: normal padding */}
        <div className="px-0 sm:px-4 sm:px-6 lg:px-8 space-y-0 sm:space-y-8">

          {/* Post Composer - Show inline composer first, or standalone composer */}
          {inlineComposer || postComposer}

          {/* Timeline Stats - Hidden to save space (like X doesn't show stats on timeline) */}

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
              enableMultiSelect={enableMultiSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
