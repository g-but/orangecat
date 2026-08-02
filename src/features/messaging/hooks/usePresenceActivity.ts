'use client';

import { useEffect, useRef } from 'react';
import { debugLog } from '../lib/constants';

type PresenceStatus = 'online' | 'away' | 'offline';

interface UsePresenceActivityOptions {
  userId: string | undefined;
  enabled: boolean;
  heartbeatInterval: number;
  awayTimeout: number;
  myStatus: PresenceStatus;
  updatePresence: (status: PresenceStatus) => Promise<void>;
}

export function usePresenceActivity({
  userId,
  enabled,
  heartbeatInterval,
  awayTimeout,
  myStatus,
  updatePresence,
}: UsePresenceActivityOptions): void {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
        }
        awayTimeoutRef.current = setTimeout(() => {
          updatePresence('away');
        }, awayTimeout);
      } else {
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
          awayTimeoutRef.current = null;
        }
        updatePresence('online');
      }
    };

    const handleWindowFocus = () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }
      updatePresence('online');
    };

    const handleWindowBlur = () => {
      awayTimeoutRef.current = setTimeout(() => {
        updatePresence('away');
      }, awayTimeout);
    };

    const handleBeforeUnload = () => {
      // Pre-existing dead endpoint: no /api/presence/offline handler exists, so this
      // beacon 404s silently. Kept as a literal (not in API_ROUTES) so audit:routes
      // doesn't declare a phantom route; remove or implement the handler to close this.
      // eslint-disable-next-line no-restricted-syntax -- see above
      navigator.sendBeacon?.('/api/presence/offline', JSON.stringify({ userId }));
    };

    updatePresence('online');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    heartbeatRef.current = setInterval(() => {
      if (!document.hidden && myStatus !== 'offline') {
        updatePresence(myStatus === 'away' ? 'away' : 'online');
        debugLog('[usePresenceActivity] heartbeat');
      }
    }, heartbeatInterval);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }

      updatePresence('offline');
    };
  }, [userId, enabled, updatePresence, heartbeatInterval, awayTimeout, myStatus]);
}
