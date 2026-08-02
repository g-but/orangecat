/**
 * Browser client for the owner-side /receive surface.
 * Settlement polling reuses the tips status endpoint — a receive request IS
 * the tips engine pointed at yourself (same intent, same bearer token).
 */

import { API_ROUTES } from '@/config/api-routes';

export { fetchTipStatus as fetchReceiveStatus } from '@/services/tips/tip-client';

export interface ReceiveRequest {
  intentId: string;
  statusToken: string;
  qrData: string;
  methodLabel: string;
  amountBtc: number;
  expiresInSeconds: number | null;
  paymentMethod: 'nwc' | 'lightning_address' | 'onchain';
}

export interface OwnerReceiveOverview {
  username: string | null;
  lightningAddress: string | null;
  rail: 'nwc' | 'lightning_address' | 'onchain' | null;
  lightningAddressActive: boolean;
}

export interface ReceiveWalletOption {
  id: string;
  label: string;
  wallet_type: string | null;
  is_primary: boolean;
}

async function readJson(
  res: Response
): Promise<{ success?: boolean; data?: unknown; error?: unknown }> {
  return (await res.json().catch(() => null)) ?? {};
}

function errorMessage(json: { error?: unknown }, fallback: string): string {
  const err = json.error;
  return (typeof err === 'string' ? err : (err as { message?: string })?.message) || fallback;
}

/** Can I be paid right now, and what is my @orangecat.ch address? */
export async function fetchReceiveOverview(): Promise<OwnerReceiveOverview> {
  const res = await fetch(API_ROUTES.WALLETS.RECEIVE_STATUS);
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not load your receiving setup.'));
  }
  return json.data as OwnerReceiveOverview;
}

/** The owner's active wallets, for the receive-with switcher. */
export async function fetchReceiveWallets(profileId: string): Promise<ReceiveWalletOption[]> {
  const res = await fetch(`${API_ROUTES.WALLETS.BASE}?profile_id=${encodeURIComponent(profileId)}`);
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not load your wallets.'));
  }
  const rows = (json.data as Array<Record<string, unknown>>) ?? [];
  return rows.map(w => ({
    id: String(w.id),
    label: String(w.label ?? 'Wallet'),
    wallet_type: (w.wallet_type as string | null) ?? null,
    is_primary: !!w.is_primary,
  }));
}

/** Mint an exact-amount payment request against my own wallet. */
export async function createReceiveRequest(
  amountBtc: number,
  walletId?: string
): Promise<ReceiveRequest> {
  const res = await fetch(API_ROUTES.RECEIVE.REQUEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_btc: amountBtc, ...(walletId ? { wallet_id: walletId } : {}) }),
  });
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not create a payment request.'));
  }
  return json.data as ReceiveRequest;
}
