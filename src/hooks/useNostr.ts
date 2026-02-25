/**
 * useNostr - React Hook for Nostr Integration
 *
 * Provides Nostr authentication and NWC wallet connection state.
 * Nostr is optional - users can use OrangeCat without it.
 *
 * Created: 2026-02-25
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { NostrAuthState, NostrProfile } from '@/lib/nostr/types';
import {
  hasNip07Extension,
  getPublicKeyFromExtension,
  hexToNpub,
  isValidNpub,
  decodeBech32,
  fetchProfile,
} from '@/lib/nostr';
import { logger } from '@/utils/logger';

const STORAGE_KEY_NOSTR = 'orangecat_nostr_state';
const STORAGE_KEY_NWC = 'orangecat_nwc_uri';

/** Initial empty state */
const INITIAL_STATE: NostrAuthState = {
  connected: false,
  npub: null,
  pubkey: null,
  profile: null,
  nwcConnected: false,
  method: null,
};

/**
 * Load persisted Nostr state from localStorage
 */
function loadPersistedState(): Partial<NostrAuthState> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOSTR);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as Partial<NostrAuthState>;
  } catch {
    return {};
  }
}

/**
 * Persist Nostr state to localStorage
 */
function persistState(state: NostrAuthState): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Only persist connection info, not full profile
    localStorage.setItem(
      STORAGE_KEY_NOSTR,
      JSON.stringify({
        connected: state.connected,
        npub: state.npub,
        pubkey: state.pubkey,
        method: state.method,
      })
    );
  } catch {
    // localStorage may be full or disabled
  }
}

export function useNostr() {
  const [state, setState] = useState<NostrAuthState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Restore persisted state on mount
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    const persisted = loadPersistedState();
    if (persisted.connected && persisted.pubkey) {
      setState(prev => ({
        ...prev,
        ...persisted,
        profile: null, // Re-fetch profile
      }));

      // Re-fetch profile in background
      fetchProfile(persisted.pubkey).then(profileData => {
        if (profileData) {
          setState(prev => ({
            ...prev,
            profile: profileData as NostrProfile,
          }));
        }
      });
    }
  }, []);

  /**
   * Connect via NIP-07 browser extension (Alby, nos2x, etc.)
   */
  const connectWithExtension = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!hasNip07Extension()) {
        throw new Error('No Nostr extension found. Install Alby or nos2x to connect.');
      }

      const pubkey = await getPublicKeyFromExtension();
      const npub = hexToNpub(pubkey);

      // Fetch profile from relays
      const profileData = await fetchProfile(pubkey);

      const newState: NostrAuthState = {
        connected: true,
        npub,
        pubkey,
        profile: (profileData as NostrProfile) ?? null,
        nwcConnected: !!localStorage.getItem(STORAGE_KEY_NWC),
        method: 'nip07',
      };

      setState(newState);
      persistState(newState);

      logger.info('Nostr connected via NIP-07', { npub });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect with Nostr';
      setError(message);
      logger.warn('Nostr NIP-07 connection failed', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connect with an npub key (read-only, no signing)
   */
  const connectWithNpub = useCallback(async (npubOrHex: string) => {
    setLoading(true);
    setError(null);

    try {
      let pubkey: string;
      let npub: string;

      if (isValidNpub(npubOrHex)) {
        const decoded = decodeBech32(npubOrHex);
        pubkey = decoded.hex;
        npub = npubOrHex;
      } else if (/^[0-9a-f]{64}$/.test(npubOrHex)) {
        pubkey = npubOrHex;
        npub = hexToNpub(npubOrHex);
      } else {
        throw new Error('Invalid npub or hex public key');
      }

      const profileData = await fetchProfile(pubkey);

      const newState: NostrAuthState = {
        connected: true,
        npub,
        pubkey,
        profile: (profileData as NostrProfile) ?? null,
        nwcConnected: false,
        method: null, // read-only, no signing
      };

      setState(newState);
      persistState(newState);

      logger.info('Nostr connected via npub', { npub });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disconnect Nostr
   */
  const disconnect = useCallback(() => {
    setState(INITIAL_STATE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_NOSTR);
      localStorage.removeItem(STORAGE_KEY_NWC);
    }
    logger.info('Nostr disconnected');
  }, []);

  /**
   * Save NWC connection URI
   */
  const saveNWCUri = useCallback((uri: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NWC, uri);
    }
    setState(prev => ({ ...prev, nwcConnected: true }));
  }, []);

  /**
   * Get saved NWC connection URI
   */
  const getNWCUri = useCallback((): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(STORAGE_KEY_NWC);
  }, []);

  /**
   * Remove NWC connection
   */
  const removeNWC = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_NWC);
    }
    setState(prev => ({ ...prev, nwcConnected: false }));
  }, []);

  return {
    ...state,
    loading,
    error,
    hasExtension: typeof window !== 'undefined' && hasNip07Extension(),
    connectWithExtension,
    connectWithNpub,
    disconnect,
    saveNWCUri,
    getNWCUri,
    removeNWC,
  };
}
