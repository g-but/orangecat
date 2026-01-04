/**
 * Wallets Page Header
 *
 * Header component for the wallets page with info banner.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { Wallet as WalletIcon, Info } from 'lucide-react';

interface WalletsPageHeaderProps {
  isDesktop: boolean;
}

export function WalletsPageHeader({ isDesktop }: WalletsPageHeaderProps) {
  return (
    <div className="mb-6 lg:mb-8">
      <div className="flex items-center gap-3 mb-2">
        <WalletIcon className="w-8 h-8 text-orange-600" />
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manage Wallets</h1>
      </div>
      {/* Desktop: Full description, Mobile: Shortened */}
      <p className="hidden lg:block text-gray-600 mb-4 max-w-2xl">
        Add and manage your Bitcoin wallets. Each wallet can represent a specific funding need
        such as rent, food, medical costs, or a one‑time savings goal.
      </p>
      <p className="lg:hidden text-sm text-gray-600 mb-3">
        Add Bitcoin wallets for different funding needs
      </p>

      {/* Info Banner - Collapsible on Mobile, Open on Desktop */}
      <details className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden" open={isDesktop}>
        <summary className="p-3 lg:p-4 flex items-start gap-3 cursor-pointer list-none">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 flex-1">
            <p className="font-medium">About Bitcoin Wallets</p>
            <p className="lg:hidden mt-1 text-xs">
              Connect your Bitcoin address or xpub to receive support
            </p>
          </div>
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 lg:hidden transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 pt-0 lg:pt-0 text-sm text-blue-900 border-t border-blue-200 lg:border-t-0">
          <p className="mt-2">
            Connect a Bitcoin address or extended public key (xpub/ypub/zpub) from a wallet you
            control. Active wallets appear on your profile so supporters know exactly what they are
            funding.
          </p>
        </div>
      </details>
    </div>
  );
}


