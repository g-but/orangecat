'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { WalletManager } from '@/components/wallets/WalletManager';
import { DuplicateWalletDialog } from '@/components/wallets/DuplicateWalletDialog';
import type { WalletFieldType } from '@/lib/wallet-guidance';
import { useWallets } from './hooks/useWallets';
import { useWalletOperations } from './hooks/useWalletOperations';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { WalletsPageHeader } from './components/WalletsPageHeader';
import { WalletsHelpSection } from './components/WalletsHelpSection';
import { WalletsErrorState } from './components/WalletsErrorState';
import { WalletsGuidanceSidebar } from './components/WalletsGuidanceSidebar';
import { WalletsMobileGuidance } from './components/WalletsMobileGuidance';

/**
 * Dashboard Wallets Page
 *
 * Private page for users to manage their Bitcoin wallets.
 * Reuses WalletManager component following DRY principles.
 *
 * Single source of truth: WalletManager for all wallet operations
 * Separation of concerns: This page handles data fetching/API calls, WalletManager handles UI
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Refactored to use extracted hooks and components
 */
export default function DashboardWalletsPage() {
  const { user, profile, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<WalletFieldType>(null);
  const [showMobileGuidance, setShowMobileGuidance] = useState(false);

  // Custom hooks
  const { isDesktop } = useResponsiveLayout();
  const { wallets, isLoading, loadingError, refreshWallets } = useWallets({
    profileId: profile?.id,
    authLoading,
  });

  // We need to manage wallets state here to pass to the operations hook
  const [walletsState, setWalletsState] = useState(wallets);

  // Update local state when wallets change from the fetch hook
  useEffect(() => {
    setWalletsState(wallets);
  }, [wallets]);

  const {
    handleAddWallet,
    handleUpdateWallet,
    handleDeleteWallet,
    handleRefreshWallet,
    handleConfirmDuplicateWallet,
    handleCancelDuplicateWallet,
    duplicateDialog,
  } = useWalletOperations({
    userId: user?.id,
    profileId: profile?.id,
    setWallets: setWalletsState,
  });

  // Loading state with timeout protection
  if (authLoading || isLoading) {
    return <Loading message="Loading your wallets..." />;
  }

  if (!user) {
    return null;
  }

  // Show error state if loading failed
  if (loadingError && walletsState.length === 0) {
    return (
      <WalletsErrorState
        error={loadingError}
        onRetry={() => {
          refreshWallets();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <WalletsPageHeader isDesktop={isDesktop} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Desktop: Guidance Sidebar */}
          <WalletsGuidanceSidebar focusedField={focusedField} />

          {/* Main Content - Wallet Manager */}
          <div className="lg:col-span-7 lg:order-1 order-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <WalletManager
                wallets={walletsState}
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

            {/* Help Section */}
            <WalletsHelpSection isDesktop={isDesktop} />
          </div>
        </div>

        {/* Mobile Guidance */}
        <WalletsMobileGuidance
          focusedField={focusedField}
          showMobileGuidance={showMobileGuidance}
          onShowMobileGuidance={setShowMobileGuidance}
        />

        {/* Duplicate Wallet Dialog */}
        {duplicateDialog.walletData && (
          <DuplicateWalletDialog
            isOpen={duplicateDialog.isOpen}
            onClose={handleCancelDuplicateWallet}
            onConfirm={handleConfirmDuplicateWallet}
            walletData={duplicateDialog.walletData}
            existingWallets={duplicateDialog.existingWallets || []}
          />
        )}
      </div>
    </div>
  );
}
