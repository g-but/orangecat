'use client';

import { Bitcoin, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, WALLET_CATEGORIES } from '@/types/wallet';
import BitcoinDonationCard from '@/components/bitcoin/BitcoinDonationCard';
import BitcoinWalletStatsCompact from '@/components/bitcoin/BitcoinWalletStatsCompact';
import { WalletsSkeleton } from '@/components/profile/ProfileSkeleton';

interface ProfileWalletSectionProps {
  wallets: Wallet[];
  loading: boolean;
  isOwnProfile: boolean;
  legacyBitcoinAddress?: string | null;
  legacyLightningAddress?: string | null;
  legacyBalance?: number | null;
  onEditClick?: () => void;
}

/**
 * ProfileWalletSection Component
 *
 * Displays wallet cards for accepting Bitcoin funding.
 * Supports both new multi-wallet system and legacy single address.
 */
export default function ProfileWalletSection({
  wallets,
  loading,
  isOwnProfile,
  legacyBitcoinAddress,
  legacyLightningAddress,
  legacyBalance,
  onEditClick,
}: ProfileWalletSectionProps) {
  // Show loading skeleton
  if (loading) {
    return <WalletsSkeleton />;
  }

  // Show new multi-wallet system if wallets exist
  if (wallets.length > 0) {
    return (
      <div className="space-y-4" data-wallet-section>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bitcoin className="w-5 h-5 text-orange-500" />
          Support This Profile
        </h3>

        <div className="grid gap-4 lg:grid-cols-2">
          {wallets
            .filter(w => w.is_active)
            .map(wallet => {
              const categoryInfo = WALLET_CATEGORIES[wallet.category];
              const progressPercent = wallet.goal_amount
                ? (wallet.balance_btc / wallet.goal_amount) * 100
                : 0;

              return (
                <div
                  key={wallet.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">{wallet.category_icon || categoryInfo.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        {wallet.label}
                        {wallet.is_primary && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </h4>
                      {wallet.description && (
                        <p className="text-sm text-gray-600 mt-1">{wallet.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{categoryInfo.label}</p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                    <div className="text-xl font-bold text-orange-600">
                      {wallet.balance_btc.toFixed(8)} BTC
                    </div>
                  </div>

                  {/* Goal progress */}
                  {wallet.goal_amount && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Goal</span>
                        <span className="font-medium">
                          {wallet.balance_btc.toFixed(4)} / {wallet.goal_amount}{' '}
                          {wallet.goal_currency}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {progressPercent.toFixed(1)}% funded
                      </div>
                    </div>
                  )}

                  {/* QR Code for easy scanning */}
                  <div className="mb-4 flex justify-center">
                    <div className="bg-white p-3 rounded-lg border-2 border-gray-200 shadow-sm">
                      <QRCodeSVG
                        value={`bitcoin:${wallet.address_or_xpub}`}
                        size={120}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Address with copy button */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Bitcoin Address'}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.address_or_xpub);
                          toast.success('Address copied to clipboard');
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        aria-label="Copy wallet address"
                      >
                        <Copy className="w-3 h-3 inline mr-1" />
                        Copy
                      </button>
                    </div>
                    <code
                      className="text-xs text-gray-700 block font-mono break-all bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(wallet.address_or_xpub);
                        toast.success('Address copied to clipboard');
                      }}
                      title="Click to copy address"
                    >
                      {wallet.address_or_xpub.slice(0, 20)}...
                      {wallet.address_or_xpub.slice(-10)}
                    </code>
                  </div>

                  {/* Send Button */}
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      onClick={() => {
                        const bitcoinUri = `bitcoin:${wallet.address_or_xpub}`;
                        window.location.href = bitcoinUri;
                        // Fallback: show toast if wallet doesn't open
                        setTimeout(() => {
                          toast.info(
                            "If your wallet didn't open, copy the address and paste it manually"
                          );
                        }, 500);
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Send with Wallet
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  // Show empty state for own profile
  if (wallets.length === 0 && isOwnProfile) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
        <div className="text-center text-gray-500 py-8">
          <Bitcoin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Accept Bitcoin Funding</h3>
          <p className="text-sm mb-4">
            Add Bitcoin wallets to start receiving funding from supporters
          </p>
          {onEditClick && (
            <Button variant="outline" onClick={onEditClick}>
              <Bitcoin className="w-4 h-4 mr-2" />
              Add Wallets
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show legacy Bitcoin address if no new wallets but has legacy addresses
  if (wallets.length === 0 && (legacyBitcoinAddress || legacyLightningAddress)) {
    return (
      <div className="space-y-4">
        <BitcoinDonationCard
          bitcoinAddress={legacyBitcoinAddress || undefined}
          lightningAddress={legacyLightningAddress || undefined}
          balance={legacyBalance || undefined}
        />
        {legacyBitcoinAddress && <BitcoinWalletStatsCompact address={legacyBitcoinAddress} />}
      </div>
    );
  }

  // No wallets and not own profile - show nothing
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6 text-center text-gray-600">
      <Bitcoin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No wallets shared yet</h3>
      <p className="text-sm text-gray-500">
        This profile has not added any wallets you can send to yet.
      </p>
    </div>
  );
}
