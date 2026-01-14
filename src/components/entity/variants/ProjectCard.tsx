/**
 * ProjectCard - EntityCard variant for Projects
 *
 * Uses EntityCard with project-specific slots for progress, metrics, etc.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created ProjectCard variant using EntityCard
 */

'use client';

import { useMemo } from 'react';
import { EntityCard, EntityCardProps } from '@/components/entity/EntityCard';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUSES } from '@/config/project-statuses';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import BTCAmountDisplay from '@/components/ui/BTCAmountDisplay';
import type { SearchFundingPage } from '@/services/search';
import type { CurrencyCode } from '@/config/currencies';

interface ProjectCardProps extends Omit<EntityCardProps, 'id' | 'title' | 'headerSlot' | 'progressSlot' | 'metricsSlot' | 'footerSlot'> {
  project: SearchFundingPage & {
    currency?: string;
    tags?: string[] | null;
    cover_image_url?: string | null;
    supporters_count?: number;
  };
  showProgress?: boolean;
  showMetrics?: boolean;
}

export function ProjectCard({ project, showProgress = true, showMetrics = true, ...props }: ProjectCardProps) {
  const goalAmount = project.goal_amount ?? 0;
  const currentAmount = project.raised_amount ?? 0;
  const projectCurrency = (project.currency || 'CHF') as CurrencyCode;
  const showProgressBar = showProgress && goalAmount > 0;
  const progressPercentage = showProgressBar ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;

  // Status badge
  const status = project.status || 'draft';
  const statusConfig = PROJECT_STATUSES[status as keyof typeof PROJECT_STATUSES] || PROJECT_STATUSES.draft;
  const statusBadge = (
    <Badge className={statusConfig.className}>
      {statusConfig.label}
    </Badge>
  );

  // Progress slot
  const progressSlot = showProgressBar ? (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Progress</span>
        <span className="font-medium">{Math.round(progressPercentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>
          <CurrencyDisplay amount={currentAmount} currency={projectCurrency} />
        </span>
        <span className="text-gray-500">
          of <CurrencyDisplay amount={goalAmount} currency={projectCurrency} />
        </span>
      </div>
    </div>
  ) : null;

  // Metrics slot
  const metricsSlot = showMetrics ? (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      {currentAmount > 0 && (
        <div className="flex items-center gap-1">
          <span className="font-medium">
            <CurrencyDisplay amount={currentAmount} currency={projectCurrency} />
          </span>
          {projectCurrency !== 'BTC' && (
            <span className="text-xs text-gray-500">
              (<BTCAmountDisplay amount={currentAmount} currency={projectCurrency} />)
            </span>
          )}
        </div>
      )}
      {project.supporters_count !== undefined && project.supporters_count > 0 && (
        <div>
          <span className="font-medium">{project.supporters_count}</span>{' '}
          <span className="text-xs">supporters</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <EntityCard
      {...props}
      id={project.id}
      title={project.title || 'Untitled Project'}
      description={project.description || null}
      thumbnailUrl={project.cover_image_url || project.banner_url || undefined}
      href={props.href || `/projects/${project.id}`}
      badge={statusConfig.label}
      badgeVariant={statusConfig.badgeVariant}
      headerSlot={statusBadge}
      progressSlot={progressSlot}
      metricsSlot={metricsSlot}
      metadata={
        project.category ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {project.category}
            </Badge>
          </div>
        ) : null
      }
    />
  );
}


