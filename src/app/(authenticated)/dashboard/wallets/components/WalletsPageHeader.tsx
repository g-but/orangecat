/**
 * Wallets Page Header
 *
 * Header component for the wallets page.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { Wallet as WalletIcon } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export function WalletsPageHeader() {
  return (
    <div className="mb-6 lg:mb-8">
      <Breadcrumb items={[{ label: 'Wallets' }]} className="mb-4" />
      <div className="flex items-center gap-3 mb-2">
        <WalletIcon className="w-8 h-8 text-bitcoinOrange" />
        <h1 className="text-2xl lg:text-3xl font-bold text-fg-primary">Manage Wallets</h1>
      </div>
      {/* Desktop: Full description, Mobile: Shortened */}
      <p className="hidden lg:block text-fg-secondary mb-4 max-w-2xl">
        Wallets are how you get paid on OrangeCat. Add one to switch on your Lightning address, and
        create separate wallets when you want to track a specific need — rent, food, medical costs,
        or a one‑time savings goal.
      </p>
      <p className="lg:hidden text-sm text-fg-secondary mb-3">
        Add a wallet to start receiving Bitcoin
      </p>

      {/* The "About Bitcoin Wallets" banner that used to sit here repeated the
          description above it and the sidebar explainer beside it — three
          explainers before the first control. Removed; the two that remain do
          different jobs (framing, then field-level guidance). */}
    </div>
  );
}
