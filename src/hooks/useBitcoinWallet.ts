'use client'

import { useState, useEffect, useCallback } from 'react';
import { fetchBitcoinWalletData } from '@/services/bitcoin';
import { BitcoinWalletData } from '@/types/bitcoin/index';
import { logger } from '@/utils/logger';

export function useBitcoinWallet(walletAddress: string) {
  const [walletData, setWalletData] = useState<BitcoinWalletData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBitcoinWalletData(walletAddress);
      setWalletData(data);
    } catch (err) {
      logger.error('Error fetching wallet data:', err, 'Bitcoin');
      setError('Failed to fetch wallet data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();

    // Refresh wallet data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  return { walletData, isLoading, error, refresh: fetchData };
} 