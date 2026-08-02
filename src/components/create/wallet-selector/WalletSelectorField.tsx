'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Wallet as WalletIcon, PenLine, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { detectWalletType, type Wallet } from '@/types/wallet';
import { WalletCard } from './WalletCard';
import { API_ROUTES } from '@/config/api-routes';

interface WalletSelectorFieldProps {
  formData: Record<string, unknown>;
  onFieldChange: (field: string, value: unknown) => void;
  disabled?: boolean;
}

type Mode = 'select' | 'manual';

export function WalletSelectorField({
  formData,
  onFieldChange,
  disabled = false,
}: WalletSelectorFieldProps) {
  const { profile } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('select');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
    (formData._wallet_id as string) || null
  );

  const fetchWallets = useCallback(async () => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_ROUTES.WALLETS.BASE}?profile_id=${profile.id}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const data = Array.isArray(result.data) ? result.data : [];
        setWallets(data);
        // If no wallets, default to manual mode
        if (data.length === 0) {
          setMode('manual');
        }
      } else {
        setFetchError('Could not load wallets');
        setMode('manual');
      }
    } catch {
      setFetchError('Could not load wallets');
      setMode('manual');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Pre-select the user's primary wallet once loaded so an existing address is
  // tied to the entity by default (they can switch or enter another). Without
  // this, a user who has a wallet but never clicks a card creates an entity with
  // no explicit link — and may not realise their address could be attached.
  const didPreselect = useRef(false);
  useEffect(() => {
    if (didPreselect.current || wallets.length === 0) {
      return;
    }
    didPreselect.current = true;

    // Honour an existing selection (edit mode) instead of overriding it.
    if (formData._wallet_id) {
      setSelectedWalletId(formData._wallet_id as string);
      return;
    }

    const primary = wallets.find(w => w.is_primary) ?? wallets[0];
    setSelectedWalletId(primary.id);
    onFieldChange('bitcoin_address', primary.address_or_xpub);
    onFieldChange('lightning_address', primary.lightning_address || '');
    onFieldChange('_wallet_id', primary.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after wallets load
  }, [wallets]);

  // Reuse warning: attaching a wallet that already collects for other pages
  // makes those pages publicly linkable on-chain. Warn at the moment of
  // attachment — including the silent auto-preselect above — so reuse is a
  // choice, not an accident. Best-effort: a failed lookup shows no warning.
  const [reuseInfo, setReuseInfo] = useState<{ count: number; isXpubWallet: boolean } | null>(
    null
  );
  useEffect(() => {
    if (!selectedWalletId) {
      setReuseInfo(null);
      return;
    }
    const wallet = wallets.find(w => w.id === selectedWalletId);
    const isXpubWallet = wallet?.address_or_xpub
      ? detectWalletType(wallet.address_or_xpub) === 'xpub'
      : false;
    let cancelled = false;
    fetch(`${API_ROUTES.ENTITY_WALLETS}?wallet_id=${selectedWalletId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(result => {
        if (cancelled || !result) {return;}
        const rows: Array<{ entity_id: string }> = Array.isArray(result.data) ? result.data : [];
        // In edit mode the entity's own existing link must not count as reuse.
        const currentEntityId = formData.id as string | undefined;
        const count = rows.filter(r => r.entity_id !== currentEntityId).length;
        setReuseInfo({ count, isXpubWallet });
      })
      .catch(() => {
        if (!cancelled) {setReuseInfo(null);}
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formData.id is stable per form
  }, [selectedWalletId, wallets]);

  const handleSelectWallet = (wallet: Wallet) => {
    setSelectedWalletId(wallet.id);
    onFieldChange('bitcoin_address', wallet.address_or_xpub);
    onFieldChange('lightning_address', wallet.lightning_address || '');
    onFieldChange('_wallet_id', wallet.id);
  };

  const handleSwitchToManual = () => {
    setMode('manual');
    setSelectedWalletId(null);
    onFieldChange('_wallet_id', undefined);
  };

  const handleSwitchToSelect = () => {
    setMode('select');
    // Clear manual entries if switching back
    if (wallets.length > 0) {
      onFieldChange('bitcoin_address', '');
      onFieldChange('lightning_address', '');
      onFieldChange('_wallet_id', undefined);
      setSelectedWalletId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-fg-secondary">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading wallets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle - only show if wallets exist */}
      {wallets.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSwitchToSelect}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              mode === 'select'
                ? 'border-fg-primary bg-surface-raised/40 text-fg-primary font-medium'
                : 'border-default text-fg-secondary hover:border-strong dark:hover:border-default'
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            Select from wallets
          </button>
          <button
            type="button"
            onClick={handleSwitchToManual}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              mode === 'manual'
                ? 'border-fg-primary bg-surface-raised/40 text-fg-primary font-medium'
                : 'border-default text-fg-secondary hover:border-strong dark:hover:border-default'
            }`}
          >
            <PenLine className="w-4 h-4" />
            Enter manually
          </button>
        </div>
      )}

      {/* Select mode */}
      {mode === 'select' && wallets.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {wallets.map(wallet => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                selected={selectedWalletId === wallet.id}
                onSelect={() => handleSelectWallet(wallet)}
                disabled={disabled}
              />
            ))}
          </div>
          {reuseInfo && reuseInfo.count > 0 && !reuseInfo.isXpubWallet && (
            <p className="rounded-lg border border-status-warning/40 bg-status-warning-subtle px-3 py-2 text-xs text-fg-secondary">
              This wallet already receives funds for {reuseInfo.count} other{' '}
              {reuseInfo.count === 1 ? 'page' : 'pages'}. On-chain payments to the same address
              are publicly linkable — anyone can connect these pages on the blockchain. For
              separate identities, pick a different wallet, or use an xpub wallet to get a fresh
              address per payment.
            </p>
          )}
          {reuseInfo && reuseInfo.count > 0 && reuseInfo.isXpubWallet && (
            <p className="text-xs text-fg-secondary">
              This wallet collects for {reuseInfo.count} other{' '}
              {reuseInfo.count === 1 ? 'page' : 'pages'}, but it derives a fresh address per
              payment — payments aren&apos;t linkable on-chain.
            </p>
          )}
        </>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Bitcoin Address</label>
            <Input
              value={(formData.bitcoin_address as string) || ''}
              onChange={e => onFieldChange('bitcoin_address', e.target.value)}
              placeholder="bc1q... or 1..."
              disabled={disabled}
            />
            <p className="text-xs text-fg-secondary mt-1">
              Your Bitcoin address for receiving funding
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lightning Address</label>
            <Input
              value={(formData.lightning_address as string) || ''}
              onChange={e => onFieldChange('lightning_address', e.target.value)}
              placeholder="you@lightning.address"
              disabled={disabled}
            />
            <p className="text-xs text-fg-secondary mt-1">
              Optional: Lightning Network address for instant payments
            </p>
          </div>
        </div>
      )}

      {fetchError && wallets.length === 0 && (
        <p className="text-xs text-fg-secondary">{fetchError}</p>
      )}
    </div>
  );
}
