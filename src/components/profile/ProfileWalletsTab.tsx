'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Wallet, WalletFormData } from '@/types/wallet';
import { WalletManager } from '@/components/wallets/WalletManager';
import { Card, CardContent } from '@/components/ui/Card';
import { Wallet as WalletIcon, Info } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ProfileWalletsTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}

/**
 * ProfileWalletsTab Component
 *
 * Displays and manages user's Bitcoin wallets on their profile.
 * Only shown for own profile (not visible to others).
 */
export default function ProfileWalletsTab({ profile, isOwnProfile }: ProfileWalletsTabProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load wallets
  useEffect(() => {
    if (!profile.id) return;

    const loadWallets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/wallets?profile_id=${profile.id}`);
        if (!response.ok) {
          throw new Error('Failed to load wallets');
        }

        const data = await response.json();
        setWallets(data.wallets || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load wallets';
        logger.error('Error loading wallets', err, 'ProfileWalletsTab');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadWallets();
  }, [profile.id]);

  // Add wallet
  const handleAddWallet = async (data: WalletFormData) => {
    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          entity_type: 'profile',
          entity_id: profile.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add wallet');
      }

      const result = await response.json();
      setWallets(prev => [...prev, result.wallet]);
      logger.info('Wallet added successfully', null, 'ProfileWalletsTab');
    } catch (err) {
      logger.error('Error adding wallet', err, 'ProfileWalletsTab');
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
      logger.info('Wallet updated successfully', null, 'ProfileWalletsTab');
    } catch (err) {
      logger.error('Error updating wallet', err, 'ProfileWalletsTab');
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
      logger.info('Wallet deleted successfully', null, 'ProfileWalletsTab');
    } catch (err) {
      logger.error('Error deleting wallet', err, 'ProfileWalletsTab');
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
      logger.info('Wallet balance refreshed', null, 'ProfileWalletsTab');
    } catch (err) {
      logger.error('Error refreshing wallet', err, 'ProfileWalletsTab');
      alert('Failed to refresh wallet balance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading wallets</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOwnProfile) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <WalletIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Wallet information is private</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Manage Your Wallets</h3>
            <p className="text-sm text-blue-800">
              Add and manage your Bitcoin wallets. You can categorize them, set goals, and track balances.
              Wallets added here will also appear in "My Wallets" from the sidebar.
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Manager */}
      <Card>
        <CardContent className="p-6">
          <WalletManager
            wallets={wallets}
            entityType="profile"
            entityId={profile.id}
            onAdd={handleAddWallet}
            onUpdate={handleUpdateWallet}
            onDelete={handleDeleteWallet}
            onRefresh={handleRefreshWallet}
            maxWallets={10}
            isOwner={isOwnProfile}
          />
        </CardContent>
      </Card>
    </div>
  );
}
