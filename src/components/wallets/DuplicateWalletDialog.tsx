import { useState } from 'react';
import { AlertTriangle, Wallet, Plus, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { WalletFormData } from '@/types/wallet';

interface DuplicateWalletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletData: WalletFormData;
  existingWallets: Array<{
    id: string;
    label: string;
    category: string;
  }>;
  isLoading?: boolean;
}

export function DuplicateWalletDialog({
  isOpen,
  onClose,
  onConfirm,
  walletData,
  existingWallets,
  isLoading = false,
}: DuplicateWalletDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Duplicate Wallet Address</h3>
              <p className="text-sm text-gray-600">This address is already in use</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Current wallet info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">New wallet you're adding:</span>
              </div>
              <div className="text-sm text-blue-800">
                <div className="font-medium">{walletData.label}</div>
                <div className="text-xs opacity-75 truncate">{walletData.address_or_xpub}</div>
                <div className="text-xs opacity-75 capitalize">
                  Purpose: {walletData.category.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Existing wallets */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-gray-900">
                  This address is already used for:
                </span>
              </div>
              <div className="space-y-1">
                {existingWallets.map(wallet => (
                  <div
                    key={wallet.id}
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border"
                  >
                    <div className="font-medium">{wallet.label}</div>
                    <div className="text-xs opacity-75 capitalize">
                      {wallet.category.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning message */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">
                    Are you sure you want to add this wallet again?
                  </p>
                  <p>
                    This wallet address is already connected to your account. Consider creating a
                    separate wallet for this specific purpose to keep your finances better
                    organized.
                  </p>
                </div>
              </div>
            </div>

            {/* Don't show again checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Don't show this warning again</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline" disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? 'Adding...' : 'Add Anyway'}
          </Button>
        </div>
      </div>
    </div>
  );
}
