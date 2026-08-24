/**
 * What a wallet row may show to someone who does not own it.
 *
 * `address_or_xpub` is one column holding two different kinds of value:
 *
 *   - a plain on-chain address — public by design, it is how you get paid;
 *   - an extended public key (xpub/ypub/zpub/…) — NOT an address, but the key
 *     every address is derived from. Publishing one lets anyone enumerate the
 *     wallet's entire past and future address set and watch its balance
 *     forever. It is exactly the privacy that per-invoice derivation exists to
 *     protect (an xpub wallet gets a fresh address at invoice creation).
 *
 * So the invariant is: an extended public key never leaves this API to a
 * non-owner. Classification is by VALUE, not by the `wallet_type` label — a key
 * pasted into a row typed 'onchain' is still a key, and the label is user-set.
 *
 * Created: 2026-08-24
 */

import { detectWalletType } from '@/types/wallet';

/** A row shape loose enough for the public column list. */
interface PublicWalletRow {
  address_or_xpub?: string | null;
  [key: string]: unknown;
}

/** True when the value is an extended public key rather than a payable address. */
export function isExtendedPublicKey(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }
  return detectWalletType(trimmed) === 'xpub';
}

/**
 * Null out any extended public key in a set of rows bound for a non-owner.
 * Plain addresses pass through untouched — withholding those would break the
 * one thing the public wallet list is for.
 */
export function redactExtendedKeys<T extends PublicWalletRow>(rows: T[]): T[] {
  return rows.map(row =>
    isExtendedPublicKey(row.address_or_xpub) ? { ...row, address_or_xpub: null } : row
  );
}
