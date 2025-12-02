'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Wallet } from '@/types/wallet';
import { logger } from '@/utils/logger';
import ProfileWalletSection from '@/components/profile/ProfileWalletSection';

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
          setWallets(data.data || []);
        }
      } catch (error) {
        logger.error('Failed to load wallets', error, 'ProfileWalletsTab');
      } finally {
        setLoading(false);
      }
    };

    loadWallets();
  }, [profile.id]);

  return (
    <ProfileWalletSection
      wallets={wallets}
      loading={loading}
      isOwnProfile={isOwnProfile}
      legacyBitcoinAddress={profile.bitcoin_address}
      legacyLightningAddress={profile.lightning_address}
      legacyBalance={(profile as any).bitcoin_balance}
    />
  );
}
