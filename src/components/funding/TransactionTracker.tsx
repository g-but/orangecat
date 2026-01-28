'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import { DATABASE_TABLES } from '@/config/database-tables';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface TransactionTrackerProps {
  fundingPageId: string;
  isOwner: boolean;
  onBalanceUpdate: (newBalance: number) => void;
}

export default function TransactionTracker({
  fundingPageId,
  isOwner,
  onBalanceUpdate,
}: TransactionTrackerProps) {
  const { user: _user } = useAuth();
  const { formatAmount } = useDisplayCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from(DATABASE_TABLES.TRANSACTIONS)
        .select('*')
        .eq('to_entity_id', fundingPageId)
        .eq('to_entity_type', 'project')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTransactions(data || []);

      // Calculate total balance
      const totalBalance = data?.reduce((sum, tx) => sum + (tx.amount_sats || 0), 0) || 0;
      onBalanceUpdate(totalBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [fundingPageId, onBalanceUpdate, supabase]);

  useEffect(() => {
    fetchTransactions();

    // Subscribe to new transactions
    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `to_entity_id=eq.${fundingPageId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, fundingPageId, supabase]);

  if (loading) {
    return (
      <Card>
        <div className="p-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-tiffany-600 border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 text-red-500">{error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-4">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isOwner ? 'Anonymous Donor' : 'You'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm font-medium text-tiffany-600">
                  {formatAmount(tx.amount_sats || tx.amount || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
