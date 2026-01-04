/**
 * Wallets Help Section
 *
 * Help section component with tips and guidance.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { AlertCircle } from 'lucide-react';

interface WalletsHelpSectionProps {
  isDesktop: boolean;
}

export function WalletsHelpSection({ isDesktop }: WalletsHelpSectionProps) {
  return (
    <details className="mt-6 lg:mt-8 bg-gray-50 rounded-lg overflow-hidden" open={isDesktop}>
      <summary className="p-4 lg:p-6 flex items-start gap-3 cursor-pointer list-none">
        <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm lg:text-base text-gray-900 mb-0 lg:mb-2">Quick tips</p>
          {/* Mobile: Show only key point, Desktop: Show all */}
          <p className="lg:hidden text-xs text-gray-600 mt-1">
            Use xpub/ypub/zpub for best tracking • Never paste seed phrase
          </p>
        </div>
        <svg
          className="w-5 h-5 text-gray-600 flex-shrink-0 lg:hidden transition-transform"
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
      <div className="px-4 pb-4 lg:px-6 lg:pb-6 pt-0 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          <ul className="list-disc list-inside space-y-1.5">
            <li>
              <strong>Recommended:</strong> Use extended public keys (xpub, ypub, zpub) to
              automatically track all addresses and transactions
            </li>
            <li>Single addresses (1..., 3..., bc1...) work too, but only track one address</li>
            <li>Never paste your seed phrase here – only public data</li>
            <li>Mark wallets as active to display them on your public profile</li>
          </ul>
          <details className="mt-3">
            <summary className="cursor-pointer text-orange-600 hover:text-orange-700 text-xs font-medium">
              Why use extended public keys?
            </summary>
            <p className="mt-2 text-xs text-gray-600 pl-4">
              Bitcoin wallets generate new addresses after each transaction for privacy. With an
              extended public key (xpub/ypub/zpub), we can automatically track all these addresses
              and show your complete balance and transaction history. A single address only shows
              transactions to that one address.
            </p>
          </details>
        </div>
      </div>
    </details>
  );
}


