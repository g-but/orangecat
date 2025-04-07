import { useState, useEffect } from 'react';
import { fetchBitcoinWalletData } from '@/services/bitcoin';
import { BitcoinWalletData } from '@/types/bitcoin';

export function useBitcoinWallet(walletAddress: string) {
  const [walletData, setWalletData] = useState<BitcoinWalletData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchBitcoinWalletData(walletAddress);
        setWalletData(data);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to fetch wallet data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh wallet data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [walletAddress]);

  return { walletData, isLoading, error };
} 