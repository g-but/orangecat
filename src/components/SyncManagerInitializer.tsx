'use client';

import { useEffect } from 'react';
import { syncManager } from '@/lib/sync-manager';
import { useAuth } from '@/hooks/useAuth';

/**
 * A client component that initializes the offline queue sync manager.
 * This component renders nothing to the DOM.
 */
export function SyncManagerInitializer() {
  const { user } = useAuth();
  useEffect(() => {
    // Initialize the sync manager on the client side when the app loads.
    syncManager.init();
  }, []); // The empty dependency array ensures this runs only once on mount.

  // Bind current user to the sync manager and update on changes
  useEffect(() => {
    syncManager.setCurrentUser(user?.id ?? null);
    // Kick a processing attempt when user changes (e.g., login)
    syncManager.processQueue();
  }, [user?.id]);

  return null;
}
