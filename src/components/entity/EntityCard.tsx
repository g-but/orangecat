'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

/**
 * EntityCard - Modular, reusable card component for displaying entities (services, products, etc.)
 * 
 * Features:
 * - Responsive design (mobile-first)
 * - Image with proper aspect ratio
 * - Status badges
 * - Flexible action buttons
 * - Hover states
 * - Accessible
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Initial creation of modular entity card component
 */

export interface EntityCardProps {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  priceLabel?: string;
  metadata?: ReactNode; // Additional metadata (e.g., location, category)
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
  // Image options
  imageAspectRatio?: 'square' | 'landscape' | 'portrait';
  showEditButton?: boolean;
  editHref?: string;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  landscape: 'aspect-video',
  portrait: 'aspect-[3/4]',
};

const badgeVariantClasses = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function EntityCard({
  id,
  title,
  description,
  thumbnailUrl,
  href,
  badge,
  badgeVariant = 'default',
  priceLabel,
  metadata,
  actions,
  className,
  onClick,
  imageAspectRatio = 'landscape',
  showEditButton = false,
  editHref,
}: EntityCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const showImage = thumbnailUrl && !imageError;

  // Check if we have nested links (actions or edit button with href)
  const hasNestedLinks = (actions && typeof actions === 'object') || showEditButton;

  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-lg hover:border-gray-300',
        'focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2',
        !hasNestedLinks && !onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick || (!hasNestedLinks ? () => window.location.href = href : undefined)}
    >
      {/* Image Section - Make clickable if we have nested links */}
      {hasNestedLinks ? (
        <Link href={href} className={cn('relative w-full overflow-hidden bg-gray-100 block', aspectRatioClasses[imageAspectRatio])}>
          {showImage ? (
            <>
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className={cn(
                  'object-cover transition-all duration-300',
                  imageLoaded && 'group-hover:scale-105',
                  !imageLoaded && 'opacity-0'
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('blob:')}
                onError={() => setImageError(true)}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-xs font-medium text-gray-500">No Image</p>
              </div>
            </div>
          )}
          
          {/* Badge overlay */}
          {badge && (
            <div className="absolute top-3 left-3">
              <Badge className={cn('text-xs font-medium shadow-sm', badgeVariantClasses[badgeVariant])}>
                {badge}
              </Badge>
            </div>
          )}

          {/* Edit button overlay (if provided) */}
          {showEditButton && editHref && (
            <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
              <Link
                href={editHref}
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:bg-white hover:scale-110"
              >
                <Edit2 className="h-4 w-4 text-gray-700" />
              </Link>
            </div>
          )}
        </Link>
      ) : (
        <div className={cn('relative w-full overflow-hidden bg-gray-100', aspectRatioClasses[imageAspectRatio])}>
          {showImage ? (
            <>
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                className={cn(
                  'object-cover transition-all duration-300',
                  imageLoaded && 'group-hover:scale-105',
                  !imageLoaded && 'opacity-0'
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('blob:')}
                onError={() => setImageError(true)}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-xs font-medium text-gray-500">No Image</p>
              </div>
            </div>
          )}
          
          {/* Badge overlay */}
          {badge && (
            <div className="absolute top-3 left-3">
              <Badge className={cn('text-xs font-medium shadow-sm', badgeVariantClasses[badgeVariant])}>
                {badge}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Title and Metadata - Make title clickable if we have nested links */}
        <div className="mb-2">
          {hasNestedLinks ? (
            <Link href={href}>
              <h3 className="line-clamp-2 text-base font-semibold leading-tight text-gray-900 sm:text-lg hover:text-orange-600 transition-colors">
                {title}
              </h3>
            </Link>
          ) : (
            <h3 className="line-clamp-2 text-base font-semibold leading-tight text-gray-900 sm:text-lg">
              {title}
            </h3>
          )}
          {metadata && <div className="mt-2 text-sm text-gray-600">{metadata}</div>}
        </div>

        {/* Description */}
        {description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600 sm:line-clamp-3">
            {description}
          </p>
        )}

        {/* Price */}
        {priceLabel && (
          <div className="mb-3 flex items-center">
            <span className="text-base font-semibold text-gray-900">{priceLabel}</span>
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center justify-end gap-2">{actions}</div>
          </div>
        )}
      </div>
    </div>
  );

  // If we have nested links (actions or edit button), render as div to avoid nested <a> tags
  // Otherwise, render as Link for better SEO and accessibility
  if (hasNestedLinks) {
    return (
      <div className="block w-full">
        {cardContent}
      </div>
    );
  }

  // If onClick is provided, render as button
  if (onClick) {
    return (
      <button
        type="button"
        className="block w-full text-left"
        onClick={onClick}
        aria-label={`View ${title}`}
      >
        {cardContent}
      </button>
    );
  }

  // Default: render as Link
  return (
    <Link href={href} className="block w-full" aria-label={`View ${title}`}>
      {cardContent}
    </Link>
  );
}

