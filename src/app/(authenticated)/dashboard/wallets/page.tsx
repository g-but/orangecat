'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { WalletManager } from '@/components/wallets/WalletManager';
import { Wallet, WalletFormData } from '@/types/wallet';
import { toast } from 'sonner';
import { Wallet as WalletIcon, Info, AlertCircle } from 'lucide-react';

/**
 * Dashboard Wallets Page
 *
 * Private page for users to manage their Bitcoin wallets.
 * Reuses WalletManager component following DRY principles.
 *
 * Single source of truth: WalletManager for all wallet operations
 * Separation of concerns: This page handles data fetching/API calls, WalletManager handles UI
 */
export default function DashboardWalletsPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's wallets using profile from auth store
  useEffect(() => {
    const fetchWallets = async () => {
      if (!user?.id || !profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch wallets for this profile (profile already from auth store)
        const walletsResponse = await fetch(`/api/wallets?profile_id=${profile.id}`);
        if (walletsResponse.ok) {
          const data = await walletsResponse.json();
          setWallets(Array.isArray(data) ? data : []);
        } else {
          // Wallets table might not exist yet, set empty array
          setWallets([]);
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
        // Don't show error toast if table doesn't exist
        setWallets([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && profile) {
      fetchWallets();
    }
  }, [user?.id, profile?.id, authLoading]);

  // Handle wallet add
  const handleAddWallet = async (data: WalletFormData) => {
    if (!user?.id || !profile?.id) {
      return;
    }

    try {
      // Use profile from auth store (already loaded)

      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          profile_id: profile.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wallet');
      }

      const newWallet = await response.json();
      setWallets(prev => [...prev, newWallet]);
      toast.success('Wallet added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add wallet');
      throw error;
    }
  };

  // Handle wallet update
  const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wallet');
      }

      const updatedWallet = await response.json();
      setWallets(prev => prev.map(w => (w.id === walletId ? updatedWallet : w)));
      toast.success('Wallet updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update wallet');
      throw error;
    }
  };

  // Handle wallet delete
  const handleDeleteWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete wallet');
      }

      setWallets(prev => prev.filter(w => w.id !== walletId));
      toast.success('Wallet deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete wallet');
      throw error;
    }
  };

  // Handle wallet refresh
  const handleRefreshWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/wallets/${walletId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh wallet');
      }

      const refreshedWallet = await response.json();
      setWallets(prev => prev.map(w => (w.id === walletId ? refreshedWallet : w)));
      toast.success('Wallet refreshed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh wallet');
      throw error;
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return <Loading />;
  }

  // Not authenticated
  if (!user) {
    router.push('/auth');
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <WalletIcon className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Manage Wallets</h1>
        </div>
        <p className="text-gray-600 mb-4">
          Add and manage your Bitcoin wallets. Wallets marked as active will appear on your public
          profile.
        </p>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Bitcoin Wallets</p>
            <p>
              Add your Bitcoin wallet addresses or extended public keys (xpub) to receive donations
              and support. Your wallet balances will be displayed on your profile (if you choose to
              make them active).
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Manager */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
      </div>

      {/* Empty State */}
      {wallets.length === 0 && (
        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets yet</h3>
          <p className="text-gray-600 mb-4">
            Add your first Bitcoin wallet to start receiving support
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-2">Need help?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use standard Bitcoin addresses (starting with 1, 3, or bc1)</li>
              <li>Or use extended public keys (xpub, ypub, zpub) for better privacy</li>
              <li>Lightning addresses should be in the format: username@domain.com</li>
              <li>Mark wallets as active to display them on your public profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
