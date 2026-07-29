'use client';

/**
 * Lightning Address Card — surfaces the user's `<username>@orangecat.ch`
 * Lightning address (LUD-16, served by /.well-known/lnurlp/<username>).
 *
 * The address is NON-CUSTODIAL: it mints invoices from the user's OWN
 * Lightning-capable wallet (NWC or Lightning address), so it only works once
 * such a wallet is connected. This card is honest about that — it shows the
 * address as active only when a Lightning-capable wallet exists, and otherwise
 * explains exactly how to activate it.
 */

import { useState } from 'react';
import { Zap, Copy, Check } from 'lucide-react';
import { APP_DOMAIN } from '@/config/brand';
import type { Wallet } from '@/types/wallet';

interface LightningAddressCardProps {
  username: string | null | undefined;
  wallets: Wallet[];
}

/**
 * Mirrors the server-side wallet resolution (NWC > Lightning address): the
 * proxy address can mint invoices iff an active wallet has either rail.
 * On-chain-only wallets cannot back a Lightning address.
 */
function hasLightningCapableWallet(wallets: Wallet[]): boolean {
  return wallets.some(
    w =>
      w.is_active &&
      (!!w.lightning_address ||
        !!(w as Wallet & { nwc_connection_uri?: string | null }).nwc_connection_uri)
  );
}

export function LightningAddressCard({ username, wallets }: LightningAddressCardProps) {
  const [copied, setCopied] = useState(false);

  if (!username) {
    return null;
  }

  const address = `${username}@${APP_DOMAIN}`;
  const active = hasLightningCapableWallet(wallets);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — nothing to do.
    }
  };

  return (
    <div className="bg-surface-base rounded-lg border border-default p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-surface-raised p-2">
          <Zap className="h-5 w-5 text-bitcoinOrange" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-fg-primary">Your Lightning address</h3>
          {active ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <code className="truncate rounded bg-surface-raised px-2 py-1 font-mono text-sm text-fg-primary">
                  {address}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied' : 'Copy Lightning address'}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-default text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-status-positive" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-fg-secondary">
                Share it anywhere — payments arrive directly in your own wallet. OrangeCat never
                holds your funds.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-fg-secondary">
              <span className="font-mono">{address}</span> activates once you add a Lightning
              wallet below (a Lightning address or wallet connection). On-chain-only wallets
              can&apos;t receive Lightning payments.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
