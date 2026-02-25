'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet as WalletIcon, PenLine, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import type { Wallet } from '@/types/wallet';
import { WalletCard } from './WalletCard';

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

      const response = await fetch(`/api/wallets?profile_id=${profile.id}`, {
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
      <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
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
                ? 'border-tiffany bg-tiffany/5 text-tiffany-dark font-medium'
                : 'border-gray-200 text-muted-foreground hover:border-gray-300'
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
                ? 'border-tiffany bg-tiffany/5 text-tiffany-dark font-medium'
                : 'border-gray-200 text-muted-foreground hover:border-gray-300'
            }`}
          >
            <PenLine className="w-4 h-4" />
            Enter manually
          </button>
        </div>
      )}

      {/* Select mode */}
      {mode === 'select' && wallets.length > 0 && (
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
            <p className="text-xs text-muted-foreground mt-1">
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
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Lightning Network address for instant payments
            </p>
          </div>
        </div>
      )}

      {fetchError && wallets.length === 0 && (
        <p className="text-xs text-muted-foreground">{fetchError}</p>
      )}
    </div>
  );
}
