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

import { EntityCard, EntityCardProps } from '@/components/entity/EntityCard';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUSES } from '@/config/project-statuses';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import BTCAmountDisplay from '@/components/ui/BTCAmountDisplay';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { cn } from '@/lib/utils';
import type { SearchFundingPage } from '@/services/search';

interface ProjectCardProps extends Omit<
  EntityCardProps,
  'id' | 'title' | 'headerSlot' | 'progressSlot' | 'metricsSlot' | 'footerSlot'
> {
  // currency + supporters_count now live on SearchFundingPage itself (settled
  // funding enrichment); only card-local extras remain here.
  project: SearchFundingPage & {
    tags?: string[] | null;
    cover_image_url?: string | null;
  };
  showProgress?: boolean;
  showMetrics?: boolean;
  /** Compact mode for dashboard - smaller tiles with less detail */
  compact?: boolean;
}

export function ProjectCard({
  project,
  showProgress = true,
  showMetrics = true,
  compact = false,
  ...props
}: ProjectCardProps) {
  const goalAmount = project.goal_amount ?? 0;
  const currentAmount = project.raised_amount ?? 0;
  const projectCurrency = project.currency || 'CHF';

  // SSOT: amounts are stored per-project in the project's chosen currency
  // (e.g. goal=5000 stored as CHF, or goal=0.01 stored as BTC). Display
  // must always honor the *viewer's* preference — convert through BTC, the
  // canonical unit, then format via the viewer's display hook. Without this
  // a CHF-preferring viewer would see "0 BTC" on a BTC-denominated project
  // while CHF projects right next to it render as "0.00 CHF".
  const { formatAmountBtc, displayCurrency } = useDisplayCurrency();
  const { convertToBTC } = useCurrencyConversion();
  const goalBtc = convertToBTC(goalAmount, projectCurrency);
  // Prefer the settled-ledger BTC figure (canonical unit) over converting the
  // project-currency amount back — avoids a lossy round-trip through rates.
  const currentBtc = project.settled_raised_btc ?? convertToBTC(currentAmount, projectCurrency);
  const formattedCurrent = formatAmountBtc(currentBtc);
  const formattedGoal = formatAmountBtc(goalBtc);
  const amountColorClass =
    displayCurrency === 'BTC' ? 'text-bitcoinOrange font-medium' : 'text-fg-primary';

  const showProgressBar = showProgress && goalAmount > 0;
  const progressPercentage = showProgressBar
    ? Math.min((currentAmount / goalAmount) * 100, 100)
    : 0;

  // Status badge
  const status = project.status || 'draft';
  const statusConfig =
    PROJECT_STATUSES[status as keyof typeof PROJECT_STATUSES] || PROJECT_STATUSES.draft;
  const statusBadge = <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;

  // Progress slot - simplified for compact mode
  const progressSlot = showProgressBar ? (
    compact ? (
      // Compact progress: just bar and percentage
      <div className="w-full space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full bg-fg-primary transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={cn('font-medium font-mono tabular-nums', amountColorClass)}>
            {formattedCurrent}
          </span>
          <span className="text-fg-secondary">{Math.round(progressPercentage)}%</span>
        </div>
      </div>
    ) : (
      // Full progress: label, bar, amounts
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-fg-secondary">
          <span>Progress</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
          <div
            className="h-full bg-fg-primary transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span className={cn('font-mono tabular-nums', amountColorClass)}>{formattedCurrent}</span>
          <span className="text-fg-secondary font-mono tabular-nums">of {formattedGoal}</span>
        </div>
      </div>
    )
  ) : null;

  // Metrics slot - hide in compact mode (shown in progress slot)
  const metricsSlot =
    showMetrics && !compact ? (
      <div className="flex items-center gap-4 text-sm text-fg-secondary">
        {currentAmount > 0 && (
          <div className="flex items-center gap-1">
            <span className={cn('font-medium font-mono tabular-nums', amountColorClass)}>
              {formattedCurrent}
            </span>
            {displayCurrency !== 'BTC' && (
              <span className="text-xs text-fg-secondary">
                (<BTCAmountDisplay amount={currentBtc} currency="BTC" />)
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
      description={compact ? null : project.description || null}
      thumbnailUrl={project.cover_image_url || project.banner_url || undefined}
      href={props.href || `${ENTITY_REGISTRY['project'].publicBasePath}/${project.id}`}
      headerSlot={statusBadge}
      progressSlot={progressSlot}
      metricsSlot={metricsSlot}
      metadata={
        !compact && project.category ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {project.category}
            </Badge>
          </div>
        ) : null
      }
      compact={compact}
    />
  );
}
