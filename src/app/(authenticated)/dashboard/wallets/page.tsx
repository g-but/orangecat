'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Wallet } from '@/types/wallet';
import { WalletList } from '@/components/wallet/WalletList';
import { TransferModal } from '@/components/wallet/TransferModal';
import { Plus, ArrowLeftRight, TrendingUp, TrendingDown, Wallet as WalletIcon } from 'lucide-react';
import Link from 'next/link';

export default function WalletsPage() {
  const { user, profile } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>();
  const [error, setError] = useState<string | null>(null);

  const BTC_PRICE_USD = 62000; // TODO: Fetch from API

  // Fetch wallets
  const fetchWallets = async () => {
    if (!profile?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/wallets?profile_id=${profile.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallets');
      }

      setWallets(data.wallets || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [profile?.id]);

  const handleTransfer = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsTransferOpen(true);
  };

  const handleTransferComplete = () => {
    fetchWallets(); // Refresh wallet list after transfer
  };

  // Calculate statistics
  const stats = {
    totalBTC: wallets.reduce((sum, w) => sum + w.balance_btc, 0),
    totalUSD: wallets.reduce((sum, w) => sum + w.balance_btc * BTC_PRICE_USD, 0),
    totalWallets: wallets.length,
    activeGoals: wallets.filter(w => w.behavior_type === 'one_time_goal' && w.goal_amount).length,
    activeBudgets: wallets.filter(w => w.behavior_type === 'recurring_budget' && w.budget_amount).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <WalletIcon className="w-8 h-8 mr-3 text-blue-600" />
                My Wallets
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your Bitcoin wallets and organize your funds
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsTransferOpen(true)}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Transfer
              </button>
              <Link
                href="/dashboard/wallets/new"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Balance */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-90">Total Balance</span>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-2xl font-bold">{stats.totalBTC.toFixed(8)} BTC</p>
              <p className="text-sm opacity-90 mt-1">
                ≈ ${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Total Wallets */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Wallets</span>
                <WalletIcon className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWallets}</p>
              <p className="text-sm text-gray-500 mt-1">
                Active wallets
              </p>
            </div>

            {/* Savings Goals */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Savings Goals</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeGoals}</p>
              <p className="text-sm text-gray-500 mt-1">
                Active goals
              </p>
            </div>

            {/* Recurring Budgets */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Recurring Budgets</span>
                <TrendingDown className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBudgets}</p>
              <p className="text-sm text-gray-500 mt-1">
                Monthly budgets
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Wallets List */}
        {wallets.length === 0 && !error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <WalletIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first Bitcoin wallet. Organize your funds with
              budgets, savings goals, or general purpose wallets.
            </p>
            <Link
              href="/dashboard/wallets/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Wallet
            </Link>
          </div>
        ) : (
          <WalletList
            wallets={wallets}
            onTransfer={handleTransfer}
            onRefresh={fetchWallets}
          />
        )}
      </div>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setSelectedWallet(undefined);
        }}
        wallets={wallets}
        sourceWallet={selectedWallet}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
}
