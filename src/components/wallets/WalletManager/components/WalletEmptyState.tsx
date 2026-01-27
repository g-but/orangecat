/**
 * WALLET EMPTY STATE COMPONENT
 * Shown when no wallets exist
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Wallet as WalletIcon, ExternalLink } from 'lucide-react';

interface WalletEmptyStateProps {
  isOwner: boolean;
  onAddClick: () => void;
}

export function WalletEmptyState({ isOwner, onAddClick }: WalletEmptyStateProps) {
  return (
    <>
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
        <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets yet</h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          Add your first Bitcoin wallet to start receiving support.
        </p>
        {isOwner && (
          <Button onClick={onAddClick} variant="outline">
            Add Your First Wallet
          </Button>
        )}
      </div>
      {isOwner && (
        <div className="text-center">
          <Link
            href="/wallets"
            className="text-sm text-gray-600 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
          >
            I don't have a wallet yet
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );
}
