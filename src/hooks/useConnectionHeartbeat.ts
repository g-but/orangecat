'use client';

import { useRef, useCallback } from 'react';
import type { ConnectionStatus } from './useRealtimeConnection';
import { debugLog } from '@/features/messaging/lib/constants';

interface UseConnectionHeartbeatProps {
  channelRef: React.MutableRefObject<{ state: string } | null>;
  isMountedRef: React.MutableRefObject<boolean>;
  updateStatus: (status: ConnectionStatus) => void;
  onDeadConnection: () => void;
}

const HEARTBEAT_INTERVAL_MS = 30000;

export function useConnectionHeartbeat({
  channelRef,
  isMountedRef,
  updateStatus,
  onDeadConnection,
}: UseConnectionHeartbeatProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (!channelRef.current || !isMountedRef.current) {
        return;
      }

      const channelState = channelRef.current.state;
      debugLog('[useConnectionHeartbeat] check - channel state:', channelState);

      if (channelState !== 'joined' && channelState !== 'joining') {
        debugLog('[useConnectionHeartbeat] detected dead connection, reconnecting...');
        updateStatus('reconnecting');
        onDeadConnection();
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, [channelRef, isMountedRef, updateStatus, onDeadConnection]);

  return { start, stop };
}
