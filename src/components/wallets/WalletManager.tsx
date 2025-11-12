'use client';

import { useState } from 'react';
import { Wallet, WalletFormData, WALLET_CATEGORIES, WalletCategory, validateAddressOrXpub } from '@/types/wallet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

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
}: WalletManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeWallets = wallets.filter((w) => w.is_active);
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
        {isOwner && canAddMore && !isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
            + Add Wallet
          </Button>
        )}
      </div>

      {/* Add new wallet form */}
      {isAdding && isOwner && (
        <WalletForm
          onSubmit={async (data) => {
            await onAdd?.(data);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Wallet list */}
      <div className="space-y-3">
        {activeWallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isOwner={isOwner}
            isEditing={editingId === wallet.id}
            onEdit={() => setEditingId(wallet.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={async (data) => {
              await onUpdate?.(wallet.id, data);
              setEditingId(null);
            }}
            onDelete={async () => {
              if (confirm('Delete this wallet? This cannot be undone.')) {
                await onDelete?.(wallet.id);
              }
            }}
            onRefresh={() => onRefresh?.(wallet.id)}
          />
        ))}
      </div>

      {activeWallets.length === 0 && !isAdding && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No wallets yet</p>
          {isOwner && (
            <Button onClick={() => setIsAdding(true)} variant="outline">
              Add Your First Wallet
            </Button>
          )}
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
}: {
  wallet: Wallet;
  isOwner: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: Partial<WalletFormData>) => Promise<void>;
  onDelete: () => Promise<void>;
  onRefresh: () => Promise<void>;
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
          goal_amount: wallet.goal_amount || undefined,
          goal_currency: wallet.goal_currency || undefined,
        }}
        onSubmit={onUpdate}
        onCancel={onCancelEdit}
        submitLabel="Save Changes"
      />
    );
  }

  const categoryInfo = WALLET_CATEGORIES[wallet.category];
  const progressPercent = wallet.goal_amount ? (wallet.balance_btc / wallet.goal_amount) * 100 : 0;

  return (
    <div className="border rounded-lg p-4 hover:border-orange-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{wallet.category_icon || categoryInfo.icon}</span>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {wallet.label}
              {wallet.is_primary && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Primary</span>
              )}
            </h4>
            {wallet.description && <p className="text-sm text-gray-600">{wallet.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{categoryInfo.label}</p>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button onClick={onEdit} variant="ghost" size="sm">
              Edit
            </Button>
            <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="bg-gray-50 rounded p-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Current Balance</span>
          {isOwner && wallet.balance_updated_at && (
            <Button onClick={onRefresh} variant="ghost" size="sm" className="text-xs">
              🔄 Refresh
            </Button>
          )}
        </div>
        <div className="text-2xl font-bold text-orange-600">{wallet.balance_btc.toFixed(8)} BTC</div>
        {wallet.balance_updated_at && (
          <div className="text-xs text-gray-500 mt-1">
            Updated {new Date(wallet.balance_updated_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Goal progress */}
      {wallet.goal_amount && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Goal</span>
            <span className="font-medium">
              {wallet.balance_btc.toFixed(4)} / {wallet.goal_amount} {wallet.goal_currency}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{progressPercent.toFixed(1)}% funded</div>
        </div>
      )}

      {/* Address (truncated) */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Bitcoin Address'}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(wallet.address_or_xpub);
              alert('Copied to clipboard!');
            }}
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            Copy
          </button>
        </div>
        <code className="text-xs text-gray-700 block mt-1 font-mono break-all">
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
}: {
  initialData?: Partial<WalletFormData>;
  onSubmit: (data: WalletFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [formData, setFormData] = useState<WalletFormData>({
    label: initialData?.label || '',
    description: initialData?.description || '',
    address_or_xpub: initialData?.address_or_xpub || '',
    category: initialData?.category || 'general',
    category_icon: initialData?.category_icon,
    goal_amount: initialData?.goal_amount,
    goal_currency: initialData?.goal_currency || 'USD',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.label.trim()) {
      setError('Wallet label is required');
      return;
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
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-4">{submitLabel}</h4>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">{error}</div>
      )}

      {/* Category selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Category</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(WALLET_CATEGORIES) as WalletCategory[]).map((cat) => {
            const catInfo = WALLET_CATEGORIES[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat, category_icon: catInfo.icon })}
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
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Monthly Rent, Groceries, Medical Fund"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Description (optional)</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Explain how these funds will be used..."
          rows={2}
        />
      </div>

      {/* Address or xpub */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Bitcoin Address or xpub *</label>
        <Input
          value={formData.address_or_xpub}
          onChange={(e) => setFormData({ ...formData, address_or_xpub: e.target.value })}
          placeholder="bc1q... or zpub..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Use a single address or extended public key (xpub/ypub/zpub) to track all addresses
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
            onChange={(e) => setFormData({ ...formData, goal_amount: parseFloat(e.target.value) || undefined })}
            placeholder="1000"
            className="flex-1"
          />
          <select
            value={formData.goal_currency}
            onChange={(e) => setFormData({ ...formData, goal_currency: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BTC">BTC</option>
            <option value="SATS">SATS</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
