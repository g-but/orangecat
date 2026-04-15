/**
 * DELETE CONFIRM DIALOG COMPONENT
 * Confirmation modal for wallet deletion
 */

'use client';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
    <ConfirmDialog
      isOpen
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Delete Wallet"
      description={`Are you sure you want to delete "${wallet.label}"? This action cannot be undone.`}
      confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
      isLoading={isDeleting}
    />
  );
}
