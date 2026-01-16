/**
 * useWalletOperations Hook
 *
 * Custom hook for wallet CRUD operations (create, update, delete, refresh).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, WalletFormData } from '@/types/wallet';
import { logger } from '@/utils/logger';
import { parseErrorResponse } from '@/lib/wallets/errorHandling';
import { toast } from 'sonner';

interface UseWalletOperationsOptions {
  userId: string | undefined;
  profileId: string | undefined;
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
}

interface DuplicateDialogState {
  isOpen: boolean;
  walletData: WalletFormData | null;
  existingWallets: Array<{ id: string; label: string; category: string }> | null;
}

export function useWalletOperations({
  userId,
  profileId,
  setWallets,
}: UseWalletOperationsOptions) {
  const router = useRouter();
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateDialogState>({
    isOpen: false,
    walletData: null,
    existingWallets: null,
  });

  const handleAddWallet = async (data: WalletFormData) => {
    if (!userId || !profileId) {
      logger.error('User or profile ID not available for wallet creation', {}, 'WalletManagement');
      toast.error('Authentication error. Please refresh the page and try again.');
      return;
    }

    if (!data.label?.trim()) {
      toast.error('Wallet name is required');
      return;
    }

    if (!data.address_or_xpub?.trim()) {
      toast.error('Wallet address is required');
      return;
    }

    if (!data.category) {
      toast.error('Wallet category is required');
      return;
    }

    logger.info(
      'Starting wallet creation',
      {
        userId,
        profileId,
        label: data.label,
        category: data.category,
      },
      'WalletManagement'
    );

    try {
      const requestBody = {
        ...data,
        profile_id: profileId,
      };

      logger.debug('Sending wallet creation request', { requestBody }, 'WalletManagement');

      let response;
      try {
        response = await fetch('/api/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError) {
        logger.error(
          'Network error during wallet creation',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            profileId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for wallet operation',
            { status: response.status, profileId },
            'WalletManagement'
          );
          toast.error('Please log in to add wallets');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }

        let errorMessage;
        try {
          errorMessage = await parseErrorResponse(response);
        } catch (parseError) {
          logger.error(
            'Failed to parse error response',
            {
              status: response.status,
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
              profileId,
            },
            'WalletManagement'
          );
          errorMessage = `Server error (${response.status})`;
        }

        logger.error(
          'Failed to add wallet',
          {
            status: response.status,
            errorMessage,
            profileId,
            responseType: response.type,
            responseUrl: response.url,
          },
          'WalletManagement'
        );
        toast.error(errorMessage || 'Failed to add wallet');
        return;
      }

      let responseData;
      try {
        responseData = await response.json();
        logger.debug('Wallet creation response received', { responseData }, 'WalletManagement');
      } catch (jsonError) {
        logger.error(
          'Failed to parse wallet creation response',
          {
            error: jsonError instanceof Error ? jsonError.message : String(jsonError),
            profileId,
          },
          'WalletManagement'
        );
        toast.error('Invalid response from server');
        return;
      }

      const duplicateWarning = responseData?.data?.duplicateWarning;
      if (duplicateWarning) {
        logger.info(
          'Duplicate wallet warning triggered',
          {
            existingCount: duplicateWarning.existingWallets?.length,
            profileId,
          },
          'WalletManagement'
        );

        setDuplicateDialog({
          isOpen: true,
          walletData: data,
          existingWallets: duplicateWarning.existingWallets,
        });
        return;
      }

      const newWallet = responseData?.data?.wallet || responseData?.data;

      if (!newWallet || !newWallet.id) {
        logger.error(
          'Invalid wallet data returned',
          { newWallet, profileId },
          'WalletManagement'
        );
        toast.error('Wallet creation failed: invalid data returned');
        return;
      }

      setWallets(prev => [...prev, newWallet]);
      toast.success('Wallet added successfully');
      logger.info(
        'Wallet added successfully',
        {
          walletId: newWallet.id,
          profileId,
          label: newWallet.label,
          category: newWallet.category,
        },
        'WalletManagement'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add wallet';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleConfirmDuplicateWallet = async () => {
    if (!duplicateDialog.walletData || !userId || !profileId) {
      return;
    }

    try {
      let response;
      try {
        response = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...duplicateDialog.walletData,
            profile_id: profileId,
            force_duplicate: true,
          }),
        });
      } catch (fetchError) {
        logger.error(
          'Network error during duplicate wallet creation',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            profileId,
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for duplicate wallet operation',
            { status: response.status, profileId },
            'WalletManagement'
          );
          toast.error('Please log in to add wallets');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }

        const errorMessage = await parseErrorResponse(response);
        logger.error(
          'Failed to force add duplicate wallet',
          { status: response.status, profileId },
          'WalletManagement'
        );
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const newWallet = responseData?.data?.wallet || responseData?.data;

      setWallets(prev => [newWallet, ...prev]);

      toast.success('Wallet added successfully');
      logger.info(
        'Wallet added with duplicate confirmation',
        { walletId: newWallet.id, profileId },
        'WalletManagement'
      );

      setDuplicateDialog({
        isOpen: false,
        walletData: null,
        existingWallets: null,
      });
    } catch (error) {
      toast.error(
        `Failed to add wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleCancelDuplicateWallet = () => {
    setDuplicateDialog({
      isOpen: false,
      walletData: null,
      existingWallets: null,
    });
  };

  const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
    try {
      let response;
      try {
        response = await fetch(`/api/wallets/${walletId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            profile_id: profileId,
          }),
        });
      } catch (fetchError) {
        logger.error(
          'Network error during wallet update',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            walletId,
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for wallet update',
            { status: response.status, walletId },
            'WalletManagement'
          );
          toast.error('Please log in to update wallets');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }

        const errorMessage = await parseErrorResponse(response);
        logger.error('Failed to update wallet', { status: response.status, walletId }, 'WalletManagement');
        throw new Error(errorMessage);
      }

      let updatedWallet;
      try {
        const responseData = await response.json();
        updatedWallet = responseData.wallet || responseData;
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!updatedWallet) {
        throw new Error('Wallet update failed: no wallet data returned');
      }

      setWallets(prev => prev.map(w => (w.id === walletId ? updatedWallet : w)));
      toast.success('Wallet updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update wallet';
      toast.error(errorMessage);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      let response;
      try {
        response = await fetch(`/api/wallets/${walletId}`, {
          method: 'DELETE',
        });
      } catch (fetchError) {
        logger.error(
          'Network error during wallet deletion',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            walletId,
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for wallet deletion',
            { status: response.status, walletId },
            'WalletManagement'
          );
          toast.error('Please log in to delete wallets');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }

        const errorMessage = await parseErrorResponse(response);
        logger.error('Failed to delete wallet', { status: response.status, walletId }, 'WalletManagement');
        throw new Error(errorMessage);
      }

      setWallets(prev => prev.filter(w => w.id !== walletId));
      toast.success('Wallet deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete wallet';
      toast.error(errorMessage);
    }
  };

  const handleRefreshWallet = async (walletId: string) => {
    try {
      let response;
      try {
        response = await fetch(`/api/wallets/${walletId}/refresh`, {
          method: 'POST',
        });
      } catch (fetchError) {
        logger.error(
          'Network error during wallet refresh',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            walletId,
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for wallet refresh',
            { status: response.status, walletId },
            'WalletManagement'
          );
          toast.error('Please log in to refresh wallet data');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh wallet');
      }

      const refreshedWallet = await response.json();
      setWallets(prev => prev.map(w => (w.id === walletId ? refreshedWallet : w)));
      toast.success('Wallet refreshed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh wallet');
      throw error;
    }
  };

  return {
    handleAddWallet,
    handleUpdateWallet,
    handleDeleteWallet,
    handleRefreshWallet,
    handleConfirmDuplicateWallet,
    handleCancelDuplicateWallet,
    duplicateDialog,
  };
}

