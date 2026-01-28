'use client';

import { MessageSquare, Coins, TrendingUp, Clock, BarChart2, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface UsageData {
  totalRequests: number;
  totalTokens: number;
  totalCostSats: number;
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
 * - Total cost in sats
 * - Last used timestamp
 */
export function AIUsageStats({ usage, periodSelector, className }: AIUsageStatsProps) {
  const { formatAmount } = useDisplayCurrency();

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatDate = (dateString?: string) => {
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Tokens',
      value: formatNumber(usage.totalTokens),
      icon: BarChart2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Cost',
      value: formatAmount(usage.totalCostSats),
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Last Used',
      value: formatDate(usage.lastUsedAt),
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tiffany-600" />
            Usage Statistics
          </CardTitle>
          {periodSelector}
        </div>
        {usage.periodLabel && <p className="text-sm text-gray-500">{usage.periodLabel}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.label} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
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
              <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Zero State */}
        {usage.totalRequests === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">
                  No usage recorded yet. Start a conversation with My Cat to see your statistics.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AIUsageStatsCompact - Compact inline version
 */
export function AIUsageStatsCompact({ usage }: { usage: UsageData }) {
  const { formatAmount } = useDisplayCurrency();

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <MessageSquare className="w-4 h-4" />
        <span>{usage.totalRequests.toLocaleString()} requests</span>
      </div>
      <div className="flex items-center gap-1">
        <Coins className="w-4 h-4" />
        <span>{formatAmount(usage.totalCostSats)}</span>
      </div>
    </div>
  );
}

export default AIUsageStats;
