/**
 * Unified Realtime Subscription Hook
 *
 * Consolidates common realtime subscription patterns to eliminate DRY violations.
 * Provides a reusable pattern for subscribing to Supabase realtime changes.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Created unified hook to eliminate subscription logic duplication
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import supabase from '@/lib/supabase/browser';
import { TIMING, debugLog } from '../lib/constants';

export interface RealtimeSubscriptionConfig {
  /** Channel name (use CHANNELS constants) */
  channelName: string;
  /** Table to watch */
  table: string;
  /** Schema (default: 'public') */
  schema?: string;
  /** Event types to listen for */
  events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[];
  /** Optional filter (e.g., 'conversation_id=eq.123') */
  filter?: string;
  /** Callback when change detected */
  onEvent: (payload: { eventType: string; new?: any; old?: any }) => void;
  /** Whether subscription is enabled */
  enabled?: boolean;
  /** Debounce delay in ms (default: TIMING.REFRESH_DEBOUNCE_MS) */
  debounceMs?: number;
}

/**
 * Unified hook for realtime subscriptions
 *
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   channelName: CHANNELS.CONVERSATIONS_LIST,
 *   table: 'conversations',
 *   events: ['*'],
 *   onEvent: (payload) => {
 *     refreshConversations();
 *   },
 *   enabled: !!user,
 * });
 * ```
 */
export function useRealtimeSubscription(config: RealtimeSubscriptionConfig) {
  const {
    channelName,
    table,
    schema = 'public',
    events = ['*'],
    filter,
    onEvent,
    enabled = true,
    debounceMs = TIMING.REFRESH_DEBOUNCE_MS,
  } = config;

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSetupRef = useRef(false);
  const onEventRef = useRef(onEvent);

  // Update callback ref when it changes
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Debounced event handler
  const handleEvent = useCallback(
    (eventType: string, payload: { new?: any; old?: any }) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onEventRef.current({ eventType, new: payload.new, old: payload.old });
      }, debounceMs);
    },
    [debounceMs]
  );

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isSetupRef.current = false;
      return;
    }

    // Prevent duplicate setup
    if (isSetupRef.current) {
      debugLog(`[useRealtimeSubscription] ${channelName} already setup, skipping`);
      return;
    }

    isSetupRef.current = true;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    debugLog(`[useRealtimeSubscription] Setting up ${channelName} for ${table}`);

    const channel = supabase.channel(channelName);

    // Subscribe to each event type
    events.forEach(event => {
      const config: any = {
        event: event === '*' ? '*' : event,
        schema,
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      channel.on('postgres_changes', config, payload => {
        handleEvent(event === '*' ? payload.eventType : event, {
          new: payload.new,
          old: payload.old,
        });
      });
    });

    channel.subscribe();

    channelRef.current = channel;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      isSetupRef.current = false;
    };
  }, [channelName, table, schema, events, filter, enabled, handleEvent]);

  return {
    isSubscribed: isSetupRef.current && channelRef.current !== null,
  };
}
