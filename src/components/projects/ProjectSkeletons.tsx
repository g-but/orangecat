/**
 * Project Card Skeleton - Loading state for project cards
 *
 * Created: 2025-01-27
 */

'use client';

export function ProjectCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-[16/10] w-full bg-gray-200" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded w-3/4" />

          {/* Creator skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="space-y-1 flex-1">
              <div className="h-2 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-4/6" />
          </div>
        </div>

        {/* Metrics skeleton */}
        <div className="mt-4 flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProjectTileSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 border border-gray-200 rounded-lg bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-5 bg-gray-200 rounded w-32" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>

      {/* Description skeleton */}
      <div className="flex-1 mb-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
      </div>

      {/* Category skeleton */}
      <div className="mb-3">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>

      {/* Funding skeleton */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-6 bg-gray-200 rounded w-24" />
      </div>

      {/* Button skeleton */}
      <div className="h-9 bg-gray-200 rounded w-full" />
    </div>
  );
}

export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProjectsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectTileSkeleton key={i} />
      ))}
    </div>
  );
}
