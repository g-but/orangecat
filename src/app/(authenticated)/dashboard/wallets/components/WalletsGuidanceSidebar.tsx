/**
 * Wallets Guidance Sidebar
 *
 * Desktop guidance sidebar component.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { Card } from '@/components/ui/Card';
import { DynamicSidebar } from '@/components/create/DynamicSidebar';
import {
  walletGuidanceContent,
  walletDefaultContent,
  type WalletFieldType,
} from '@/lib/wallet-guidance';

interface WalletsGuidanceSidebarProps {
  focusedField: WalletFieldType;
}

export function WalletsGuidanceSidebar({ focusedField }: WalletsGuidanceSidebarProps) {
  return (
    <div className="hidden lg:block lg:col-span-5 lg:order-2">
      <div className="lg:sticky lg:top-8 space-y-6">
        {/* Simple explainer / checklist */}
        <Card className="p-6 shadow-sm border-gray-200">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-gray-900">How wallet setup works</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create one wallet per funding goal or budget. You can always edit or archive wallets
              later.
            </p>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Choose a clear category like Rent, Food, or Emergency</li>
            <li>Give the wallet a human name that explains its purpose</li>
            <li>Paste a Bitcoin address or xpub from your own wallet</li>
            <li>Optionally set a funding goal in CHF, EUR, USD, BTC, or SATS</li>
          </ul>
        </Card>

        {/* Dynamic Guidance */}
        <DynamicSidebar<NonNullable<WalletFieldType>>
          activeField={focusedField}
          guidanceContent={walletGuidanceContent}
          defaultContent={walletDefaultContent}
        />
      </div>
    </div>
  );
}


