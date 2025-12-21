'use client';

/**
 * Real-time Connection Status Hook
 * 
 * Monitors Supabase Realtime connection status and provides automatic reconnection.
 * This ensures messages appear in real-time like Facebook Messenger.
 * 
 * @module hooks/useRealtimeConnection
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import supabase from '@/lib/supabase/browser';
import { debugLog } from '@/features/messaging/lib/constants';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface UseRealtimeConnectionOptions {
  /** Whether to enable connection monitoring */
  enabled?: boolean;
  /** Callback when connection status changes */
  onStatusChange?: (status: ConnectionStatus) => void;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Initial delay before first reconnection attempt (ms) */
  initialReconnectDelay?: number;
  /** Maximum delay between reconnection attempts (ms) */
  maxReconnectDelay?: number;
}

interface UseRealtimeConnectionReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** Whether currently connected */
  isConnected: boolean;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Last connection error, if any */
  error: Error | null;
}

/**
 * Hook for monitoring and managing Supabase Realtime connection status
 */
export function useRealtimeConnection(
  options: UseRealtimeConnectionOptions = {}
): UseRealtimeConnectionReturn {
  const {
    enabled = true,
    onStatusChange,
    maxReconnectAttempts = 10,
    initialReconnectDelay = 1000,
    maxReconnectDelay = 30000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = initialReconnectDelay;
    const exponentialDelay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(exponentialDelay, maxReconnectDelay);
  }, [initialReconnectDelay, maxReconnectDelay]);

  /**
   * Update status and notify callback
   */
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus, err: Error | null = null) => {
      if (!isMountedRef.current) return;

      setStatus(newStatus);
      setError(err);
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
      debugLog('[useRealtimeConnection] Status changed:', newStatus, err?.message);
    },
    [onStatusChange]
  );

  /**
   * Start heartbeat to detect dead connections
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (!channelRef.current || !isMountedRef.current) return;

      // Check if channel is still subscribed
      const channelState = channelRef.current.state;
      if (channelState !== 'joined' && channelState !== 'joining') {
        debugLog('[useRealtimeConnection] Heartbeat detected dead connection, reconnecting...');
        updateStatus('reconnecting');
        reconnectAttemptsRef.current = 0;
        attemptReconnect();
      }
    }, 30000); // Check every 30 seconds
  }, []);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Attempt to reconnect
   */
  const attemptReconnect = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      debugLog('[useRealtimeConnection] Max reconnection attempts reached');
      updateStatus('error', new Error('Max reconnection attempts reached'));
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = getReconnectDelay();

    debugLog(
      `[useRealtimeConnection] Reconnecting (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setupConnection();
    }, delay);
  }, [enabled, maxReconnectAttempts, getReconnectDelay]);

  /**
   * Setup the connection monitoring channel
   */
  const setupConnection = useCallback(() => {
    if (!enabled || !isMountedRef.current) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    updateStatus('reconnecting');

    const channel = supabase
      .channel('realtime-connection-monitor', {
        config: {
          broadcast: { self: false },
          presence: { key: 'connection' },
        },
      })
      .subscribe(async (subscribeStatus, err) => {
        if (!isMountedRef.current) return;

        if (subscribeStatus === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0;
          updateStatus('connected');
          startHeartbeat();

          // Track presence to keep connection alive
          try {
            await channel.track({
              connected_at: new Date().toISOString(),
              user_agent: navigator.userAgent,
            });
          } catch (err) {
            debugLog('[useRealtimeConnection] Error tracking presence:', err);
          }
        } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
          debugLog('[useRealtimeConnection] Connection error:', err);
          updateStatus('error', err || new Error('Connection error'));
          stopHeartbeat();
          attemptReconnect();
        } else if (subscribeStatus === 'CLOSED') {
          debugLog('[useRealtimeConnection] Connection closed');
          updateStatus('disconnected');
          stopHeartbeat();
          attemptReconnect();
        }
      });

    channelRef.current = channel;
  }, [enabled, updateStatus, startHeartbeat, stopHeartbeat, attemptReconnect]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    debugLog('[useRealtimeConnection] Manual reconnect triggered');
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setupConnection();
  }, [setupConnection]);

  // Setup connection on mount
  useEffect(() => {
    if (enabled) {
      setupConnection();
    }

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, setupConnection, stopHeartbeat]);

  // Monitor browser online/offline events
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      debugLog('[useRealtimeConnection] Browser came online');
      if (status === 'disconnected' || status === 'error') {
        reconnect();
      }
    };

    const handleOffline = () => {
      debugLog('[useRealtimeConnection] Browser went offline');
      updateStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, status, reconnect, updateStatus]);

  return {
    status,
    isConnected: status === 'connected',
    reconnect,
    error,
  };
}

