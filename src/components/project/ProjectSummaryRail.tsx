'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAmountRaised } from '@/lib/projectGoal';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Bitcoin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

const ProjectSupportButton = dynamic(() =>
  import('@/components/projects/ProjectSupportButton').then(m => ({
    default: m.ProjectSupportButton,
  }))
);
const SupportStats = dynamic(() =>
  import('@/components/projects/SupportStats').then(m => ({ default: m.SupportStats }))
);

interface Props {
  project: {
    id: string;
    goal_amount: number | null;
    currency?: string | null;
    goal_currency?: string | null;
    bitcoin_address?: string | null;
    bitcoin_balance_btc?: number;
    bitcoin_balance_updated_at?: string | null;
    supporters_count?: number;
    last_donation_at?: string | null;
    user_id?: string;
  };
  isOwner?: boolean;
}

export default function ProjectSummaryRail({ project, isOwner }: Props) {
  const goalCurrency = project.goal_currency || project.currency || PLATFORM_DEFAULT_CURRENCY;
  const [amountRaised, setAmountRaised] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const btc = project.bitcoin_balance_btc || 0;
      const amt = await computeAmountRaised(btc, goalCurrency);
      setAmountRaised(amt);
    };
    init();
  }, [project.bitcoin_balance_btc, goalCurrency]);

  const progress = useMemo(() => {
    const goal = project.goal_amount || 0;
    if (!goal) {
      return 0;
    }
    return Math.min((amountRaised / goal) * 100, 100);
  }, [amountRaised, project.goal_amount]);

  const onRefresh = useCallback(async () => {
    if (!project.bitcoin_address) {
      return;
    }
    setRefreshing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/refresh-balance`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Update local state instead of full page reload
        if (data.bitcoin_balance_btc !== undefined) {
          // Trigger a re-fetch of project data by updating the component
          // For now, we'll still reload but show a toast first
          toast.success('Balance refreshed successfully');
          // TODO: Replace with proper state update when project data is available via props/context
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } else {
        toast.error(data.error || 'Failed to refresh balance');
        logger.error(
          'Failed to refresh balance',
          { projectId: project.id, error: data.error },
          'ProjectSummaryRail'
        );
      }
    } catch (error) {
      toast.error('Failed to refresh balance. Please try again.');
      logger.error(
        'Failed to refresh balance',
        { projectId: project.id, error },
        'ProjectSummaryRail'
      );
    } finally {
      setRefreshing(false);
    }
  }, [project.id, project.bitcoin_address]);

  return (
    <aside className="sticky top-6 rounded-xl border bg-white p-5 space-y-4">
      <div>
        <div className="text-2xl font-bold">{formatCurrency(amountRaised, goalCurrency)}</div>
        {project.goal_amount && (
          <div className="text-sm text-gray-600">
            of {formatCurrency(project.goal_amount, goalCurrency)} goal
          </div>
        )}
        {project.bitcoin_address && (
          <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Bitcoin className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                Bitcoin Balance
              </span>
            </div>
            <div className="text-base font-semibold text-gray-900">
              {(project.bitcoin_balance_btc || 0).toFixed(8)} BTC
            </div>
            {project.bitcoin_balance_updated_at && (
              <div className="text-xs text-gray-500 mt-1">
                Updated{' '}
                {formatDistanceToNow(new Date(project.bitcoin_balance_updated_at), {
                  addSuffix: true,
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Social Proof - Supporters Count */}
      {(project.supporters_count || project.last_donation_at) && (
        <div className="space-y-2 text-sm border-t pt-4">
          {project.supporters_count !== undefined && project.supporters_count > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Supporters</span>
              <span className="font-semibold text-gray-900">
                {project.supporters_count} {project.supporters_count === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}
          {project.last_donation_at && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              Last contribution{' '}
              {formatDistanceToNow(new Date(project.last_donation_at), { addSuffix: true })}
            </div>
          )}
        </div>
      )}

      {/* Owner Actions */}
      {isOwner && project.bitcoin_address && (
        <Button onClick={onRefresh} disabled={refreshing} variant="outline" className="w-full">
          {refreshing ? 'Refreshing…' : 'Refresh Balance'}
        </Button>
      )}

      {/* Support Button */}
      <ProjectSupportButton
        projectId={project.id}
        variant="primary"
        size="md"
        showStats={false}
        className="w-full"
      />

      {/* Support Stats */}
      <SupportStats projectId={project.id} />
    </aside>
  );
}

function formatCurrency(amount: number, currency: string) {
  if (currency === 'BTC') {
    return `${amount.toFixed(8)} BTC`;
  }
  try {
    // Use a stable locale to avoid SSR/CSR hydration mismatches
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
