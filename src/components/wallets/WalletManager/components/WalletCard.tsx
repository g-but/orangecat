/**
 * WALLET CARD COMPONENT
 * Displays a single wallet with balance, actions, and address
 */

import { Pencil, Trash2, Star, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { WALLET_CATEGORIES } from '@/types/wallet';
import { WalletForm } from './WalletForm';
import type { WalletCardProps } from '../types';
import { truncateAddress } from '@/utils/string';
import { displayBTC } from '@/services/currency/formatting';

export function WalletCard({
  wallet,
  isOwner,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onRefresh,
  onFieldFocus,
  isConnectionUnusable = false,
}: WalletCardProps) {
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

  // Balance is read from the blockchain against `address_or_xpub`. A Lightning
  // or connection-only wallet has no such address, so its stored balance is
  // structurally always 0 — rendering "Current Balance 0 BTC" there states a
  // fact we never measured. Show the balance only where it is actually tracked.
  const tracksOnChainBalance = !!wallet.address_or_xpub;

  // The public receive handle to show + copy. A wallet may have an on-chain
  // address, a Lightning address, or only a wallet connection (NWC — no public
  // handle). Handle all three so a Lightning/NWC-only wallet renders instead of
  // crashing the page on a null address.
  const receiveHandle = wallet.address_or_xpub
    ? {
        label: wallet.wallet_type === 'xpub' ? 'Extended Public Key' : 'Bitcoin Address',
        display: truncateAddress(wallet.address_or_xpub, 20, 10),
        copyValue: wallet.address_or_xpub,
      }
    : wallet.lightning_address
      ? {
          label: 'Lightning Address',
          display: wallet.lightning_address,
          copyValue: wallet.lightning_address,
        }
      : {
          label: 'Connected wallet',
          display: isConnectionUnusable
            ? 'Connection unavailable — payments skip this wallet'
            : 'Receives Lightning payments via the connected wallet',
          copyValue: null as string | null,
        };

  const handleCopy = async () => {
    if (!receiveHandle.copyValue) {
      return;
    }
    try {
      await navigator.clipboard.writeText(receiveHandle.copyValue);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSetPrimary = async () => {
    try {
      await onUpdate({ is_primary: true });
      toast.success(`${wallet.label} is now your primary wallet`);
    } catch {
      toast.error('Failed to set primary wallet');
    }
  };

  return (
    <div className="oc-surface oc-card-link p-4 sm:p-6">
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
                <span className="text-xs bg-bitcoinOrange/10 text-bitcoinOrange px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-fg-primary" />
                  Primary
                </span>
              )}
            </div>
            {wallet.description && (
              <p className="text-sm text-fg-secondary mt-1 line-clamp-2">{wallet.description}</p>
            )}
            <p className="text-xs text-fg-secondary mt-1">{categoryInfo.label}</p>
          </div>
        </div>

        {/* Action buttons - icon only on mobile, with tooltips */}
        {isOwner && (
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {!wallet.is_primary && (
              <button
                onClick={handleSetPrimary}
                className="p-2 rounded-lg hover:bg-bitcoinOrange/10 text-bitcoinOrange transition-colors min-h-11 min-w-11 flex items-center justify-center"
                title="Set as primary wallet"
                aria-label="Set as primary wallet"
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-surface-raised text-fg-secondary hover:text-fg-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
              title="Edit wallet"
              aria-label="Edit wallet"
            >
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-status-negative/10 text-status-negative hover:text-status-negative/80 transition-colors min-h-11 min-w-11 flex items-center justify-center"
              title="Delete wallet"
              aria-label="Delete wallet"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Balance — on-chain wallets only (see tracksOnChainBalance) */}
      {tracksOnChainBalance && (
        <div className="bg-surface-raised rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-fg-primary">Current Balance</span>
            {/* Refresh was previously gated on balance_updated_at, so a wallet
                that had never been checked offered no way to check it. */}
            {isOwner && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-md hover:bg-surface-overlay dark:hover:bg-surface-raised/50 text-fg-secondary hover:text-fg-primary transition-colors min-h-11 min-w-11 flex items-center justify-center"
                title="Refresh balance"
                aria-label="Refresh balance"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-bitcoinOrange">
            {displayBTC(wallet.balance_btc)}
          </div>
          <div className="text-xs text-fg-secondary mt-2">
            {wallet.balance_updated_at
              ? `Updated ${new Date(wallet.balance_updated_at).toLocaleString()}`
              : 'Not checked yet — refresh to read it from the blockchain'}
          </div>
        </div>
      )}

      {/* Goal progress — tracked from the on-chain balance, so same condition */}
      {tracksOnChainBalance && wallet.goal_amount && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-fg-secondary font-medium">Goal</span>
            <span className="font-semibold text-fg-primary">
              {displayBTC(wallet.balance_btc)} / {wallet.goal_amount} {wallet.goal_currency}
            </span>
          </div>
          <div className="w-full bg-surface-raised rounded-full h-2.5 mb-1">
            <div
              className="bg-bitcoinOrange h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-fg-secondary">{progressPercent.toFixed(1)}% funded</div>
        </div>
      )}

      {/* Receive handle (address / lightning / connection) */}
      <div className="pt-4 border-t border-default">
        {isConnectionUnusable && (
          <p className="mb-3 flex items-start gap-1.5 rounded-md bg-surface-raised p-2 text-xs text-status-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>
              This connection can’t be used by OrangeCat, so incoming payments skip this wallet.
              Edit it and paste the connection string again.
            </span>
          </p>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-fg-secondary">{receiveHandle.label}</span>
          {receiveHandle.copyValue && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-surface-raised text-fg-secondary hover:text-bitcoinOrange transition-colors flex items-center gap-1 min-h-11"
              title="Copy"
              aria-label="Copy"
            >
              <Copy className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Copy</span>
            </button>
          )}
        </div>
        <code className="text-xs text-fg-primary block font-mono break-all bg-surface-raised p-2 rounded border dark:border-default">
          {receiveHandle.display}
        </code>
      </div>
    </div>
  );
}
