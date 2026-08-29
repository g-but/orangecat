'use client';

import { MessageSquare, Coins, TrendingUp, Clock, BarChart2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { formatNumber } from '@/utils/locale';

interface UsageData {
  totalRequests: number;
  totalTokens: number;
  totalCostBtc: number;
  lastUsedAt?: string;
  periodLabel?: string;
}

interface AIUsageStatsProps {
  usage: UsageData;
  periodSelector?: React.ReactNode;
  className?: string;
}

/**
 * AIUsageStats - Usage display component
 *
 * Shows:
 * - Total requests
 * - Total tokens used
 * - Total cost in BTC
 * - Last used timestamp
 */
export function AIUsageStats({ usage, periodSelector, className }: AIUsageStatsProps) {
  const { formatAmountBtc } = useDisplayCurrency();

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return formatNumber(num);
  };

  const formatRelativeCompact = (dateString?: string) => {
    if (!dateString) {
      return 'Never';
    }
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return 'Just now';
  };

  const stats = [
    {
      label: 'Requests',
      value: formatNumber(usage.totalRequests),
      icon: MessageSquare,
      color: 'text-fg-primary',
      bgColor: 'bg-surface-raised',
    },
    {
      label: 'Tokens',
      value: formatNumber(usage.totalTokens),
      icon: BarChart2,
      color: 'text-fg-primary',
      bgColor: 'bg-surface-raised',
    },
    {
      label: 'Cost',
      value: formatAmountBtc(usage.totalCostBtc),
      icon: Coins,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning-subtle',
    },
    {
      label: 'Last Used',
      value: formatRelativeCompact(usage.lastUsedAt),
      icon: Clock,
      color: 'text-fg-secondary',
      bgColor: 'bg-surface-raised',
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-fg-primary" />
            Usage Statistics
          </CardTitle>
          {periodSelector}
        </div>
        {usage.periodLabel && <p className="text-sm text-fg-secondary">{usage.periodLabel}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="p-4 rounded-lg border border-subtle bg-surface-raised/40/50 dark:bg-surface-raised"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    stat.bgColor
                  )}
                >
                  <stat.icon className={cn('w-4 h-4', stat.color)} />
                </div>
              </div>
              <div className="text-2xl font-semibold text-fg-primary">{stat.value}</div>
              <div className="text-sm text-fg-secondary">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Zero State */}
        {usage.totalRequests === 0 && (
          <div className="mt-4 p-4 bg-surface-raised rounded-lg border border-subtle">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-fg-tertiary mt-0.5" />
              <div>
                <p className="text-sm text-fg-secondary">
                  No usage recorded yet. Start a conversation with Cat to see your statistics.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIUsageStats;
