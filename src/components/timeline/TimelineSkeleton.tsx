'use client';

import React from 'react';

interface TimelineSkeletonProps {
  count?: number;
  compact?: boolean;
}

export function TimelineSkeleton({ count = 3, compact = false }: TimelineSkeletonProps) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg animate-pulse">
          <div className={`p-4 ${compact ? 'p-3' : 'p-4'}`}>
            <div className="flex items-start space-x-3">
              {/* Avatar skeleton */}
              <div className={`bg-gray-200 rounded-full flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`} />

              <div className="flex-1 min-w-0">
                {/* Header skeleton */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>

                {/* Content skeleton */}
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>

                {/* Metrics skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="h-3 bg-gray-200 rounded w-12" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                    <div className="h-3 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version for mobile
export function TimelineSkeletonCompact({ count = 3 }: { count?: number }) {
  return <TimelineSkeleton count={count} compact={true} />;
}

// Full-width version for larger screens
export function TimelineSkeletonFull({ count = 3 }: { count?: number }) {
  return <TimelineSkeleton count={count} compact={false} />;
}




























