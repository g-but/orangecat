'use client';

/**
 * REAL-TIME MANAGER HOOK
 *
 * Centralized management of Supabase Realtime connections.
 * Updates the messaging store with connection status.
 * Handles automatic reconnection and heartbeat monitoring.
 */

import { useEffect, useRef } from 'react';
import { useRealtimeConnection } from './useRealtimeConnection';
import { messagingActions } from '@/stores/messaging';
import { useAuth } from './useAuth';
import { debugLog } from '@/features/messaging/lib/constants';

export function useRealtimeManager() {
  const { user, hydrated } = useAuth();
  const connectionRef = useRef<ReturnType<typeof useRealtimeConnection> | null>(null);

  // Only enable real-time when user is authenticated and hydrated
  const enabled = !!(user && hydrated);

  const connection = useRealtimeConnection({
    enabled,
    onStatusChange: status => {
      messagingActions.setConnectionStatus(status);
      debugLog('[RealtimeManager] Connection status changed:', status);
    },
  });

  // Store connection reference for cleanup
  useEffect(() => {
    connectionRef.current = connection;
    return () => {
      connectionRef.current = null;
    };
  }, [connection]);

  // Update store when connection status changes
  useEffect(() => {
    if (enabled) {
      messagingActions.setConnectionStatus(connection.status);
    }
  }, [connection.status, enabled]);

  return {
    status: connection.status,
    isConnected: connection.isConnected,
    reconnect: connection.reconnect,
    error: connection.error,
  };
}



