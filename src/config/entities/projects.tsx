/**
 * Project Entity Configuration
 *
 * Following Engineering Principles:
 * - DRY: Uses shared EntityConfig pattern
 * - SSOT: Paths reference entity-registry.ts values
 * - Consistency: Same structure as products, services, loans
 *
 * Created: 2025-12-31
 * Last Modified: 2026-01-04
 * Last Modified Summary: Updated to convert prices to user's preferred currency
 */

import { EntityConfig } from '@/types/entity';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { convert, formatCurrency } from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import type { Currency } from '@/types/settings';

// Project type for EntityList usage
export interface ProjectListItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  goal_amount?: number | null;
  total_funding?: number;
  current_amount?: number;
  currency?: string;
  category?: string;
  status?: string;
  isDraft?: boolean;
  isActive?: boolean;
  isPaused?: boolean;
  tags?: string[];
  [key: string]: unknown; // Index signature for BaseEntity compatibility
}

export const projectEntityConfig: EntityConfig<ProjectListItem> = {
  name: 'Project',
  namePlural: 'Projects',
  colorTheme: 'orange',

  listPath: '/dashboard/projects',
  detailPath: id => `/projects/${id}`,
  createPath: '/dashboard/projects/create',
  editPath: id => `/projects/${id}/edit`,

  apiEndpoint: '/api/projects',

  makeHref: project => `/projects/${project.id}`,

  makeCardProps: (project, userCurrency?: string) => {
    // Display amounts in user's preferred currency (or project's currency)
    const displayCurrency = (userCurrency ||
      project.currency ||
      PLATFORM_DEFAULT_CURRENCY) as Currency;

    // Format funding progress
    const fundingLabel =
      project.goal_amount && project.currency
        ? (() => {
            const current = project.current_amount || project.total_funding || 0;
            const goal = project.goal_amount;

            // Convert both to display currency if needed
            const currentInDisplay =
              project.currency === displayCurrency
                ? current
                : convert(current, project.currency as Currency, displayCurrency);
            const goalInDisplay =
              project.currency === displayCurrency
                ? goal
                : convert(goal, project.currency as Currency, displayCurrency);

            return `${formatCurrency(currentInDisplay, displayCurrency)} / ${formatCurrency(goalInDisplay, displayCurrency)}`;
          })()
        : project.total_funding && project.currency
          ? (() => {
              const total =
                project.currency === displayCurrency
                  ? project.total_funding
                  : convert(project.total_funding, project.currency as Currency, displayCurrency);
              return formatCurrency(total, displayCurrency);
            })()
          : undefined;

    // Calculate progress percentage (both amounts must be in same currency)
    const progress =
      project.goal_amount && project.goal_amount > 0 && project.currency
        ? (() => {
            const current = project.current_amount || project.total_funding || 0;
            // Both amounts are in project.currency, so direct comparison
            return Math.round((current / project.goal_amount) * 100);
          })()
        : 0;

    // Build metadata parts
    const metadataParts: string[] = [];
    if (project.category) {
      metadataParts.push(project.category);
    }

    return {
      priceLabel: fundingLabel,
      badge: project.isDraft
        ? 'Draft'
        : project.isActive
          ? 'Active'
          : project.isPaused
            ? 'Paused'
            : project.status === 'completed'
              ? 'Completed'
              : project.status === 'cancelled'
                ? 'Cancelled'
                : undefined,
      badgeVariant: project.isDraft
        ? 'default'
        : project.isActive
          ? 'success'
          : project.isPaused
            ? 'warning'
            : project.status === 'completed'
              ? 'success'
              : project.status === 'cancelled'
                ? 'destructive'
                : 'default',
      metadata:
        metadataParts.length > 0 || progress > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {metadataParts.map((part, idx) => (
              <span key={idx} className="capitalize">
                {part}
              </span>
            ))}
            {progress > 0 && (
              <span className="text-orange-600 font-medium">{progress}% funded</span>
            )}
          </div>
        ) : undefined,
      showEditButton: true,
      editHref: `/projects/${project.id}/edit`,
    };
  },

  emptyState: {
    title: 'No projects yet',
    description:
      'Create your first project to start accepting Bitcoin funding and building support for your cause.',
    action: (
      <Link href="/dashboard/projects/create">
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700">Create Project</Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
