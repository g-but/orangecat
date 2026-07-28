/**
 * WALLET FORM COMPONENT
 * Add or edit a way to get paid. Optimized for a non-technical person: the ONLY
 * thing required is one payment handle, and the approachable option (a Lightning
 * address — works like an email) leads. On-chain / xpub and Nostr Wallet Connect
 * are demoted behind an "advanced" disclosure, and naming/categorizing is
 * optional (collapsed), so the happy path is "paste your Lightning address → Save".
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
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
  submitLabel = 'Save',
  onFieldFocus,
}: WalletFormProps) {
  const [formData, setFormData] = useState<WalletFormData>({
    label: initialData?.label || '',
    description: initialData?.description || '',
    address_or_xpub: initialData?.address_or_xpub || '',
    lightning_address: initialData?.lightning_address || '',
    nwc_connection_uri: initialData?.nwc_connection_uri || '',
    category: initialData?.category || 'general',
    category_icon: initialData?.category_icon,
    behavior_type: initialData?.behavior_type || 'general',
    goal_amount: initialData?.goal_amount,
    goal_currency: initialData?.goal_currency || 'USD',
    is_primary: initialData?.is_primary || false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The advanced (technical) rails — reveal only if the user already has one
  // saved (editing) or explicitly asks for them.
  const [showAdvanced, setShowAdvanced] = useState(
    !!initialData?.address_or_xpub || !!initialData?.nwc_connection_uri
  );
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // The one hard requirement: a way to actually get paid.
    if (
      !formData.address_or_xpub?.trim() &&
      !formData.lightning_address?.trim() &&
      !formData.nwc_connection_uri?.trim()
    ) {
      setError('Add a Lightning address (or an on-chain address / NWC) so people can pay you.');
      return;
    }

    if (
      formData.nwc_connection_uri?.trim() &&
      !formData.nwc_connection_uri.trim().startsWith('nostr+walletconnect://')
    ) {
      setError('NWC connection must start with nostr+walletconnect://');
      return;
    }

    if (formData.address_or_xpub?.trim()) {
      const validation = validateAddressOrXpub(formData.address_or_xpub);
      if (!validation.valid) {
        setError(validation.error || 'Invalid address or xpub');
        return;
      }
    }

    // Name and category are optional — default them so nothing blocks saving.
    const payload: WalletFormData = {
      ...formData,
      label: formData.label?.trim() || 'My wallet',
      category: formData.category || 'general',
      behavior_type: formData.behavior_type || 'general',
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wallet');
      setIsSubmitting(false);
    }
  };

  const selectedCategory = WALLET_CATEGORIES[formData.category];

  return (
    <div className="rounded-lg border border-default bg-surface-raised p-4">
      <h4 className="mb-1 font-semibold text-fg-primary">
        {submitLabel === 'Save' ? 'Get paid in Bitcoin' : submitLabel}
      </h4>
      <p className="mb-4 text-sm text-fg-secondary">
        Add where you want the money to land. You can change this anytime.
      </p>

      {error && <div className="oc-error-surface mb-4 px-4 py-2">{error}</div>}

      {/* Primary path: Lightning address (email-like, approachable) */}
      <div className="mb-4">
        <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-fg-primary">
          <Zap className="h-4 w-4 text-bitcoinOrange" />
          Your Lightning address
        </label>
        <Input
          value={formData.lightning_address || ''}
          onChange={e => setFormData({ ...formData, lightning_address: e.target.value })}
          onFocus={() => onFieldFocus?.('lightningAddress')}
          placeholder="you@primal.net"
          inputMode="email"
        />
        <p className="mt-1.5 text-xs text-fg-secondary">
          It works like an email address for Bitcoin — instant and near-zero fee.{' '}
          <Link href="/wallets" className="text-accent-warm underline hover:text-accent-warm-hover">
            Don&apos;t have one? Get set up in a minute →
          </Link>
        </p>
      </div>

      {/* Advanced rails: on-chain address / xpub + Nostr Wallet Connect */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="mb-2 flex items-center gap-1 text-xs font-medium text-fg-secondary hover:text-fg-primary"
      >
        {showAdvanced ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Other ways to get paid (advanced)
      </button>
      {showAdvanced && (
        <div className="mb-4 space-y-4 border-l-2 border-subtle pl-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">
              On-chain Bitcoin address or extended key
            </label>
            <Input
              value={formData.address_or_xpub ?? ''}
              onChange={e => setFormData({ ...formData, address_or_xpub: e.target.value })}
              onFocus={() => onFieldFocus?.('addressOrXpub')}
              placeholder="bc1q…  or  zpub…"
            />
            <p className="mt-1.5 text-xs text-fg-secondary">
              Slower (~10 min to confirm), better for larger amounts. An extended key
              (xpub/ypub/zpub) auto-tracks new addresses; a single address also works.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">
              Nostr Wallet Connect
            </label>
            <Input
              type="password"
              value={formData.nwc_connection_uri || ''}
              onChange={e => setFormData({ ...formData, nwc_connection_uri: e.target.value })}
              onFocus={() => onFieldFocus?.('addressOrXpub')}
              placeholder="nostr+walletconnect://…"
              autoComplete="off"
            />
            <p className="mt-1.5 text-xs text-fg-secondary">
              Connect a wallet (Alby, Coinos, …) so payments settle automatically — the best
              experience if you have it. The connection secret is stored securely and never shown
              again.
            </p>
          </div>
        </div>
      )}

      {/* Optional: name, description, category, goal */}
      <button
        type="button"
        onClick={() => setShowDetails(v => !v)}
        className="mb-2 flex items-center gap-1 text-xs font-medium text-fg-secondary hover:text-fg-primary"
      >
        {showDetails ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Name &amp; details (optional)
      </button>
      {showDetails && (
        <div className="mb-4 space-y-4 border-l-2 border-subtle pl-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">Wallet name</label>
            <Input
              value={formData.label}
              onChange={e => setFormData({ ...formData, label: e.target.value })}
              onFocus={() => onFieldFocus?.('label')}
              placeholder="e.g., Tips, Main wallet"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">Description</label>
            <Textarea
              value={formData.description ?? ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              onFocus={() => onFieldFocus?.('description')}
              placeholder="What this wallet is for…"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">Category</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      formData.category === cat
                        ? 'border-bitcoinOrange bg-bitcoinOrange/5'
                        : 'border-strong hover:border-strong'
                    }`}
                  >
                    <div className="mb-1 text-2xl">{catInfo.icon}</div>
                    <div className="text-sm font-medium text-fg-primary">{catInfo.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-secondary">{selectedCategory.description}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg-primary">Funding goal</label>
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
                value={formData.goal_currency ?? ''}
                onChange={e => setFormData({ ...formData, goal_currency: e.target.value })}
                onFocus={() => onFieldFocus?.('goalCurrency')}
                className="rounded border px-3 py-2"
              >
                <option value="CHF">CHF</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
          </div>

          {/* Primary wallet toggle (only meaningful when more than one exists) */}
          {initialData?.address_or_xpub && (
            <div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_primary || false}
                  onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="h-4 w-4 rounded border-strong text-bitcoinOrange focus:ring-ring"
                />
                <span className="text-sm font-medium">Show this one on my profile</span>
              </label>
              <p className="ml-6 mt-1 text-xs text-fg-secondary">
                The primary wallet is the one shown prominently on your profile.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
