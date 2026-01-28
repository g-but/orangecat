'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  MessageSquare,
  Users,
  Wallet,
  RefreshCw,
  Bot,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@/utils/logger';
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
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface AssistantRevenue {
  id: string;
  name: string;
  avatar_url: string | null;
  total_revenue_sats: number;
  total_conversations: number;
  total_messages: number;
  pricing_model: string;
  price_per_message: number;
}

interface RevenueSummary {
  total_revenue_sats: number;
  available_balance_sats: number;
  total_conversations: number;
  total_messages: number;
  total_assistants: number;
}

interface RevenueData {
  summary: RevenueSummary;
  assistants: AssistantRevenue[];
}

interface Withdrawal {
  id: string;
  amount_sats: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  lightning_address: string | null;
  created_at: string;
}

interface EarningsData {
  total_earned_sats: number;
  total_withdrawn_sats: number;
  available_balance_sats: number;
  pending_withdrawal_sats: number;
}

const MIN_WITHDRAWAL_SATS = 1000;

export function AIRevenuePanel() {
  const { formatAmount } = useDisplayCurrency();
  const [data, setData] = useState<RevenueData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [lightningAddress, setLightningAddress] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-credits/revenue');
      if (!response.ok) {
        throw new Error('Failed to fetch revenue');
      }
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      logger.error('Failed to fetch revenue', error, 'AI');
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-credits/withdrawals?limit=5');
      if (!response.ok) {
        return;
      }
      const result = await response.json();
      if (result.success && result.data) {
        setEarnings(result.data.earnings);
        setRecentWithdrawals(result.data.withdrawals);
      }
    } catch (error) {
      logger.error('Failed to fetch withdrawals', error, 'AI');
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
    fetchWithdrawals();
  }, [fetchRevenue, fetchWithdrawals]);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_SATS) {
      toast.error(`Minimum withdrawal is ${formatAmount(MIN_WITHDRAWAL_SATS)}`);
      return;
    }

    if (!lightningAddress || !lightningAddress.includes('@')) {
      toast.error('Please enter a valid Lightning address');
      return;
    }

    const availableBalance = earnings?.available_balance_sats || 0;
    const pendingAmount = earnings?.pending_withdrawal_sats || 0;
    const maxWithdrawable = availableBalance - pendingAmount;

    if (amount > maxWithdrawable) {
      toast.error(`Maximum available for withdrawal: ${formatAmount(maxWithdrawable)}`);
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/ai-credits/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_sats: amount,
          lightning_address: lightningAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request withdrawal');
      }

      toast.success('Withdrawal request submitted!');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');

      // Refresh data
      fetchRevenue();
      fetchWithdrawals();
    } catch (error) {
      logger.error('Withdrawal failed', error, 'AI');
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {
    total_revenue_sats: 0,
    available_balance_sats: 0,
    total_conversations: 0,
    total_messages: 0,
    total_assistants: 0,
  };

  const assistants = data?.assistants || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Creator Revenue
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchRevenue} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Summary */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-800 mb-1">Total Earnings</div>
          <div className="text-3xl font-bold text-green-900">
            {formatAmount(earnings?.total_earned_sats || summary.total_revenue_sats)}
          </div>
          <div className="text-sm text-green-700 mt-1 space-y-0.5">
            <div>
              Available:{' '}
              {formatAmount(earnings?.available_balance_sats || summary.available_balance_sats)}
            </div>
            {(earnings?.pending_withdrawal_sats || 0) > 0 && (
              <div className="text-yellow-700">
                Pending: {formatAmount(earnings?.pending_withdrawal_sats || 0)}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Users className="h-4 w-4" />
              Conversations
            </div>
            <div className="text-xl font-semibold mt-1">
              {summary.total_conversations.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MessageSquare className="h-4 w-4" />
              Messages
            </div>
            <div className="text-xl font-semibold mt-1">
              {summary.total_messages.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Withdraw Button */}
        {(earnings?.available_balance_sats || 0) - (earnings?.pending_withdrawal_sats || 0) >=
          MIN_WITHDRAWAL_SATS && (
          <Button className="w-full" variant="outline" onClick={() => setShowWithdrawDialog(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            Withdraw Earnings
          </Button>
        )}

        {/* Recent Withdrawals */}
        {recentWithdrawals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Recent Withdrawals</h4>
            <div className="space-y-2">
              {recentWithdrawals.slice(0, 3).map(withdrawal => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <div className="font-medium">{formatAmount(withdrawal.amount_sats)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{withdrawal.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-Assistant Breakdown */}
        {assistants.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">By Assistant</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assistants.map(assistant => (
                <div
                  key={assistant.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      {assistant.avatar_url ? (
                        <img
                          src={assistant.avatar_url}
                          alt={assistant.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <Bot className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{assistant.name}</div>
                      <div className="text-xs text-gray-500">
                        {assistant.total_conversations} chats, {assistant.total_messages} msgs
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-medium text-green-600">
                      {formatAmount(assistant.total_revenue_sats)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {assistants.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No AI assistants yet. Create one to start earning!
          </div>
        )}
      </CardContent>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              Withdraw Earnings
            </DialogTitle>
            <DialogDescription>
              Withdraw your AI assistant earnings to a Lightning address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Available Balance */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">Available to withdraw</div>
              <div className="text-2xl font-bold text-green-900">
                {formatAmount(
                  (earnings?.available_balance_sats || 0) - (earnings?.pending_withdrawal_sats || 0)
                )}
              </div>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 50000].map(amount => {
                const maxAmount =
                  (earnings?.available_balance_sats || 0) -
                  (earnings?.pending_withdrawal_sats || 0);
                const isDisabled = amount > maxAmount;
                return (
                  <Button
                    key={amount}
                    variant={withdrawAmount === amount.toString() ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setWithdrawAmount(amount.toString())}
                    disabled={isDisabled}
                  >
                    {formatAmount(amount)}
                  </Button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div>
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                min={MIN_WITHDRAWAL_SATS}
                max={
                  (earnings?.available_balance_sats || 0) - (earnings?.pending_withdrawal_sats || 0)
                }
                className="mt-1"
                placeholder={`Minimum: ${formatAmount(MIN_WITHDRAWAL_SATS)}`}
              />
            </div>

            {/* Lightning Address */}
            <div>
              <label className="text-sm font-medium text-gray-700">Lightning Address</label>
              <Input
                type="email"
                value={lightningAddress}
                onChange={e => setLightningAddress(e.target.value)}
                className="mt-1"
                placeholder="your@wallet.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Lightning address to receive the withdrawal
              </p>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Withdrawals are typically processed within a few minutes. You
                will receive the funds at your Lightning address.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWithdrawDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || !lightningAddress}
              >
                {withdrawing
                  ? 'Processing...'
                  : `Withdraw ${formatAmount(parseInt(withdrawAmount) || 0)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AIRevenuePanel;
