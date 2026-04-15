import { Skeleton } from '../Skeleton';
import {
  ListItemSkeleton,
  PageHeaderSkeleton,
  TimelinePostSkeleton,
} from './component-variants';

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

// Re-export for convenience
export { TimelinePostSkeleton };
