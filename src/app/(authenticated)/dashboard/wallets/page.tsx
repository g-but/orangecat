'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WalletManager } from '@/components/wallets/WalletManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Wallet, WalletFormData } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { Wallet as WalletIcon, Plus, TrendingUp, Bitcoin, Info } from 'lucide-react';
import Link from 'next/link';

export default function WalletsPage() {
  const { user, profile, hydrated } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's wallets
  useEffect(() => {
    if (!hydrated || !user?.id) return;

    const loadWallets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/wallets');
        if (!response.ok) {
          throw new Error('Failed to load wallets');
        }

        const data = await response.json();
        setWallets(data.wallets || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load wallets';
        logger.error('Error loading wallets', err, 'WalletsPage');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadWallets();
  }, [user?.id, hydrated]);

  // Add wallet
  const handleAddWallet = async (data: WalletFormData) => {
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          entity_type: 'profile',
          entity_id: user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add wallet');
      }

      const result = await response.json();
      setWallets(prev => [...prev, result.wallet]);
      logger.info('Wallet added successfully', null, 'WalletsPage');
    } catch (err) {
      logger.error('Error adding wallet', err, 'WalletsPage');
      throw err;
    }
  };

  // Update wallet
  const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update wallet');
      }

      const result = await response.json();
      setWallets(prev => prev.map(w => (w.id === walletId ? result.wallet : w)));
      logger.info('Wallet updated successfully', null, 'WalletsPage');
    } catch (err) {
      logger.error('Error updating wallet', err, 'WalletsPage');
      throw err;
    }
  };

  // Delete wallet
  const handleDeleteWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete wallet');
      }

      setWallets(prev => prev.filter(w => w.id !== walletId));
      logger.info('Wallet deleted successfully', null, 'WalletsPage');
    } catch (err) {
      logger.error('Error deleting wallet', err, 'WalletsPage');
      throw err;
    }
  };

  // Refresh wallet balance
  const handleRefreshWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh wallet');
      }

      const result = await response.json();
      setWallets(prev => prev.map(w => (w.id === walletId ? result.wallet : w)));
      logger.info('Wallet balance refreshed', null, 'WalletsPage');
    } catch (err) {
      logger.error('Error refreshing wallet', err, 'WalletsPage');
      alert('Failed to refresh wallet balance. Please try again.');
    }
  };

  // Calculate totals
  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance_btc || 0), 0);
  const totalGoal = wallets.reduce((sum, wallet) => sum + (wallet.goal_amount || 0), 0);
  const activeWallets = wallets.filter(w => w.is_active);

  if (!hydrated || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
        <p className="text-gray-600 mb-6">You need to be signed in to manage your wallets.</p>
        <Button onClick={() => (window.location.href = '/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wallets</h1>
              <p className="text-gray-600">Manage your Bitcoin wallets and track balances</p>
            </div>
          </div>
          <Link href="/wallets">
            <Button variant="outline" size="sm">
              <Info className="w-4 h-4 mr-2" />
              Get a Wallet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-orange-600">{totalBalance.toFixed(8)} BTC</p>
                <p className="text-xs text-gray-500 mt-1">
                  ~${((totalBalance * 50000).toFixed(2))} USD
                </p>
              </div>
              <Bitcoin className="w-12 h-12 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Wallets</p>
                <p className="text-2xl font-bold text-gray-900">{activeWallets.length}</p>
                <p className="text-xs text-gray-500 mt-1">of {wallets.length} total</p>
              </div>
              <WalletIcon className="w-12 h-12 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Funding Progress</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalGoal > 0 ? ((totalBalance / totalGoal) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalBalance.toFixed(4)} / {totalGoal.toFixed(4)} BTC
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error loading wallets</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How Wallet Management Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Add multiple wallets</strong> for different purposes (donations, savings, etc.)</li>
              <li>• <strong>Track balances</strong> automatically using Bitcoin addresses or xpub keys</li>
              <li>• <strong>Set goals</strong> for each wallet to track progress</li>
              <li>• <strong>Categorize wallets</strong> to stay organized</li>
              <li>• Note: We only watch addresses - we never have access to your funds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Wallet Manager */}
      <Card>
        <CardContent className="p-6">
          <WalletManager
            wallets={wallets}
            entityType="profile"
            entityId={user.id}
            onAdd={handleAddWallet}
            onUpdate={handleUpdateWallet}
            onDelete={handleDeleteWallet}
            onRefresh={handleRefreshWallet}
            maxWallets={10}
            isOwner={true}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-1">What's a Bitcoin Address?</h4>
            <p>
              A Bitcoin address (starts with bc1, 1, or 3) is like a bank account number. You can share it to
              receive donations. Paste it here to track the balance.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What's an xpub?</h4>
            <p>
              An extended public key (xpub, ypub, zpub) allows tracking of multiple addresses in a wallet.
              This is more private and secure than sharing individual addresses.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Is my Bitcoin safe?</h4>
            <p>
              Yes! We only track your wallet's balance - we never have access to your funds. You remain in
              full control of your Bitcoin at all times.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Need a wallet?</h4>
            <p>
              If you don't have a Bitcoin wallet yet,{' '}
              <Link href="/wallets" className="text-orange-600 hover:text-orange-700 font-medium">
                check our recommendations
              </Link>{' '}
              for beginner-friendly options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
