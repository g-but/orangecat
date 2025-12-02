'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { WalletManager } from '@/components/wallets/WalletManager';
import { DuplicateWalletDialog } from '@/components/wallets/DuplicateWalletDialog';
import { Wallet, WalletFormData } from '@/types/wallet';
import { toast } from 'sonner';
import { Wallet as WalletIcon, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { DynamicSidebar } from '@/components/create/DynamicSidebar';
import {
  walletGuidanceContent,
  walletDefaultContent,
  type WalletFieldType,
} from '@/lib/wallet-guidance';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { logger } from '@/utils/logger';
import { API_TIMEOUT_MS, AUTH_TIMEOUT_MS } from '@/lib/wallets/constants';
import { parseErrorResponse } from '@/lib/wallets/errorHandling';

/**
 * Dashboard Wallets Page
 *
 * Private page for users to manage their Bitcoin wallets.
 * Reuses WalletManager component following DRY principles.
 *
 * Single source of truth: WalletManager for all wallet operations
 * Separation of concerns: This page handles data fetching/API calls, WalletManager handles UI
 */
export default function DashboardWalletsPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<WalletFieldType>(null);
  const [showMobileGuidance, setShowMobileGuidance] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Duplicate wallet dialog state
  const [duplicateDialog, setDuplicateDialog] = useState<{
    isOpen: boolean;
    walletData: WalletFormData | null;
    existingWallets: Array<{ id: string; label: string; category: string }> | null;
  }>({
    isOpen: false,
    walletData: null,
    existingWallets: null,
  });

  // Detect desktop vs mobile for collapsible sections
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Fetch user's wallets using profile from auth store
  useEffect(() => {
    // Add a maximum timeout for auth loading to prevent infinite loading
    let authTimeoutId: NodeJS.Timeout | null = null;
    let fetchController: AbortController | null = null;

    if (authLoading) {
      // Set a maximum timeout for auth loading
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

    // Reset error state when starting a new fetch
    setLoadingError(null);

    // If auth is done but no profile, stop loading (user might not have profile yet)
    if (!profile) {
      setIsLoading(false);
      setWallets([]);
      return;
    }

    // If no user, stop loading
    if (!user?.id || !profile?.id) {
      setIsLoading(false);
      return;
    }

    const fetchWallets = async () => {
      try {
        setIsLoading(true);
        // Fetch wallets for this profile (profile already from auth store)
        // Add timeout to prevent hanging
        fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController!.abort(), API_TIMEOUT_MS);

        const walletsResponse = await fetch(`/api/wallets?profile_id=${profile.id}`, {
          signal: fetchController.signal,
        });

        clearTimeout(timeoutId);

        if (walletsResponse.ok) {
          const data = await walletsResponse.json();
          // API returns { success: true, data: [...] } (standard response format)
          setWallets(Array.isArray(data.data) ? data.data : []);
          setLoadingError(null);
        } else {
          // Wallets table might not exist yet, set empty array
          const errorMessage = await parseErrorResponse(walletsResponse);

          // Only show error for non-404 errors (404 might mean table doesn't exist yet)
          if (walletsResponse.status !== 404) {
            setLoadingError(errorMessage);
            toast.error(`Failed to load wallets: ${errorMessage}`);
            logger.error(
              'Failed to load wallets',
              { status: walletsResponse.status, profileId: profile.id },
              'WalletManagement'
            );
          }
          setWallets([]);
        }
      } catch (error) {
        // Handle timeout or network errors gracefully
        if (error instanceof Error && error.name === 'AbortError') {
          const errorMsg = 'Request timed out. The server may be slow or unavailable.';
          logger.error('Wallet fetch timeout', { profileId: profile.id }, 'WalletManagement');
          setLoadingError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = error instanceof Error ? error.message : 'Failed to fetch wallets';
          logger.error(
            'Wallet fetch error',
            { error: errorMsg, profileId: profile.id },
            'WalletManagement'
          );
          setLoadingError(errorMsg);
          toast.error(`Error loading wallets: ${errorMsg}`);
        }
        setWallets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallets();

    // Cleanup function
    return () => {
      if (authTimeoutId) {
        clearTimeout(authTimeoutId);
      }
      if (fetchController) {
        fetchController.abort();
      }
    };
  }, [user?.id, profile?.id, authLoading, profile]);

  // Handle wallet add
  const handleAddWallet = async (data: WalletFormData) => {
    // Comprehensive validation before API call
    if (!user?.id) {
      logger.error('User ID not available for wallet creation', {}, 'WalletManagement');
      toast.error('Authentication error. Please refresh the page and try again.');
      return;
    }

    if (!profile?.id) {
      logger.error(
        'Profile ID not available for wallet creation',
        { userId: user.id },
        'WalletManagement'
      );
      toast.error('Profile not loaded. Please refresh the page and try again.');
      return;
    }

    // Validate required form data
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
        userId: user.id,
        profileId: profile.id,
        label: data.label,
        category: data.category,
      },
      'WalletManagement'
    );

    try {
      // Use profile from auth store (already loaded)
      const requestBody = {
        ...data,
        profile_id: profile.id,
      };

      logger.debug('Sending wallet creation request', { requestBody }, 'WalletManagement');

      let response;
      try {
        response = await fetch('/api/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add cache control to prevent caching issues
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError) {
        // Handle network errors, CORS issues, etc.
        logger.error(
          'Network error during wallet creation',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            profileId: profile.id,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          },
          'WalletManagement'
        );
        toast.error('Network error. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          logger.warn(
            'Authentication required for wallet operation',
            { status: response.status, profileId: profile.id },
            'WalletManagement'
          );
          toast.error('Please log in to add wallets');
          // Redirect to login
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
              profileId: profile.id,
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
            profileId: profile.id,
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
            profileId: profile.id,
          },
          'WalletManagement'
        );
        toast.error('Invalid response from server');
        return;
      }

      // Check if there's a duplicate warning
      if (responseData.duplicateWarning) {
        logger.info(
          'Duplicate wallet warning triggered',
          {
            existingCount: responseData.duplicateWarning.existingWallets?.length,
            profileId: profile.id,
          },
          'WalletManagement'
        );

        setDuplicateDialog({
          isOpen: true,
          walletData: data,
          existingWallets: responseData.duplicateWarning.existingWallets,
        });
        return; // Don't proceed with adding the wallet yet
      }

      const newWallet = responseData.wallet || responseData;

      if (!newWallet || !newWallet.id) {
        logger.error(
          'Invalid wallet data returned',
          { newWallet, profileId: profile.id },
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
          profileId: profile.id,
          label: newWallet.label,
          category: newWallet.category,
        },
        'WalletManagement'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add wallet';
      toast.error(errorMessage);
      // Don't re-throw to prevent bubbling to error boundary
      // The error is already displayed to the user via toast
      throw error; // Re-throw for form to handle
    }
  };

  const handleConfirmDuplicateWallet = async () => {
    if (!duplicateDialog.walletData || !user?.id || !profile?.id) {
      return;
    }

    try {
      // Force add the wallet by sending a special flag
      let response;
      try {
        response = await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...duplicateDialog.walletData,
            profile_id: profile.id,
            force_duplicate: true, // Special flag to bypass duplicate warning
          }),
        });
      } catch (fetchError) {
        logger.error(
          'Network error during duplicate wallet creation',
          {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            profileId: profile.id,
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
            { status: response.status, profileId: profile.id },
            'WalletManagement'
          );
          toast.error('Please log in to add wallets');
          router.push('/auth?mode=login&from=/dashboard/wallets');
          return;
        }

        const errorMessage = await parseErrorResponse(response);
        logger.error(
          'Failed to force add duplicate wallet',
          { status: response.status, profileId: profile.id },
          'WalletManagement'
        );
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const newWallet = responseData.wallet || responseData;

      // Update wallets state
      setWallets(prev => [newWallet, ...prev]);

      toast.success('Wallet added successfully');
      logger.info(
        'Wallet added with duplicate confirmation',
        { walletId: newWallet.id, profileId: profile.id },
        'WalletManagement'
      );

      // Close dialog
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

  // Handle wallet update
  const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
    try {
      let response;
      try {
        response = await fetch(`/api/wallets/${walletId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            // Include profile_id so the API can fall back to legacy storage if needed
            profile_id: profile?.id,
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
        logger.error(
          'Failed to update wallet',
          { status: response.status, walletId },
          'WalletManagement'
        );
        throw new Error(errorMessage);
      }

      let updatedWallet;
      try {
        const responseData = await response.json();
        updatedWallet = responseData.wallet || responseData;
      } catch (jsonError) {
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
      // Don't re-throw to prevent bubbling to error boundary
      // The error is already displayed to the user via toast
    }
  };

  // Handle wallet delete
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
        logger.error(
          'Failed to delete wallet',
          { status: response.status, walletId },
          'WalletManagement'
        );
        throw new Error(errorMessage);
      }

      setWallets(prev => prev.filter(w => w.id !== walletId));
      toast.success('Wallet deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete wallet';
      toast.error(errorMessage);
      // Don't re-throw to prevent bubbling to error boundary
      // The error is already displayed to the user via toast
    }
  };

  // Handle wallet refresh
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

  // Loading state with timeout protection
  if (authLoading || isLoading) {
    return <Loading message="Loading your wallets..." />;
  }

  // Not authenticated
  if (!user) {
    router.push('/auth');
    return <Loading message="Redirecting to login..." />;
  }

  // Show error state if loading failed
  if (loadingError && wallets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Card className="border-red-200 bg-white">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Failed to Load Wallets
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">{loadingError}</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setLoadingError(null);
                        setIsLoading(true);
                        // Trigger re-fetch by updating a dependency
                        window.location.reload();
                      }}
                      variant="outline"
                    >
                      Retry
                    </Button>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <WalletIcon className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manage Wallets</h1>
          </div>
          {/* Desktop: Full description, Mobile: Shortened */}
          <p className="hidden lg:block text-gray-600 mb-4 max-w-2xl">
            Add and manage your Bitcoin wallets. Each wallet can represent a specific funding need
            such as rent, food, medical costs, or a one‑time savings goal.
          </p>
          <p className="lg:hidden text-sm text-gray-600 mb-3">
            Add Bitcoin wallets for different funding needs
          </p>

          {/* Info Banner - Collapsible on Mobile, Open on Desktop */}
          <details
            className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden"
            open={isDesktop}
          >
            <summary className="p-3 lg:p-4 flex items-start gap-3 cursor-pointer list-none">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 flex-1">
                <p className="font-medium">About Bitcoin Wallets</p>
                <p className="lg:hidden mt-1 text-xs">
                  Connect your Bitcoin address or xpub to receive support
                </p>
              </div>
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 lg:hidden transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-3 pb-3 lg:px-4 lg:pb-4 pt-0 lg:pt-0 text-sm text-blue-900 border-t border-blue-200 lg:border-t-0">
              <p className="mt-2">
                Connect a Bitcoin address or extended public key (xpub/ypub/zpub) from a wallet you
                control. Active wallets appear on your profile so supporters know exactly what they
                are funding.
              </p>
            </div>
          </details>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12">
          {/* Desktop: Guidance Sidebar */}
          <div className="hidden lg:block lg:col-span-5 lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Simple explainer / checklist */}
              <Card className="p-6 shadow-sm border-gray-200">
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900">How wallet setup works</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Create one wallet per funding goal or budget. You can always edit or archive
                    wallets later.
                  </p>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Choose a clear category like Rent, Food, or Emergency</li>
                  <li>Give the wallet a human name that explains its purpose</li>
                  <li>Paste a Bitcoin address or xpub from your own wallet</li>
                  <li>Optionally set a funding goal in CHF, EUR, USD, BTC, or SATS</li>
                </ul>
              </Card>

              {/* Dynamic Guidance */}
              <DynamicSidebar<NonNullable<WalletFieldType>>
                activeField={focusedField}
                guidanceContent={walletGuidanceContent}
                defaultContent={walletDefaultContent}
              />
            </div>
          </div>

          {/* Main Content - Wallet Manager */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <WalletManager
                wallets={wallets}
                entityType="profile"
                entityId={user?.id || ''}
                onAdd={handleAddWallet}
                onUpdate={handleUpdateWallet}
                onDelete={handleDeleteWallet}
                onRefresh={handleRefreshWallet}
                maxWallets={10}
                isOwner={!!user?.id && !!profile?.id}
                onFieldFocus={setFocusedField}
              />
            </div>

            {/* Help Section - Collapsible on Mobile, Open on Desktop */}
            <details
              className="mt-6 lg:mt-8 bg-gray-50 rounded-lg overflow-hidden"
              open={isDesktop}
            >
              <summary className="p-4 lg:p-6 flex items-start gap-3 cursor-pointer list-none">
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm lg:text-base text-gray-900 mb-0 lg:mb-2">
                    Quick tips
                  </p>
                  {/* Mobile: Show only key point, Desktop: Show all */}
                  <p className="lg:hidden text-xs text-gray-600 mt-1">
                    Use xpub/ypub/zpub for best tracking • Never paste seed phrase
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-600 flex-shrink-0 lg:hidden transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-4 pb-4 lg:px-6 lg:pb-6 pt-0 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>
                      <strong>Recommended:</strong> Use extended public keys (xpub, ypub, zpub) to
                      automatically track all addresses and transactions
                    </li>
                    <li>
                      Single addresses (1..., 3..., bc1...) work too, but only track one address
                    </li>
                    <li>Never paste your seed phrase here – only public data</li>
                    <li>Mark wallets as active to display them on your public profile</li>
                  </ul>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-orange-600 hover:text-orange-700 text-xs font-medium">
                      Why use extended public keys?
                    </summary>
                    <p className="mt-2 text-xs text-gray-600 pl-4">
                      Bitcoin wallets generate new addresses after each transaction for privacy.
                      With an extended public key (xpub/ypub/zpub), we can automatically track all
                      these addresses and show your complete balance and transaction history. A
                      single address only shows transactions to that one address.
                    </p>
                  </details>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Mobile: Floating Help Button */}
        {focusedField && (
          <button
            onClick={() => setShowMobileGuidance(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Get help with this field"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        )}

        {/* Mobile: Guidance Modal */}
        {showMobileGuidance && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            onClick={() => setShowMobileGuidance(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Wallet Help & Guidance</h3>
                <button
                  onClick={() => setShowMobileGuidance(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <DynamicSidebar<NonNullable<WalletFieldType>>
                  activeField={focusedField}
                  guidanceContent={walletGuidanceContent}
                  defaultContent={walletDefaultContent}
                />
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Wallet Dialog */}
        <DuplicateWalletDialog
          isOpen={duplicateDialog.isOpen}
          onClose={handleCancelDuplicateWallet}
          onConfirm={handleConfirmDuplicateWallet}
          walletData={duplicateDialog.walletData}
          existingWallets={duplicateDialog.existingWallets || []}
        />
      </div>
    </div>
  );
}
