/**
 * Nostr Library - Barrel Exports
 *
 * Central export point for all Nostr functionality.
 * Nostr is an optional progressive enhancement - never required for core functionality.
 *
 * Created: 2026-02-25
 */

// Types
export type {
  NostrKeyPair,
  NostrProfile,
  NostrRelay,
  NWCConnection,
  NWCMethod,
  NWCPayInvoiceRequest,
  NWCMakeInvoiceRequest,
  NWCBalanceResponse,
  NWCInvoice,
  NWCError,
  NWCResponse,
  NostrAuthState,
  Nip07Extension,
} from './types';

export { DEFAULT_RELAYS } from './types';

// Key management
export {
  generateKeyPair,
  getPublicKeyFromPrivate,
  hexToNpub,
  hexToNsec,
  decodeBech32,
  isValidNpub,
  isValidNsec,
  hasNip07Extension,
  getNip07Extension,
  getPublicKeyFromExtension,
  shortenNpub,
} from './keys';

// NWC (Nostr Wallet Connect)
export { NWCClient, parseNWCUri, isValidNWCUri } from './nwc';

// Relay management
export {
  connectRelay,
  disconnectRelay,
  disconnectAll,
  getConnectedRelays,
  connectToDefaultRelays,
  fetchEvents,
  fetchProfile,
  publishEvent,
  getRecommendedRelays,
} from './relays';

// NIP-05 verification
export { verifyNip05, formatNip05 } from './nip05';
