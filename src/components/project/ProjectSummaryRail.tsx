'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAmountRaised } from '@/lib/projectGoal';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Bitcoin } from 'lucide-react';

interface Props {
  project: {
    id: string;
    goal_amount: number | null;
    currency?: string | null;
    goal_currency?: string | null;
    bitcoin_address?: string | null;
    bitcoin_balance_btc?: number;
    bitcoin_balance_updated_at?: string | null;
    user_id?: string;
  };
  isOwner?: boolean;
}

export default function ProjectSummaryRail({ project, isOwner }: Props) {
  const goalCurrency = (project as any).goal_currency || project.currency || 'CHF';
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
          <div className="text-xs text-gray-500 mt-1">
            BTC: {(project.bitcoin_balance_btc || 0).toFixed(8)} BTC
          </div>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      {/* Owner Actions */}
      {isOwner && project.bitcoin_address && (
        <Button onClick={onRefresh} disabled={refreshing} variant="outline" className="w-full">
          {refreshing ? 'Refreshing…' : 'Refresh Balance'}
        </Button>
      )}

      {/* Quick Action - Scroll to Support Section */}
      {project.bitcoin_address && (
        <Button
          onClick={() => {
            // Scroll to Support this Project section in main content
            const supportSection = document.getElementById('support-heading');
            if (supportSection) {
              supportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Fallback: scroll to donation section
              const bitcoinSection = document.getElementById('bitcoin-donation-section');
              if (bitcoinSection) {
                bitcoinSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          }}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Bitcoin className="w-4 h-4 mr-2" aria-hidden="true" />
          Support this Project
        </Button>
      )}
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
