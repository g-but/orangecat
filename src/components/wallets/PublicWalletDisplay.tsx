'use client';

import { Wallet } from '@/types/wallet';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Bitcoin, Zap, Copy, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { useState } from 'react';

interface PublicWalletDisplayProps {
  wallets: Wallet[];
  profileName?: string;
}

/**
 * PublicWalletDisplay Component
 *
 * Displays wallet information on public profiles.
 * Shows wallet labels, descriptions, categories, and addresses in a user-friendly format.
 * Mobile-friendly and responsive.
 */
export default function PublicWalletDisplay({
  wallets,
  profileName,
}: PublicWalletDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAddress = async (address: string, walletId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(walletId);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'lightning':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'bitcoin':
      case 'xpub':
      default:
        return <Bitcoin className="w-5 h-5 text-orange-500" />;
    }
  };

  const openInBlockExplorer = (address: string, walletType: string) => {
    if (walletType === 'lightning') {
      // Lightning addresses don't have block explorers
      return;
    }

    // For Bitcoin addresses and xpubs, open in mempool.space
    const url = `https://mempool.space/address/${address}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (wallets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Bitcoin className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No public wallets</p>
            <p className="text-sm mt-1">
              {profileName || 'This user'} hasn't added any public wallets yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <p className="text-sm text-blue-800">
          <strong>{profileName || 'This user'}'s wallets</strong> - You can send Bitcoin directly to
          any of these addresses to support their work.
        </p>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map((wallet) => (
          <Card
            key={wallet.id}
            className="hover:shadow-md transition-shadow"
            data-wallet-id={wallet.id}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-2xl">{wallet.category_icon || '💰'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{wallet.label}</h3>
                    <p className="text-xs text-gray-500 capitalize">{wallet.category}</p>
                  </div>
                </div>
                {getWalletIcon(wallet.wallet_type)}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Description */}
              {wallet.description && (
                <p className="text-sm text-gray-600 break-words">{wallet.description}</p>
              )}

              {/* Goal Information */}
              {wallet.goal_amount && wallet.goal_currency && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-800 mb-1">Fundraising Goal</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-green-900">
                      {wallet.goal_currency === 'BTC' ? '₿' : '$'}
                      {wallet.goal_amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-green-700">{wallet.goal_currency}</span>
                  </div>
                  {wallet.goal_deadline && (
                    <p className="text-xs text-green-700 mt-1">
                      Deadline: {new Date(wallet.goal_deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {wallet.wallet_type === 'lightning' ? 'Lightning Address' : 'Bitcoin Address'}
                </p>
                <div className="flex gap-2">
                  <code
                    className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded border border-gray-200 break-all font-mono"
                    title={wallet.address_or_xpub}
                  >
                    {wallet.address_or_xpub.length > 40
                      ? `${wallet.address_or_xpub.slice(0, 20)}...${wallet.address_or_xpub.slice(-20)}`
                      : wallet.address_or_xpub}
                  </code>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyAddress(wallet.address_or_xpub, wallet.id)}
                    className="flex-1 sm:flex-none"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    {copiedId === wallet.id ? 'Copied!' : 'Copy'}
                  </Button>

                  {wallet.wallet_type !== 'lightning' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openInBlockExplorer(wallet.address_or_xpub, wallet.wallet_type)}
                      className="flex-1 sm:flex-none"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Explorer
                    </Button>
                  )}
                </div>
              </div>

              {/* Balance (if available) */}
              {wallet.balance_btc !== null && wallet.balance_btc > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Current Balance</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₿{(wallet.balance_btc / 100000000).toFixed(8)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
