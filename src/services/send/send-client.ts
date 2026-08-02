/**
 * Browser client for /send. Thin on purpose — every decision that matters
 * (resolution, bounds, whether the payment happened) belongs on the server.
 */

import { API_ROUTES } from '@/config/api-routes';

export interface SendOutcome {
  paymentHash: string;
  amountBtc: number | null;
  destination: string;
}

async function post(body: unknown): Promise<SendOutcome> {
  const res = await fetch(API_ROUTES.SEND, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) ?? {};
  if (!res.ok || !json.success) {
    const err = json.error;
    const message =
      (typeof err === 'string' ? err : (err as { message?: string })?.message) ||
      'The payment did not go through.';
    throw new Error(message);
  }
  return json.data as SendOutcome;
}

export function sendToPerson(recipient: string, amountBtc: number, memo?: string) {
  return post({ recipient, amount_btc: amountBtc, ...(memo ? { memo } : {}) });
}

export function sendInvoice(invoice: string) {
  return post({ invoice });
}
