/**
 * Cause Entity Configuration
 *
 * Created: 2025-12-25
 * Last Modified: 2025-12-25
 * Last Modified Summary: Initial creation of cause entity configuration
 */

import { EntityConfig } from '@/types/entity';
import { UserCause } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const causeEntityConfig: EntityConfig<UserCause> = {
  name: 'Cause',
  namePlural: 'Causes',
  colorTheme: 'orange',

  listPath: '/dashboard/causes',
  detailPath: (id) => `/dashboard/causes/${id}`,
  createPath: '/dashboard/causes/create',
  editPath: (id) => `/dashboard/causes/create?edit=${id}`,

  apiEndpoint: '/api/causes',

  makeHref: (cause) => `/dashboard/causes/${cause.id}`,

  makeCardProps: (cause) => {
    // Build goal label
    const goalLabel = cause.goal_sats
      ? `Goal: ${cause.goal_sats.toLocaleString()} ${cause.currency || 'sats'}`
      : undefined;

    // Build progress info
    const progressParts: string[] = [];
    if (cause.cause_category) {
      progressParts.push(cause.cause_category);
    }
    if (cause.total_raised_sats !== undefined && cause.goal_sats) {
      const percentage = Math.round((cause.total_raised_sats / cause.goal_sats) * 100);
      progressParts.push(`${percentage}% funded`);
    }

    return {
      priceLabel: goalLabel,
      badge: cause.status === 'active' ? 'Active' :
             cause.status === 'completed' ? 'Completed' :
             cause.status === 'draft' ? 'Draft' : undefined,
      badgeVariant: cause.status === 'active' ? 'success' :
                    cause.status === 'completed' ? 'default' :
                    cause.status === 'draft' ? 'default' : 'default',
      metadata: progressParts.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {progressParts.map((part, idx) => (
            <span key={idx}>{part}</span>
          ))}
        </div>
      ) : undefined,
      showEditButton: true,
      editHref: `/dashboard/causes/create?edit=${cause.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No causes yet',
    description: 'Start making a difference by creating your first cause or fundraiser.',
    action: (
      <Link href="/dashboard/causes/create">
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">
          Create Cause
        </Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
