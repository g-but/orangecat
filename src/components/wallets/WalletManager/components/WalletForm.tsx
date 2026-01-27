/**
 * WALLET FORM COMPONENT
 * Form for adding or editing wallet details
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  WalletFormData,
  WALLET_CATEGORIES,
  WalletCategory,
  validateAddressOrXpub,
} from '@/types/wallet';
import type { WalletFormProps } from '../types';

export function WalletForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Add Wallet',
  onFieldFocus,
}: WalletFormProps) {
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
