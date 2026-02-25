/**
 * Nostr Types
 *
 * Core type definitions for Nostr integration.
 * Based on NIPs (Nostr Implementation Possibilities).
 *
 * Created: 2026-02-25
 */

/** Nostr key pair (hex-encoded) */
export interface NostrKeyPair {
  publicKey: string; // hex
  privateKey: string; // hex
}

/** Nostr profile metadata (NIP-01 kind 0) */
export interface NostrProfile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string; // NIP-05 identifier (user@domain.com)
  lud16?: string; // Lightning address (NIP-57)
  banner?: string;
  website?: string;
  display_name?: string;
}

/** Relay connection info */
export interface NostrRelay {
  url: string;
  read: boolean;
  write: boolean;
  connected?: boolean;
}

/** Default relay list for OrangeCat users */
export const DEFAULT_RELAYS: NostrRelay[] = [
  { url: 'wss://relay.damus.io', read: true, write: true },
  { url: 'wss://relay.nostr.band', read: true, write: true },
  { url: 'wss://nos.lol', read: true, write: true },
  { url: 'wss://relay.snort.social', read: true, write: false },
];

/** NWC (Nostr Wallet Connect) connection info */
export interface NWCConnection {
  walletPubkey: string;
  relayUrl: string;
  secret: string;
  lud16?: string;
}

/** NWC supported methods */
export type NWCMethod =
  | 'pay_invoice'
  | 'make_invoice'
  | 'lookup_invoice'
  | 'get_balance'
  | 'get_info'
  | 'list_transactions';

/** NWC pay_invoice request */
export interface NWCPayInvoiceRequest {
  method: 'pay_invoice';
  params: {
    invoice: string;
    amount?: number; // optional override in msats
  };
}

/** NWC make_invoice request */
export interface NWCMakeInvoiceRequest {
  method: 'make_invoice';
  params: {
    amount: number; // msats
    description?: string;
    description_hash?: string;
    expiry?: number; // seconds
  };
}

/** NWC get_balance response */
export interface NWCBalanceResponse {
  balance: number; // msats
}

/** NWC invoice info */
export interface NWCInvoice {
  type: 'incoming' | 'outgoing';
  invoice: string; // bolt11
  description?: string;
  preimage?: string;
  payment_hash: string;
  amount: number; // msats
  fees_paid?: number; // msats
  created_at: number; // unix timestamp
  settled_at?: number;
}

/** NWC error response */
export interface NWCError {
  code: string;
  message: string;
}

/** NWC response wrapper */
export interface NWCResponse<T = unknown> {
  result_type: string;
  result?: T;
  error?: NWCError;
}

/** Nostr auth state for the app */
export interface NostrAuthState {
  connected: boolean;
  npub: string | null;
  pubkey: string | null; // hex
  profile: NostrProfile | null;
  nwcConnected: boolean;
  method: 'nip07' | 'nsec' | null;
}

/** NIP-07 window.nostr extension interface */
export interface Nip07Extension {
  getPublicKey(): Promise<string>;
  signEvent(event: {
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
  }): Promise<{
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
  }>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

// Augment Window for NIP-07
declare global {
  interface Window {
    nostr?: Nip07Extension;
  }
}
