/**
 * Nostr Key Management
 *
 * Handles key pair generation, encoding/decoding between hex and bech32 (npub/nsec),
 * and NIP-07 browser extension interaction.
 *
 * Created: 2026-02-25
 */

import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import type { NostrKeyPair, Nip07Extension } from './types';

/**
 * Generate a new Nostr key pair
 */
export function generateKeyPair(): NostrKeyPair {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);
  return {
    publicKey: pk,
    privateKey: Buffer.from(sk).toString('hex'),
  };
}

/**
 * Get public key from private key (hex)
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const sk = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
  return getPublicKey(sk);
}

/**
 * Encode a hex public key as npub (bech32)
 */
export function hexToNpub(hexPubkey: string): string {
  return nip19.npubEncode(hexPubkey);
}

/**
 * Encode a hex private key as nsec (bech32)
 */
export function hexToNsec(hexPrivkey: string): string {
  const sk = Uint8Array.from(Buffer.from(hexPrivkey, 'hex'));
  return nip19.nsecEncode(sk);
}

/**
 * Decode an npub/nsec to hex
 * Returns { type: 'npub'|'nsec', hex: hexString }
 */
export function decodeBech32(bech32: string): { type: string; hex: string } {
  const decoded = nip19.decode(bech32);
  if (decoded.type === 'npub') {
    return { type: 'npub', hex: decoded.data as string };
  }
  if (decoded.type === 'nsec') {
    const hex = Buffer.from(decoded.data as Uint8Array).toString('hex');
    return { type: 'nsec', hex };
  }
  throw new Error(`Unsupported bech32 type: ${decoded.type}`);
}

/**
 * Validate an npub string
 */
export function isValidNpub(value: string): boolean {
  if (!value.startsWith('npub1')) {
    return false;
  }
  try {
    const decoded = nip19.decode(value);
    return decoded.type === 'npub';
  } catch {
    return false;
  }
}

/**
 * Validate an nsec string
 */
export function isValidNsec(value: string): boolean {
  if (!value.startsWith('nsec1')) {
    return false;
  }
  try {
    const decoded = nip19.decode(value);
    return decoded.type === 'nsec';
  } catch {
    return false;
  }
}

/**
 * Check if NIP-07 browser extension (e.g., Alby, nos2x) is available
 */
export function hasNip07Extension(): boolean {
  return typeof window !== 'undefined' && !!window.nostr;
}

/**
 * Get NIP-07 extension reference
 */
export function getNip07Extension(): Nip07Extension | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.nostr ?? null;
}

/**
 * Get public key from NIP-07 extension
 * Prompts user in their extension to approve access
 */
export async function getPublicKeyFromExtension(): Promise<string> {
  const ext = getNip07Extension();
  if (!ext) {
    throw new Error('No Nostr extension found. Install Alby or nos2x.');
  }
  return ext.getPublicKey();
}

/**
 * Shorten an npub for display (npub1abc...xyz)
 */
export function shortenNpub(npub: string, chars = 8): string {
  if (npub.length <= chars * 2 + 5) {
    return npub;
  }
  return `${npub.slice(0, 5 + chars)}...${npub.slice(-chars)}`;
}
