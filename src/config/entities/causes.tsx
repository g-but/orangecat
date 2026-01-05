/**
 * Cause Entity Configuration
 *
 * Created: 2025-12-25
 * Last Modified: 2026-01-04
 * Last Modified Summary: Updated to convert prices to user's preferred currency
 */

import { EntityConfig } from '@/types/entity';
import { UserCause } from '@/types/database';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

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

  makeCardProps: (cause, userCurrency?: string) => {
    // Display goal in user's preferred currency (or cause's currency)
    const displayCurrency = (userCurrency || cause.currency || PLATFORM_DEFAULT_CURRENCY) as Currency;
    // Build goal label
    const goalLabel = cause.goal_amount && cause.currency
      ? (() => {
          const goalAmount = cause.currency === displayCurrency
            ? cause.goal_amount
            : convert(cause.goal_amount, cause.currency as Currency, displayCurrency);
          return `Goal: ${formatCurrency(goalAmount, displayCurrency)}`;
        })()
      : undefined;

    // Build progress info
    const progressParts: string[] = [];
    if (cause.cause_category) {
      progressParts.push(cause.cause_category);
    }
    if (cause.total_raised !== undefined && cause.goal_amount && cause.currency) {
      // Convert both to same currency for percentage calculation
      const raisedInGoalCurrency = cause.currency === displayCurrency
        ? cause.total_raised
        : convert(cause.total_raised, cause.currency as Currency, displayCurrency);
      const goalInGoalCurrency = cause.currency === displayCurrency
        ? cause.goal_amount
        : convert(cause.goal_amount, cause.currency as Currency, displayCurrency);
      const percentage = Math.round((raisedInGoalCurrency / goalInGoalCurrency) * 100);
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
