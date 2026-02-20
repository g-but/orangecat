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
    <div className="flex gap-3 px-4 py-4 border-b border-gray-200 bg-white">
      {/* Avatar */}
      <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />

      <div className="flex-1 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
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
          className={cn('h-4', index === 0 ? 'w-32' : index === columns - 1 ? 'w-20' : 'flex-1')}
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

/**
 * Loan Card Skeleton
 * Matches the LoanCard component layout
 */
export function LoanCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Financial summary */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Interest rate */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * Profile Card Skeleton
 * Matches the ProfileCard component layout for grid view
 */
// ---------------------------------------------------------------------------
// Page-Level Skeleton Compositions
// Used by loading.tsx files across all routes
// ---------------------------------------------------------------------------

/**
 * Entity List Page Skeleton
 * For dashboard list pages (store, services, causes, etc.)
 */
export function EntityListPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </div>
  );
}

/**
 * Entity Detail Page Skeleton
 * For detail pages ([id] routes)
 */
export function EntityDetailPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-4 mt-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Form Page Skeleton
 * For create/edit pages
 */
export function FormPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <PageHeaderSkeleton />
      <div className="space-y-6 mt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Settings Page Skeleton
 * For settings, info, analytics pages
 */
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeaderSkeleton />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * Chat Page Skeleton
 * For AI chat pages
 */
export function ChatPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-16 w-2/3 rounded-xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton className="h-12 w-1/2 rounded-xl" />
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-24 w-2/3 rounded-xl" />
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Auth Page Skeleton
 * For auth, onboarding pages
 */
export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfileCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    );
  }

  // Grid view
  return (
    <div className="p-6 rounded-xl border border-gray-200 bg-white">
      <div className="text-center">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-center gap-2 mb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 mx-auto mb-3" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mx-auto" />
          <Skeleton className="h-4 w-4/6 mx-auto" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}
