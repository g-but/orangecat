'use client';

import Card from '@/components/ui/Card';
import { ArrowUpRight, Clock } from 'lucide-react';

interface BalanceSummaryProps {
  balance: number;
  pendingAmount: number;
  lastUpdated: string;
}

export default function BalanceSummary({
  balance,
  pendingAmount,
  lastUpdated,
}: BalanceSummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const _getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return 100;
    }
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(balance)}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <ArrowUpRight className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          Updated {lastUpdated}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Transactions</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(pendingAmount)}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">Awaiting confirmation</div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Received</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(balance + pendingAmount)}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <ArrowUpRight className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">Including pending transactions</div>
      </Card>
    </div>
  );
}
