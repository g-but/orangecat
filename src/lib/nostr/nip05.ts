/**
 * NIP-05 Verification
 *
 * Verifies Nostr identifiers (user@domain.com format) by checking
 * the /.well-known/nostr.json endpoint on the domain.
 *
 * Created: 2026-02-25
 */

import { logger } from '@/utils/logger';

export interface Nip05Result {
  valid: boolean;
  pubkey?: string;
  relays?: string[];
}

/**
 * Verify a NIP-05 identifier
 *
 * @param nip05 - identifier in "user@domain.com" format
 * @param expectedPubkey - optional pubkey to verify against
 * @returns verification result with pubkey and relay hints
 */
export async function verifyNip05(nip05: string, expectedPubkey?: string): Promise<Nip05Result> {
  const parts = nip05.split('@');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [name, domain] = parts;

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = (await response.json()) as {
      names?: Record<string, string>;
      relays?: Record<string, string[]>;
    };
    const pubkey = data.names?.[name];

    if (!pubkey) {
      return { valid: false };
    }

    // If expectedPubkey provided, verify it matches
    if (expectedPubkey && pubkey !== expectedPubkey) {
      return { valid: false };
    }

    const relays = data.relays?.[pubkey] ?? [];

    return { valid: true, pubkey, relays };
  } catch (error) {
    logger.warn('NIP-05 verification failed', { nip05, error });
    return { valid: false };
  }
}

/**
 * Format a NIP-05 identifier for display
 * Removes the leading underscore user (convention for domain-level NIP-05)
 */
export function formatNip05(nip05: string): string {
  if (nip05.startsWith('_@')) {
    // Domain-level NIP-05: _@example.com → example.com
    return nip05.slice(2);
  }
  return nip05;
}
