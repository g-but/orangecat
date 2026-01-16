'use client';
import { logger } from '@/utils/logger';

import { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  WalletFormData,
  WALLET_CATEGORIES,
  WalletCategory,
  validateAddressOrXpub,
} from '@/types/wallet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { WalletFieldType } from '@/lib/wallet-guidance';
import { toast } from 'sonner';
import {
  Pencil,
  Trash2,
  Star,
  RefreshCw,
  Copy,
  ExternalLink,
  Wallet as WalletIcon,
} from 'lucide-react';

interface WalletManagerProps {
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

export function WalletManager({
  wallets,
  entityType,
  entityId,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  maxWallets = 10,
  isOwner = false,
  onFieldFocus,
}: WalletManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validate required props after hooks
  if (!entityType) {
    logger.error('WalletManager: entityType is required');
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
        Error: Entity type not configured properly
      </div>
    );
  }

  if (!entityId) {
    logger.error('WalletManager: entityId is required');
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
        Error: Entity ID not configured properly
      </div>
    );
  }

  const activeWallets = wallets.filter(w => w.is_active);
  const canAddMore = activeWallets.length < maxWallets;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bitcoin Wallets</h3>
          <p className="text-sm text-gray-600">
            {activeWallets.length} of {maxWallets} wallets
          </p>
        </div>
        {isOwner && canAddMore && !isAdding && activeWallets.length > 0 && (
          <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
            + Add Wallet
          </Button>
        )}
      </div>

      {/* Add new wallet form */}
      {isAdding && isOwner && (
        <WalletForm
          onFieldFocus={onFieldFocus}
          onSubmit={async data => {
            await onAdd?.(data);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Wallet list */}
      <div className="space-y-4 sm:space-y-3">
        {activeWallets.map(wallet => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isOwner={isOwner}
            isEditing={editingId === wallet.id}
            onEdit={() => setEditingId(wallet.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={async data => {
              await onUpdate?.(wallet.id, data);
              setEditingId(null);
            }}
            onDelete={() => setWalletToDelete(wallet)}
            onRefresh={async () => {
              if (onRefresh) {
                await onRefresh(wallet.id);
              }
            }}
            onFieldFocus={onFieldFocus}
          />
        ))}
      </div>

      {activeWallets.length === 0 && !isAdding && (
        <>
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
            <WalletIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets yet</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Add your first Bitcoin wallet to start receiving support.
            </p>
            {isOwner && (
              <Button onClick={() => setIsAdding(true)} variant="outline">
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
      )}

      {/* Delete Confirmation Dialog */}
      {walletToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Wallet</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{walletToDelete.label}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setWalletToDelete(null)}
                variant="outline"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDelete?.(walletToDelete.id);
                    setWalletToDelete(null);
                  } catch {
                    // Error is already handled by parent component
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                variant="danger"
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wallet card component
function WalletCard({
  wallet,
  isOwner,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onRefresh,
  onFieldFocus,
}: {
  wallet: Wallet;
  isOwner: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<WalletFormData>) => Promise<void>;
  onDelete: () => void;
  onRefresh: () => Promise<void>;
  onFieldFocus?: (field: WalletFieldType) => void;
}) {
  if (isEditing && isOwner) {
    return (
      <WalletForm
        initialData={{
          label: wallet.label,
          description: wallet.description || '',
          address_or_xpub: wallet.address_or_xpub,
          category: wallet.category,
          category_icon: wallet.category_icon,
          behavior_type: wallet.behavior_type || 'general',
          goal_amount: wallet.goal_amount || undefined,
          goal_currency: wallet.goal_currency || undefined,
          is_primary: wallet.is_primary,
        }}
        onFieldFocus={onFieldFocus}
        onSubmit={onUpdate}
        onCancel={onCancelEdit}
        submitLabel="Save Changes"
      />
    );
  }

  const categoryInfo = WALLET_CATEGORIES[wallet.category];
  const progressPercent = wallet.goal_amount ? (wallet.balance_btc / wallet.goal_amount) * 100 : 0;

  return (
    <div className="border rounded-lg p-4 sm:p-6 hover:border-orange-300 hover:shadow-md transition-all bg-white">
      {/* Header with icon, title, and action buttons */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-3xl sm:text-4xl flex-shrink-0">
            {wallet.category_icon || categoryInfo.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-base sm:text-lg truncate">{wallet.label}</h4>
              {wallet.is_primary && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-orange-700" />
                  Primary
                </span>
              )}
            </div>
            {wallet.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{wallet.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{categoryInfo.label}</p>
          </div>
        </div>

        {/* Action buttons - icon only on mobile, with tooltips */}
        {isOwner && (
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {!wallet.is_primary && (
              <button
                onClick={async () => {
                  try {
                    await onUpdate({ is_primary: true });
                    toast.success(`${wallet.label} is now your primary wallet`);
                  } catch {
                    toast.error('Failed to set primary wallet');
                  }
                }}
                className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-colors"
                title="Set as primary wallet"
                aria-label="Set as primary wallet"
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              title="Edit wallet"
              aria-label="Edit wallet"
            >
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
              title="Delete wallet"
              aria-label="Delete wallet"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Balance</span>
          {isOwner && wallet.balance_updated_at && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
              title="Refresh balance"
              aria-label="Refresh balance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-orange-600">
          {wallet.balance_btc.toFixed(8)} BTC
        </div>
        {wallet.balance_updated_at && (
          <div className="text-xs text-gray-500 mt-2">
            Updated {new Date(wallet.balance_updated_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Goal progress */}
      {wallet.goal_amount && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Goal</span>
            <span className="font-semibold text-gray-900">
              {wallet.balance_btc.toFixed(4)} / {wallet.goal_amount} {wallet.goal_currency}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
            <div
              className="bg-orange-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{progressPercent.toFixed(1)}% funded</div>
        </div>
      )}

      {/* Address (truncated) */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">
            {wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Bitcoin Address'}
          </span>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(wallet.address_or_xpub);
                toast.success('Copied to clipboard!');
              } catch {
                toast.error('Failed to copy to clipboard');
              }
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1"
            title="Copy address"
            aria-label="Copy address"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-xs hidden sm:inline">Copy</span>
          </button>
        </div>
        <code className="text-xs text-gray-700 block font-mono break-all bg-gray-50 p-2 rounded border">
          {wallet.address_or_xpub.slice(0, 20)}...{wallet.address_or_xpub.slice(-10)}
        </code>
      </div>
    </div>
  );
}

// Wallet form component
function WalletForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Wallet',
  onFieldFocus,
}: {
  initialData?: Partial<WalletFormData>;
  onSubmit: (data: WalletFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  onFieldFocus?: (field: WalletFieldType) => void;
}) {
  const [formData, setFormData] = useState<WalletFormData>({
    label: initialData?.label || '',
    description: initialData?.description || '',
    address_or_xpub: initialData?.address_or_xpub || '',
    category: initialData?.category || 'general',
    category_icon: initialData?.category_icon,
    behavior_type: initialData?.behavior_type || 'general',
    goal_amount: initialData?.goal_amount,
    goal_currency: initialData?.goal_currency || 'USD',
    is_primary: initialData?.is_primary || false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // Comprehensive validation
    if (!formData.label?.trim()) {
      setError('Wallet name is required');
      return;
    }

    if (!formData.address_or_xpub?.trim()) {
      setError('Wallet address is required');
      return;
    }

    if (!formData.category) {
      setError('Wallet category is required');
      return;
    }

    // Ensure behavior_type is set
    if (!formData.behavior_type) {
      setFormData(prev => ({ ...prev, behavior_type: 'general' }));
    }

    const validation = validateAddressOrXpub(formData.address_or_xpub);
    if (!validation.valid) {
      setError(validation.error || 'Invalid address or xpub');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wallet');
      setIsSubmitting(false);
    }
  };

  const selectedCategory = WALLET_CATEGORIES[formData.category];

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-4">{submitLabel}</h4>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Category selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(WALLET_CATEGORIES) as WalletCategory[]).map(cat => {
            const catInfo = WALLET_CATEGORIES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, category: cat, category_icon: catInfo.icon });
                  onFieldFocus?.('category');
                }}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  formData.category === cat
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-1">{catInfo.icon}</div>
                <div className="text-sm font-medium">{catInfo.label}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">{selectedCategory.description}</p>
      </div>

      {/* Label */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Wallet Name *</label>
        <Input
          value={formData.label}
          onChange={e => setFormData({ ...formData, label: e.target.value })}
          onFocus={() => onFieldFocus?.('label')}
          placeholder="e.g., Monthly Rent, Groceries, Medical Fund"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Description (optional)</label>
        <Textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          onFocus={() => onFieldFocus?.('description')}
          placeholder="Explain how these funds will be used..."
          rows={2}
        />
      </div>

      {/* Address or xpub */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Bitcoin Address or Extended Public Key *
          <span className="ml-2 text-xs font-normal text-gray-500">
            (xpub/ypub/zpub recommended)
          </span>
        </label>
        <Input
          value={formData.address_or_xpub}
          onChange={e => setFormData({ ...formData, address_or_xpub: e.target.value })}
          onFocus={() => onFieldFocus?.('addressOrXpub')}
          placeholder="zpub... (recommended) or bc1q..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Extended public keys (xpub/ypub/zpub) automatically track all addresses and transactions.
          Single addresses work but only track that one address.
        </p>
      </div>

      {/* Goal (optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Funding Goal (optional)</label>
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            value={formData.goal_amount || ''}
            onChange={e =>
              setFormData({ ...formData, goal_amount: parseFloat(e.target.value) || undefined })
            }
            onFocus={() => onFieldFocus?.('goalAmount')}
            placeholder="1000"
            className="flex-1"
          />
          <select
            value={formData.goal_currency}
            onChange={e => setFormData({ ...formData, goal_currency: e.target.value })}
            onFocus={() => onFieldFocus?.('goalCurrency')}
            className="border rounded px-3 py-2"
          >
            <option value="CHF">CHF</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BTC">BTC</option>
            <option value="SATS">SATS</option>
          </select>
        </div>
      </div>

      {/* Primary wallet checkbox (only when editing) */}
      {initialData?.address_or_xpub && (
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_primary || false}
              onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium">Set as primary wallet</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            The primary wallet is displayed prominently on your profile. Only one wallet can be
            primary at a time.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
