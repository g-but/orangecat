'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Wallet } from '@/types/wallet';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Bitcoin, Zap, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import ProfileWalletSection from './ProfileWalletSection';
import BitcoinDonationCard from '@/components/bitcoin/BitcoinDonationCard';
import { logger } from '@/utils/logger';

interface ProfileWalletsTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}

/**
 * ProfileWalletsTab Component
 *
 * Displays all wallet addresses and payment methods for the profile.
 * Supports both multi-wallet system and legacy addresses.
 *
 * Best Practices:
 * - DRY: Reuses existing wallet components
 * - Modular: Separate tab for wallet info
 * - Progressive: Lazy loaded on first click
 * - Minimal clicks: All wallet info in one place
 */
export default function ProfileWalletsTab({ profile, isOwnProfile }: ProfileWalletsTabProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wallets on mount
  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/wallets?profile_id=${profile.id}`);

        if (response.ok) {
          const data = await response.json();
          setWallets(data.wallets || []);
        }
      } catch (error) {
        logger.error('Failed to load wallets', error, 'ProfileWalletsTab');
      } finally {
        setLoading(false);
      }
    };

    loadWallets();
  }, [profile.id]);

  const hasWallets = wallets.length > 0;
  const hasLegacyAddresses = profile.bitcoin_address || profile.lightning_address;
  const hasAnyPaymentMethod = hasWallets || hasLegacyAddresses;

  return (
    <div className="space-y-6">
      {/* Empty State */}
      {!hasAnyPaymentMethod && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <WalletIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Payment Methods Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {isOwnProfile
                ? 'Add Bitcoin or Lightning addresses to start accepting donations.'
                : 'This user has not added any payment methods yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Multi-Wallet System */}
      {hasWallets && (
        <ProfileWalletSection
          wallets={wallets}
          loading={loading}
          isOwnProfile={isOwnProfile}
          legacyBitcoinAddress={profile.bitcoin_address}
          legacyLightningAddress={profile.lightning_address}
        />
      )}

      {/* Legacy Bitcoin Address */}
      {!hasWallets && profile.bitcoin_address && (
        <Card data-bitcoin-card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-orange-500" />
              Bitcoin Address
            </h3>
          </CardHeader>
          <CardContent>
            <BitcoinDonationCard
              address={profile.bitcoin_address}
              recipientName={profile.name || profile.username || 'User'}
              amount={0.001}
              purpose="Support this profile"
              qrSize={200}
            />
          </CardContent>
        </Card>
      )}

      {/* Legacy Lightning Address */}
      {!hasWallets && profile.lightning_address && (
        <Card data-lightning-card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Lightning Address
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Lightning Address</div>
              <div className="font-mono text-sm break-all bg-white p-3 rounded border border-gray-200">
                {profile.lightning_address}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-900 mb-1">Lightning Network</div>
                  <p className="text-sm text-yellow-700">
                    Send instant Bitcoin payments using a Lightning-compatible wallet.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Note for Own Profile */}
      {isOwnProfile && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-medium mb-1">Manage Your Wallets</p>
                <p className="text-blue-700">
                  You can add and manage multiple wallets from your profile settings.
                  Create separate wallets for different projects or purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
