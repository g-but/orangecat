/**
 * WALLET HEADER COMPONENT
 * Title, wallet count, and add button
 */

import { Button } from '@/components/ui/Button';

interface WalletHeaderProps {
  activeCount: number;
  maxWallets: number;
  canAddMore: boolean;
  isOwner: boolean;
  isAdding: boolean;
  hasWallets: boolean;
  onAddClick: () => void;
}

export function WalletHeader({
  activeCount,
  maxWallets,
  canAddMore,
  isOwner,
  isAdding,
  hasWallets,
  onAddClick,
}: WalletHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Bitcoin Wallets</h3>
        <p className="text-sm text-gray-600">
          {activeCount} of {maxWallets} wallets
        </p>
      </div>
      {isOwner && canAddMore && !isAdding && hasWallets && (
        <Button onClick={onAddClick} variant="outline" size="sm">
          + Add Wallet
        </Button>
      )}
    </div>
  );
}
