/**
 * DELETE CONFIRM DIALOG COMPONENT
 * Confirmation modal for wallet deletion
 */

import { Button } from '@/components/ui/Button';
import type { Wallet } from '@/types/wallet';

interface DeleteConfirmDialogProps {
  wallet: Wallet;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  wallet,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Wallet</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete "{wallet.label}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button onClick={onCancel} variant="outline" disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
