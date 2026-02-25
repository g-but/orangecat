'use client';

import { Check } from 'lucide-react';
import { WALLET_CATEGORIES, type Wallet } from '@/types/wallet';

interface WalletCardProps {
  wallet: Wallet;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function truncateAddress(address: string, chars = 8): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function WalletCard({ wallet, selected, onSelect, disabled }: WalletCardProps) {
  const categoryInfo = WALLET_CATEGORIES[wallet.category] || WALLET_CATEGORIES.general;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`relative w-full text-left p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-tiffany bg-tiffany/5 ring-1 ring-tiffany/20'
          : 'border-gray-200 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tiffany flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="text-lg">{categoryInfo.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{wallet.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
            {truncateAddress(wallet.address_or_xpub)}
          </div>
          {wallet.lightning_address && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {wallet.lightning_address}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
