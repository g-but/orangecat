'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import EntityCard, { EntityCardProps } from './EntityCard';
import { Skeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

/**
 * EntityList - Modular, reusable list component for displaying entities in a grid
 * 
 * Features:
 * - Responsive grid (1 col mobile, 2 tablet, 3+ desktop)
 * - Skeleton loading states
 * - Empty states
 * - Type-safe with generics
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Initial creation of modular entity list component
 */

export interface EntityItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  [key: string]: any; // Allow additional properties
}

export interface EntityListProps<T extends EntityItem> {
  items: T[];
  isLoading?: boolean;
  makeHref: (item: T) => string;
  makeCardProps: (item: T) => Omit<EntityCardProps, 'id' | 'title' | 'description' | 'thumbnailUrl' | 'href'>;
  emptyState?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };
  className?: string;
  gridCols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  skeletonCount?: number;
}

const defaultEmptyState = {
  title: 'No items yet',
  description: 'Get started by creating your first item.',
};

export default function EntityList<T extends EntityItem>({
  items,
  isLoading = false,
  makeHref,
  makeCardProps,
  emptyState = defaultEmptyState,
  className,
  gridCols = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  skeletonCount = 6,
}: EntityListProps<T>) {
  // Grid classes - using explicit Tailwind classes
  // Note: Tailwind requires full class names, so we map the numbers to actual classes
  const getGridClass = (cols: number, prefix: string = '') => {
    const prefixClass = prefix ? `${prefix}:` : '';
    const classMap: Record<number, string> = {
      1: `${prefixClass}grid-cols-1`,
      2: `${prefixClass}grid-cols-2`,
      3: `${prefixClass}grid-cols-3`,
      4: `${prefixClass}grid-cols-4`,
    };
    return classMap[cols] || classMap[1];
  };

  const gridClasses = cn(
    'grid gap-4 sm:gap-6',
    getGridClass(gridCols.mobile || 1),
    getGridClass(gridCols.tablet || 2, 'sm'),
    getGridClass(gridCols.desktop || 3, 'lg'),
    className
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <EntityCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={cn('rounded-xl border bg-white p-8 sm:p-12', className)}>
        <EmptyState
          title={emptyState.title}
          description={emptyState.description || defaultEmptyState.description}
          action={emptyState.action}
        />
      </div>
    );
  }

  // Render items
  return (
    <div className={gridClasses}>
      {items.map((item) => {
        const cardProps = makeCardProps(item);
        return (
          <EntityCard
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            thumbnailUrl={item.thumbnail_url}
            href={makeHref(item)}
            {...cardProps}
          />
        );
      })}
    </div>
  );
}

/**
 * EntityCardSkeleton - Loading skeleton for EntityCard
 */
function EntityCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Image skeleton */}
      <Skeleton className="aspect-video w-full" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Badge skeleton */}
        <Skeleton className="h-5 w-16 rounded-full" />

        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4" />

        {/* Description lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Price skeleton */}
        <Skeleton className="h-5 w-24" />

        {/* Actions skeleton */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

