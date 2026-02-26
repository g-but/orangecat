/**
 * useSellerPaymentMethods — Checks what payment methods a seller supports
 *
 * Used to show/disable the PaymentButton on entity pages.
 * Returns whether the seller has any wallet connected.
 */

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { DATABASE_TABLES } from '@/config/database-tables';

interface SellerPaymentInfo {
  hasWallet: boolean;
  hasNWC: boolean;
  hasLightningAddress: boolean;
  hasOnchain: boolean;
  loading: boolean;
}

export function useSellerPaymentMethods(sellerProfileId: string | null): SellerPaymentInfo {
  const [info, setInfo] = useState<SellerPaymentInfo>({
    hasWallet: false,
    hasNWC: false,
    hasLightningAddress: false,
    hasOnchain: false,
    loading: true,
  });

  useEffect(() => {
    if (!sellerProfileId) {
      setInfo(prev => ({ ...prev, loading: false }));
      return;
    }

    const supabase = createBrowserClient();

    async function check() {
      const { data: wallets } = await supabase
        .from(DATABASE_TABLES.WALLETS)
        .select('id, nwc_connection_uri, lightning_address, address_or_xpub, wallet_type')
        .eq('profile_id', sellerProfileId)
        .eq('is_active', true);

      if (!wallets || wallets.length === 0) {
        setInfo({
          hasWallet: false,
          hasNWC: false,
          hasLightningAddress: false,
          hasOnchain: false,
          loading: false,
        });
        return;
      }

      setInfo({
        hasWallet: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase dynamic table query
        hasNWC: wallets.some((w: any) => !!w.nwc_connection_uri),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hasLightningAddress: wallets.some((w: any) => !!w.lightning_address),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hasOnchain: wallets.some((w: any) => !!w.address_or_xpub),
        loading: false,
      });
    }

    check();
  }, [sellerProfileId]);

  return info;
}
