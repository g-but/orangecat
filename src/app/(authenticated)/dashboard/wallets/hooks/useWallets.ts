/**
 * useWallets Hook
 *
 * Custom hook for fetching and managing wallets.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import { useState, useEffect, useCallback } from 'react';
import { Wallet } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { API_TIMEOUT_MS, AUTH_TIMEOUT_MS } from '@/lib/wallets/constants';
import { parseErrorResponse } from '@/lib/wallets/errorHandling';
import { toast } from 'sonner';

interface UseWalletsOptions {
  profileId: string | undefined;
  authLoading: boolean;
}

interface UseWalletsReturn {
  wallets: Wallet[];
  isLoading: boolean;
  loadingError: string | null;
  refreshWallets: () => void;
}

export function useWallets({ profileId, authLoading }: UseWalletsOptions): UseWalletsReturn {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    let fetchController: AbortController | null = null;

    try {
      setIsLoading(true);
      setLoadingError(null);

      fetchController = new AbortController();
      const timeoutId = setTimeout(() => fetchController!.abort(), API_TIMEOUT_MS);

      const walletsResponse = await fetch(`/api/wallets?profile_id=${profileId}`, {
        signal: fetchController.signal,
      });

      clearTimeout(timeoutId);

      if (walletsResponse.ok) {
        const data = await walletsResponse.json();
        setWallets(Array.isArray(data.data) ? data.data : []);
        setLoadingError(null);
      } else {
        const errorMessage = await parseErrorResponse(walletsResponse);

        if (walletsResponse.status !== 404) {
          setLoadingError(errorMessage);
          toast.error(`Failed to load wallets: ${errorMessage}`);
          logger.error(
            'Failed to load wallets',
            { status: walletsResponse.status, profileId },
            'WalletManagement'
          );
        }
        setWallets([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const errorMsg = 'Request timed out. The server may be slow or unavailable.';
        logger.error('Wallet fetch timeout', { profileId }, 'WalletManagement');
        setLoadingError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch wallets';
        logger.error('Wallet fetch error', { error: errorMsg, profileId }, 'WalletManagement');
        setLoadingError(errorMsg);
        toast.error(`Error loading wallets: ${errorMsg}`);
      }
      setWallets([]);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    let authTimeoutId: NodeJS.Timeout | null = null;

    if (authLoading) {
      authTimeoutId = setTimeout(() => {
        logger.error('Auth loading timeout', {}, 'WalletManagement');
        setLoadingError('Authentication is taking longer than expected. Please refresh the page.');
        setIsLoading(false);
      }, AUTH_TIMEOUT_MS);
      return () => {
        if (authTimeoutId) {
          clearTimeout(authTimeoutId);
        }
      };
    }

    fetchWallets();

    return () => {
      if (authTimeoutId) {
        clearTimeout(authTimeoutId);
      }
    };
  }, [profileId, authLoading, fetchWallets]);

  return {
    wallets,
    isLoading,
    loadingError,
    refreshWallets: fetchWallets,
  };
}
