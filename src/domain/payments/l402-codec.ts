/**
 * L402 wire codec — pure header parsing/building + preimage proof. No db, no
 * service imports, so the unit suite exercises it without the payment stack
 * (which transitively pulls Resend/NWC). Flows live in l402.ts.
 */

import { createHash } from 'crypto';

export interface L402Credentials {
  paymentIntentId: string;
  statusToken: string;
  preimage: string;
}

/**
 * Parse `Authorization: L402 <intentId>.<statusToken>:<preimage>`.
 * Also accepts the legacy `LSAT` scheme name. Returns null for anything else.
 */
export function parseL402Authorization(header: string | null): L402Credentials | null {
  if (!header) {
    return null;
  }
  const match = /^(?:L402|LSAT)\s+([^:\s]+):([0-9a-fA-F]+)$/.exec(header.trim());
  if (!match) {
    return null;
  }
  const [token, preimage] = [match[1], match[2]];
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) {
    return null;
  }
  return {
    paymentIntentId: token.slice(0, dot),
    statusToken: token.slice(dot + 1),
    preimage: preimage.toLowerCase(),
  };
}

/** The proof: a Lightning preimage hashes (sha256) to the invoice's payment_hash. */
export function preimageMatchesHash(preimage: string, paymentHash: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(preimage) || !/^[0-9a-f]{64}$/i.test(paymentHash)) {
    return false;
  }
  const digest = createHash('sha256').update(Buffer.from(preimage, 'hex')).digest('hex');
  return digest === paymentHash.toLowerCase();
}

/** Value for the `WWW-Authenticate` response header of a 402 challenge. */
export function buildL402ChallengeHeader(input: {
  paymentIntentId: string;
  statusToken: string;
  bolt11: string | null;
}): string {
  const token = `${input.paymentIntentId}.${input.statusToken}`;
  const parts = [`token="${token}"`];
  if (input.bolt11) {
    parts.push(`invoice="${input.bolt11}"`);
  }
  return `L402 ${parts.join(', ')}`;
}
