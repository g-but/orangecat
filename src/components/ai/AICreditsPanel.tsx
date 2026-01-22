'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatSats } from '@/utils/currency';

interface CreditBalance {
  balance_sats: number;
  total_deposited_sats: number;
  total_spent_sats: number;
}

interface Transaction {
  id: string;
  transaction_type: 'deposit' | 'charge' | 'refund' | 'bonus';
  amount_sats: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
  assistant?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

interface AICreditsData {
  balance: CreditBalance;
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function AICreditsPanel() {
  const [data, setData] = useState<AICreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-credits');
      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch AI credits:', error);
      toast.error('Failed to load credits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount, 10);
    if (isNaN(amount) || amount < 100) {
      toast.error('Minimum deposit is 100 sats');
      return;
    }

    setDepositing(true);
    try {
      // For MVP, use the manual add endpoint
      const response = await fetch('/api/ai-credits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_sats: amount,
          description: 'Manual deposit',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add credits');
      }

      await response.json();
      toast.success(`Added ${formatSats(amount)} to your balance`);
      setShowDepositDialog(false);
      setDepositAmount('1000');

      // Refresh balance
      fetchCredits();
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'charge':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      default:
        return <Coins className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bonus':
      case 'refund':
        return 'text-green-600';
      case 'charge':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = data?.balance || {
    balance_sats: 0,
    total_deposited_sats: 0,
    total_spent_sats: 0,
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI Credits
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchCredits} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm text-yellow-800 mb-1">Available Balance</div>
            <div className="text-3xl font-bold text-yellow-900">
              {formatSats(balance.balance_sats)}
            </div>
            <div className="text-xs text-yellow-700 mt-2 flex gap-4">
              <span>Deposited: {formatSats(balance.total_deposited_sats)}</span>
              <span>Spent: {formatSats(balance.total_spent_sats)}</span>
            </div>
          </div>

          {/* Add Credits Button */}
          <Button className="w-full" onClick={() => setShowDepositDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credits
          </Button>

          {/* Recent Transactions */}
          {data?.transactions && data.transactions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.transactions.slice(0, 5).map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(tx.transaction_type)}
                      <div>
                        <div className="font-medium">
                          {tx.assistant?.name || tx.description || tx.transaction_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`font-medium ${getTransactionColor(tx.transaction_type)}`}>
                      {tx.transaction_type === 'charge' ? '-' : '+'}
                      {formatSats(tx.amount_sats)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!data?.transactions || data.transactions.length === 0) && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No transactions yet. Add credits to start chatting with AI assistants.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Add AI Credits
            </DialogTitle>
            <DialogDescription>
              Add credits to chat with AI assistants. Credits are used to pay for AI messages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 50000].map(amount => (
                <Button
                  key={amount}
                  variant={depositAmount === amount.toString() ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDepositAmount(amount.toString())}
                >
                  {formatSats(amount)}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
            <div>
              <label className="text-sm font-medium text-gray-700">Custom Amount (sats)</label>
              <Input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                min={100}
                max={1000000}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 100 sats | Maximum: 1,000,000 sats
              </p>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Development Mode:</strong> Credits are added instantly for testing. In
                production, this will generate a Lightning invoice for payment.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDepositDialog(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleDeposit} disabled={depositing}>
                {depositing ? 'Adding...' : `Add ${formatSats(parseInt(depositAmount) || 0)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AICreditsPanel;
