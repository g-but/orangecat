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
import { STATUS } from '@/config/database-constants';
import { ROUTES } from '@/config/routes';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import type { Currency } from '@/types/settings';

export const causeEntityConfig: EntityConfig<UserCause> = {
  name: 'Cause',
  namePlural: 'Causes',
  colorTheme: 'orange',

  listPath: ENTITY_REGISTRY['cause'].basePath,
  detailPath: id => `${ENTITY_REGISTRY['cause'].basePath}/${id}`,
  createPath: ENTITY_REGISTRY['cause'].createPath,
  editPath: id => `${ENTITY_REGISTRY['cause'].createPath}?edit=${id}`,

  apiEndpoint: ENTITY_REGISTRY['cause'].apiEndpoint,

  makeHref: cause => `${ENTITY_REGISTRY['cause'].basePath}/${cause.id}`,

  makeCardProps: (cause, userCurrency?: string) => {
    // Display goal in user's preferred currency (or cause's currency)
    const displayCurrency = (userCurrency ||
      cause.currency ||
      PLATFORM_DEFAULT_CURRENCY) as Currency;
    // Build goal label - use target_amount (database field name)
    const goalLabel =
      cause.target_amount && cause.currency
        ? (() => {
            const goalAmount =
              cause.currency === displayCurrency
                ? cause.target_amount
                : convert(cause.target_amount, cause.currency as Currency, displayCurrency);
            return `Goal: ${formatCurrency(goalAmount, displayCurrency)}`;
          })()
        : undefined;

    // Build progress info
    const progressParts: string[] = [];
    if (cause.cause_category) {
      progressParts.push(cause.cause_category);
    }
    // Use current_amount (database field name) instead of total_raised
    if (cause.current_amount !== undefined && cause.target_amount && cause.currency) {
      // Convert both to same currency for percentage calculation
      const raisedInGoalCurrency =
        cause.currency === displayCurrency
          ? cause.current_amount
          : convert(cause.current_amount, cause.currency as Currency, displayCurrency);
      const goalInGoalCurrency =
        cause.currency === displayCurrency
          ? cause.target_amount
          : convert(cause.target_amount, cause.currency as Currency, displayCurrency);
      const percentage = Math.round((raisedInGoalCurrency / goalInGoalCurrency) * 100);
      progressParts.push(`${percentage}% funded`);
    }

    return {
      priceLabel: goalLabel,
      badge:
        cause.status === STATUS.CAUSES.ACTIVE
          ? 'Active'
          : cause.status === STATUS.CAUSES.COMPLETED
            ? 'Completed'
            : cause.status === STATUS.CAUSES.DRAFT
              ? 'Draft'
              : undefined,
      badgeVariant:
        cause.status === STATUS.CAUSES.ACTIVE
          ? 'success'
          : cause.status === STATUS.CAUSES.COMPLETED
            ? 'default'
            : cause.status === STATUS.CAUSES.DRAFT
              ? 'default'
              : 'default',
      metadata:
        progressParts.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {progressParts.map((part, idx) => (
              <span key={idx}>{part}</span>
            ))}
          </div>
        ) : undefined,
      showEditButton: true,
      editHref: `${ENTITY_REGISTRY['cause'].createPath}?edit=${cause.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No causes yet',
    description: 'Start making a difference by creating your first cause or fundraiser.',
    action: (
      <Link href={ROUTES.DASHBOARD.CAUSES_CREATE}>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">Create Cause</Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
