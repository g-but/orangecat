/**
 * WALLET MANAGER TYPES
 */

import type { Wallet, WalletFormData } from '@/types/wallet';
import type { WalletFieldType } from '@/lib/wallet-guidance';

export interface WalletManagerProps {
  wallets: Wallet[];
  entityType: 'profile' | 'project';
  entityId: string;
  onAdd?: (wallet: WalletFormData) => Promise<void>;
  onUpdate?: (walletId: string, data: Partial<WalletFormData>) => Promise<void>;
  onDelete?: (walletId: string) => Promise<void>;
  onRefresh?: (walletId: string) => Promise<void>;
  maxWallets?: number;
  isOwner?: boolean;
  onFieldFocus?: (field: WalletFieldType) => void;
}

export interface WalletCardProps {
  wallet: Wallet;
  isOwner: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<WalletFormData>) => Promise<void>;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  onFieldFocus?: (field: WalletFieldType) => void;
}

export interface WalletFormProps {
  initialData?: Partial<WalletFormData>;
  onSubmit: (data: WalletFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  onFieldFocus?: (field: WalletFieldType) => void;
}

export interface WalletManagerState {
  isAdding: boolean;
  editingId: string | null;
  walletToDelete: Wallet | null;
  isDeleting: boolean;
}
