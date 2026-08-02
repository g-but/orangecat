/**
 * Browser client for person-to-person payment requests.
 */

import { API_ROUTES } from '@/config/api-routes';
import type { PaymentRequestRow } from '@/domain/payments/paymentRequestService';

export type { PaymentRequestRow };

async function readJson(res: Response): Promise<{ success?: boolean; data?: unknown; error?: unknown }> {
  return (await res.json().catch(() => null)) ?? {};
}

function errorMessage(json: { error?: unknown }, fallback: string): string {
  const err = json.error;
  return (typeof err === 'string' ? err : (err as { message?: string })?.message) || fallback;
}

export async function fetchPaymentRequests(): Promise<{
  incoming: PaymentRequestRow[];
  outgoing: PaymentRequestRow[];
}> {
  const res = await fetch(API_ROUTES.PAYMENT_REQUESTS.BASE);
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not load your requests.'));
  }
  return json.data as { incoming: PaymentRequestRow[]; outgoing: PaymentRequestRow[] };
}

export async function createRequest(
  payerUsername: string,
  amountBtc: number,
  note?: string
): Promise<PaymentRequestRow> {
  const res = await fetch(API_ROUTES.PAYMENT_REQUESTS.BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payer_username: payerUsername,
      amount_btc: amountBtc,
      ...(note ? { note } : {}),
    }),
  });
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not create that request.'));
  }
  return (json.data as { request: PaymentRequestRow }).request;
}

export async function closeRequest(id: string, status: 'cancelled' | 'declined'): Promise<void> {
  const res = await fetch(API_ROUTES.PAYMENT_REQUESTS.BY_ID(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = await readJson(res);
  if (!res.ok || !json.success) {
    throw new Error(errorMessage(json, 'Could not update that request.'));
  }
}
