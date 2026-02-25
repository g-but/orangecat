/**
 * Nostr Relay Management
 *
 * Handles connections to Nostr relays for publishing and subscribing to events.
 * Used for profile lookups, NIP-05 verification, and future social features.
 *
 * Created: 2026-02-25
 */

import { Relay } from 'nostr-tools';
import type { Filter, NostrEvent } from 'nostr-tools';
import { logger } from '@/utils/logger';
import { DEFAULT_RELAYS, type NostrRelay } from './types';

/** Pool of connected relays */
const connectedRelays = new Map<string, Relay>();

/**
 * Connect to a single relay
 */
export async function connectRelay(url: string): Promise<Relay> {
  const existing = connectedRelays.get(url);
  if (existing) {
    return existing;
  }

  try {
    const relay = await Relay.connect(url);
    connectedRelays.set(url, relay);

    logger.info('Nostr relay connected', { url });
    return relay;
  } catch (error) {
    logger.warn('Failed to connect to Nostr relay', { url, error });
    throw error;
  }
}

/**
 * Disconnect a relay
 */
export function disconnectRelay(url: string): void {
  const relay = connectedRelays.get(url);
  if (relay) {
    relay.close();
    connectedRelays.delete(url);
  }
}

/**
 * Disconnect all relays
 */
export function disconnectAll(): void {
  for (const [url, relay] of connectedRelays) {
    relay.close();
    connectedRelays.delete(url);
  }
}

/**
 * Get list of currently connected relay URLs
 */
export function getConnectedRelays(): string[] {
  return Array.from(connectedRelays.keys());
}

/**
 * Connect to default relays (best-effort, doesn't throw if some fail)
 */
export async function connectToDefaultRelays(): Promise<Relay[]> {
  const relays: Relay[] = [];

  const results = await Promise.allSettled(
    DEFAULT_RELAYS.filter(r => r.read || r.write).map(r => connectRelay(r.url))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      relays.push(result.value);
    }
  }

  if (relays.length === 0) {
    logger.warn('Could not connect to any default Nostr relay');
  }

  return relays;
}

/**
 * Fetch events from connected relays matching a filter
 */
export async function fetchEvents(
  filter: Filter,
  relayUrls?: string[],
  timeoutMs = 5000
): Promise<NostrEvent[]> {
  const urls = relayUrls ?? DEFAULT_RELAYS.filter(r => r.read).map(r => r.url);
  const events: NostrEvent[] = [];
  const seen = new Set<string>();

  const fetchFromRelay = async (url: string): Promise<void> => {
    try {
      const relay = await connectRelay(url);

      return new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          sub.close();
          resolve();
        }, timeoutMs);

        const sub = relay.subscribe([filter], {
          onevent: (event: NostrEvent) => {
            if (!seen.has(event.id)) {
              seen.add(event.id);
              events.push(event);
            }
          },
          oneose: () => {
            clearTimeout(timeout);
            sub.close();
            resolve();
          },
        });
      });
    } catch {
      // Skip failed relays silently
    }
  };

  await Promise.allSettled(urls.map(fetchFromRelay));
  return events;
}

/**
 * Fetch a Nostr profile (kind 0) for a given pubkey
 */
export async function fetchProfile(
  pubkey: string,
  relayUrls?: string[]
): Promise<Record<string, unknown> | null> {
  const events = await fetchEvents({ kinds: [0], authors: [pubkey], limit: 1 }, relayUrls);

  if (events.length === 0) {
    return null;
  }

  // Return the most recent kind 0 event
  const latest = events.sort((a, b) => b.created_at - a.created_at)[0];

  try {
    return JSON.parse(latest.content) as Record<string, unknown>;
  } catch {
    logger.warn('Failed to parse Nostr profile', { pubkey });
    return null;
  }
}

/**
 * Publish an event to write-enabled relays
 */
export async function publishEvent(
  event: NostrEvent,
  relayUrls?: string[]
): Promise<{ successes: string[]; failures: string[] }> {
  const urls = relayUrls ?? DEFAULT_RELAYS.filter(r => r.write).map(r => r.url);
  const successes: string[] = [];
  const failures: string[] = [];

  const publishToRelay = async (url: string): Promise<void> => {
    try {
      const relay = await connectRelay(url);
      await relay.publish(event);
      successes.push(url);
    } catch {
      failures.push(url);
    }
  };

  await Promise.allSettled(urls.map(publishToRelay));

  if (successes.length === 0 && failures.length > 0) {
    logger.warn('Failed to publish event to any relay', {
      eventId: event.id,
      failures,
    });
  }

  return { successes, failures };
}

/**
 * Get relay recommendations for the user
 */
export function getRecommendedRelays(): NostrRelay[] {
  return [...DEFAULT_RELAYS];
}
