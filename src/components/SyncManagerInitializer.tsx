'use client';

import { useEffect } from 'react';
import { syncManager } from '@/lib/sync-manager';

/**
 * A client component that initializes the offline queue sync manager.
 * This component renders nothing to the DOM.
 */
export function SyncManagerInitializer() {
  useEffect(() => {
    // Initialize the sync manager on the client side when the app loads.
    syncManager.init();
  }, []); // The empty dependency array ensures this runs only once on mount.

  return null;
}
