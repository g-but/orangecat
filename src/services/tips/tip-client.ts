/**
 * Browser client for the tipping endpoints. Type-only imports of the service
 * shapes (erased at compile — no server code pulled into the bundle).
 */

import { API_ROUTES } from '@/config/api-routes';
import type { TipInvoice, TipReceiveInfo, TipStatusResult } from '@/domain/tips/tip-service';

export type { TipInvoice, TipReceiveInfo, TipStatusResult } from '@/domain/tips/tip-service';

async function readJson(
  res: Response
): Promise<{ success?: boolean; data?: unknown; error?: unknown }> {
  return (await res.json().catch(() => null)) ?? {};
}

function errorMessage(json: { error?: unknown }, fallback: string): string {
  const err = json.error;
  return (typeof err === 'string' ? err : (err as { message?: string })?.message) || fallback;
}

export async function fetchTipReceiveInfo(username: string): Promise<TipReceiveInfo> {
  const res = await fetch(`${API_ROUTES.TIPS.RECEIVE_INFO}?username=${encodeURIComponent(username)}`);
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not load tip info.'));
  }
  return json.data as TipReceiveInfo;
}

export async function fetchTipInvoice(username: string, amountBtc: number): Promise<TipInvoice> {
  const res = await fetch(API_ROUTES.TIPS.INVOICE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, amountBtc }),
  });
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not create a tip request.'));
  }
  return (json.data as { invoice: TipInvoice }).invoice;
}

/** Poll whether a tip has settled, using the intent id + bearer token. */
export async function fetchTipStatus(intentId: string, token: string): Promise<TipStatusResult> {
  const res = await fetch(API_ROUTES.TIPS.STATUS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intentId, token }),
  });
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not check tip status.'));
  }
  return json.data as TipStatusResult;
}
