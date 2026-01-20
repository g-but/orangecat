'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { EntityCardActions } from './EntityCardActions';

/**
 * EntityCard - Modular, reusable card component for displaying entities (services, products, etc.)
 *
 * Features:
 * - Responsive design (mobile-first)
 * - Image with proper aspect ratio
 * - Status badges
 * - 3-dot menu with edit/delete actions
 * - Hover states
 * - Accessible
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-03
 * Last Modified Summary: Re-enabled EntityCardActions with 3-dot menu for edit/delete
 */

export interface EntityCardProps {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  category?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  href?: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'destructive' | 'secondary';
  priceLabel?: string;
  metadata?: ReactNode;
  fundingProgress?: number;
  goalAmount?: string;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
  /** Edit URL for this entity */
  editUrl?: string;
  /** Edit callback (alternative to editUrl) */
  onEdit?: () => void;
  /** Callback for deletion */
  onDelete?: () => void | Promise<void>;
  /** Whether the entity is currently being deleted */
  isDeleting?: boolean;
  /** Show edit button overlay */
  showEditButton?: boolean;
  /** Edit button href (for showEditButton) */
  editHref?: string;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Image aspect ratio - currently not used but accepted for compatibility */
  imageAspectRatio?: 'square' | 'landscape' | 'portrait' | string;
  /** Actions dropdown menu items - for additional custom actions */
  actions?: ReactNode;
  /** Whether entity is shown on public profile */
  showOnProfile?: boolean;
  /** Callback to toggle profile visibility */
  onToggleVisibility?: () => void | Promise<void>;
  /** Whether visibility toggle is in progress */
  isTogglingVisibility?: boolean;
  /** Custom header slot (e.g., status badges) */
  headerSlot?: ReactNode;
  /** Custom progress slot (e.g., funding progress bar) */
  progressSlot?: ReactNode;
  /** Custom metrics slot (e.g., funding metrics) */
  metricsSlot?: ReactNode;
  /** Custom footer slot */
  footerSlot?: ReactNode;
  /** Compact mode for dashboard - smaller tiles with reduced spacing */
  compact?: boolean;
}

const badgeVariantClasses: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  destructive: 'bg-red-100 text-red-700 border-red-200',
  secondary: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * ImagePlaceholder - Shared placeholder for missing images
 */
function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="mt-2 text-xs font-medium text-gray-500">No Image</span>
      </div>
    </div>
  );
}

/**
 * ImageLoader - Loading spinner for images
 */
function ImageLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
    </div>
  );
}

export function EntityCard({
  id,
  title,
  description,
  status,
  category,
  imageUrl,
  thumbnailUrl,
  href,
  badge,
  badgeVariant = 'default',
  priceLabel,
  metadata,
  fundingProgress,
  goalAmount,
  className,
  editUrl,
  editHref,
  onEdit,
  onDelete,
  isDeleting,
  showEditButton: _showEditButton,
  onClick,
  imageAspectRatio: _imageAspectRatio,
  actions: _actions,
  showOnProfile,
  onToggleVisibility,
  isTogglingVisibility,
  headerSlot,
  progressSlot,
  metricsSlot,
  footerSlot,
  compact = false,
}: EntityCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use thumbnailUrl or imageUrl
  const imageSrc = thumbnailUrl || imageUrl;
  const showImage = imageSrc && !imageError;

  // Determine if we have action menu
  const hasActions = editUrl || editHref || onEdit || onDelete || onToggleVisibility;

  // Render image content (shared between linked and non-linked versions)
  const renderImage = () => (
    <>
      {showImage ? (
        <>
          <Image
            src={imageSrc!}
            alt={title}
            fill
            className={cn(
              'object-cover transition-all duration-300',
              imageLoaded && 'group-hover:scale-105',
              !imageLoaded && 'opacity-0'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={imageSrc!.startsWith('data:') || imageSrc!.startsWith('blob:')}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <ImageLoader />}
        </>
      ) : (
        <ImagePlaceholder />
      )}
    </>
  );

  // Determine the detail link
  const detailHref = href || `/dashboard/ai-assistants/${id}`;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-lg hover:border-gray-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Image Section - smaller aspect ratio in compact mode */}
      <Link
        href={detailHref}
        className={cn(
          "relative w-full overflow-hidden bg-gray-100 block",
          compact ? "aspect-[4/3]" : "aspect-video"
        )}
      >
        {renderImage()}
      </Link>

      {/* 3-Dot Actions Menu - Top Right */}
      {hasActions && (
        <div className="absolute top-2 right-2 z-20">
          <EntityCardActions
            editUrl={editUrl || editHref}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
            deleteConfirmTitle={`Delete ${title}`}
            deleteConfirmDescription={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
            showOnProfile={showOnProfile}
            onToggleVisibility={onToggleVisibility}
            isTogglingVisibility={isTogglingVisibility}
          />
        </div>
      )}

      {/* Hidden from Profile Indicator */}
      {showOnProfile === false && (
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/80 text-white text-xs font-medium rounded-md">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Hidden
          </span>
        </div>
      )}

      {/* Content - reduced padding in compact mode */}
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4")}>
        {/* Badge Row */}
        {badge && (
          <div className={cn(compact ? "mb-1" : "mb-2")}>
            <Badge
              variant="secondary"
              className={cn('text-xs', badgeVariantClasses[badgeVariant])}
            >
              {badge}
            </Badge>
          </div>
        )}

        {/* Header Slot */}
        {headerSlot && <div className={cn(compact ? "mb-1" : "mb-2")}>{headerSlot}</div>}

        {/* Title - smaller text in compact mode */}
        <Link href={detailHref}>
          <h3 className={cn(
            "font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1",
            compact ? "text-sm" : "text-lg"
          )}>
            {title}
          </h3>
        </Link>

        {/* Description - hidden in compact mode */}
        {description && !compact && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{description}</p>
        )}

        {/* Price Label */}
        {priceLabel && (
          <p className={cn(compact ? "mt-1" : "mt-2", "text-sm font-medium text-orange-600")}>{priceLabel}</p>
        )}

        {/* Custom Metadata */}
        {metadata && <div className={cn(compact ? "mt-1" : "mt-2")}>{metadata}</div>}

        {/* Status and Category */}
        {(status || category) && (
          <div className={cn(compact ? "mt-2" : "mt-3", "flex items-center justify-between")}>
            <div className="flex items-center gap-2">
              {status && (
                <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {status}
                </Badge>
              )}
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              )}
            </div>
            {goalAmount && (
              <span className="text-sm font-medium text-gray-900">{goalAmount}</span>
            )}
          </div>
        )}

        {/* Funding Progress */}
        {fundingProgress !== undefined && (
          <div className={cn(compact ? "mt-2" : "mt-3")}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{fundingProgress}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                style={{ width: `${Math.min(100, fundingProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Progress Slot - tighter spacing in compact mode */}
        {progressSlot && <div className={cn(compact ? "mt-2" : "mt-3")}>{progressSlot}</div>}

        {/* Metrics Slot - tighter spacing in compact mode */}
        {metricsSlot && <div className={cn(compact ? "mt-2" : "mt-3")}>{metricsSlot}</div>}

        {/* Footer Slot - tighter spacing in compact mode */}
        {footerSlot && <div className={cn(compact ? "mt-2 pt-2" : "mt-3 pt-3", "border-t border-gray-100")}>{footerSlot}</div>}
      </div>
    </div>
  );
}

// Default export for backward compatibility
export default EntityCard;
