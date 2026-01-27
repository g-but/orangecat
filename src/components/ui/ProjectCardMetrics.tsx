/**
 * ProjectCardMetrics Component
 *
 * Displays fundraising progress metrics for project cards.
 * Extracted from ModernProjectCard for reusability.
 */

'use client';

import { CurrencyDisplay } from './CurrencyDisplay';
import BTCAmountDisplay from './BTCAmountDisplay';

interface ProjectCardMetricsProps {
  currentAmount: number;
  goalAmount: number;
  projectCurrency: 'USD' | 'EUR' | 'CHF' | 'BTC' | 'SATS';
  showProgress: boolean;
  progressPercentage: number;
  compact?: boolean;
}

export function ProjectCardMetrics({
  currentAmount,
  goalAmount,
  projectCurrency,
  showProgress,
  progressPercentage,
  compact = false,
}: ProjectCardMetricsProps) {
  return (
    <div className={`mt-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Raised</p>
          <p className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
            <CurrencyDisplay amount={currentAmount} currency={projectCurrency} />
          </p>
          <BTCAmountDisplay
            amount={currentAmount}
            currency={projectCurrency}
            className="text-xs text-gray-500"
          />
        </div>
        {showProgress ? (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Goal</p>
            <p className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              <CurrencyDisplay amount={goalAmount} currency={projectCurrency} />
            </p>
            <p className="text-xs text-gray-500">{progressPercentage.toFixed(0)}% funded</p>
          </div>
        ) : (
          <div className="text-right text-xs text-gray-500 italic">No goal set</div>
        )}
      </div>
      {showProgress && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-400"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
