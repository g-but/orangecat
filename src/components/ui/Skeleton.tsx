import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Skeleton Component
 *
 * Usage:
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  );
}

/**
 * Project Card Skeleton
 * Matches the ModernProjectCard component layout
 */
export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      {/* Image skeleton */}
      <Skeleton className="aspect-[16/10] w-full rounded-t-2xl" />

      {/* Content skeleton */}
      <div className="flex flex-col gap-4 p-5">
        {/* Category badge */}
        <Skeleton className="h-6 w-20 rounded-full" />

        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Description lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Creator section */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline Post Skeleton
 * Matches the TimelineComponent post layout
 */
export function TimelinePostSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

          {/* Author and timestamp */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* More menu */}
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

/**
 * Profile Header Skeleton
 * Matches the PublicProfileClient banner/avatar layout
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="relative">
      {/* Banner skeleton */}
      <Skeleton className="h-48 md:h-64 lg:h-80 w-full rounded-2xl" />

      {/* Avatar skeleton - positioned absolutely */}
      <div className="absolute -bottom-12 left-4 md:-bottom-16 md:left-8">
        <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-2xl border-4 border-white dark:border-gray-900" />
      </div>

      {/* Name and bio skeleton */}
      <div className="mt-16 md:mt-20 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/**
 * Dashboard Stat Card Skeleton
 * Matches the dashboard metric cards
 */
export function DashboardStatSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  );
}

/**
 * Comment Skeleton
 * Matches the comment component in timeline
 */
export function CommentSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      {/* Avatar */}
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

/**
 * List Item Skeleton
 * Generic skeleton for lists
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
      <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

/**
 * Grid Skeleton
 * For grid layouts - renders multiple skeletons
 */
interface GridSkeletonProps {
  count?: number;
  children: React.ReactNode;
  className?: string;
}

export function GridSkeleton({ count = 6, children, className }: GridSkeletonProps) {
  return (
    <div className={cn('grid gap-6', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{children}</div>
      ))}
    </div>
  );
}

/**
 * Table Row Skeleton
 * For table/list views
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === 0 ? 'w-32' : index === columns - 1 ? 'w-20' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Avatar with Name Skeleton
 * Common pattern for user info
 */
export function AvatarNameSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Page Header Skeleton
 * For page titles and descriptions
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

/**
 * Button Skeleton
 * Matches button sizes
 */
export function ButtonSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = {
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-12',
  };

  return <Skeleton className={cn(heights[size], 'w-24 rounded-lg')} />;
}
