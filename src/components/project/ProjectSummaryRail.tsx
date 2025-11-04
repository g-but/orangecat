'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAmountRaised } from '@/lib/projectGoal';
import Button from '@/components/ui/Button';

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
        // simplest path: reload to pick up new server state elsewhere
        window.location.reload();
      } else {
        alert(data.error || 'Failed to refresh');
      }
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
      {isOwner && project.bitcoin_address && (
        <Button onClick={onRefresh} disabled={refreshing} variant="outline" className="w-full">
          {refreshing ? 'Refreshing…' : 'Refresh Balance'}
        </Button>
      )}
      <Button className="w-full">Donate Bitcoin</Button>
    </aside>
  );
}

function formatCurrency(amount: number, currency: string) {
  if (currency === 'BTC') {
    return `${amount.toFixed(8)} BTC`;
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
