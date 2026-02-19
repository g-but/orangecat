'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { loanEntityConfig } from '@/config/entities/loans';
import { Loan, LoanOffer } from '@/types/loans';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Target, TrendingUp } from 'lucide-react';
import { AvailableLoans } from '@/components/loans/AvailableLoans';
import { LoanOffersList } from '@/components/loans/LoanOffersList';
import { CreateLoanDialog } from '@/components/loans/CreateLoanDialog';
import loansService from '@/services/loans';

/**
 * Loans Dashboard Page
 *
 * Refactored to use modular entity components for consistency with other entity pages.
 * Maintains tabs functionality (My Loans, Available Loans, My Offers) while using
 * EntityListShell and EntityList for the "My Loans" tab.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-12-31
 * Last Modified Summary: Refactored to use modular EntityList pattern, removed non-actionable stats cards
 */
export default function LoansPage() {
  const { user, isLoading, hydrated } = useRequireAuth();
  const _router = useRouter();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-loans' | 'available' | 'offers'>('my-loans');
  const [myOffers, setMyOffers] = useState<LoanOffer[]>([]);
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const availablePageSize = 12;

  const {
    items: myLoans,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<Loan>({
    apiEndpoint: '/api/loans',
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'my-loans',
  });

  // Memoize loans to prevent unnecessary re-renders
  const memoizedLoans = useMemo(() => myLoans, [myLoans]);

  const loadOffers = useCallback(async () => {
    try {
      const offersResult = await loansService.getUserOffers();
      if (offersResult.success) {
        setMyOffers(offersResult.offers || []);
      }
    } catch (error) {
      logger.error('Failed to load offers', { error }, 'LoansPage');
    }
  }, []);

  const loadAvailableLoans = useCallback(async () => {
    try {
      const availableResult = await loansService.getAvailableLoans(undefined, {
        pageSize: availablePageSize,
        offset: (availablePage - 1) * availablePageSize,
      });
      if (availableResult.success) {
        setAvailableLoans(availableResult.loans || []);
        setAvailableTotal(availableResult.total || 0);
      }
    } catch (error) {
      logger.error('Failed to load available loans', { error }, 'LoansPage');
    }
  }, [availablePage, availablePageSize]);

  // Load offers and available loans when their tabs are active
  useEffect(() => {
    if (activeTab === 'offers' && user?.id) {
      loadOffers();
    }
    if (activeTab === 'available' && user?.id) {
      loadAvailableLoans();
    }
  }, [activeTab, user?.id, loadOffers, loadAvailableLoans]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} loan${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async id => {
        const response = await fetch(`/api/loans/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete loan ${id}`);
        }
        const result = await response.json().catch(() => ({}));
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      });

      await Promise.all(deletePromises);
      toast.success(
        `Successfully deleted ${selectedIds.size} loan${selectedIds.size > 1 ? 's' : ''}`
      );
      clearSelection();
      await refresh();
    } catch (error) {
      logger.error('Failed to delete loans', { error }, 'LoansPage');
      toast.error('Failed to delete some loans. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoanCreated = () => {
    setCreateDialogOpen(false);
    refresh();
    loadOffers();
    loadAvailableLoans();
    toast.success('Loan created successfully!');
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your loans..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'my-loans' && memoizedLoans.length > 0 && (
        <Button onClick={() => setShowSelection(!showSelection)} variant="outline" size="sm">
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button
        href={loanEntityConfig.createPath}
        className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 w-full sm:w-auto"
      >
        Add Loan
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="My Loans"
        description="Manage your loans, discover refinancing opportunities, and participate in peer-to-peer lending"
        headerActions={headerActions}
      >
        <Tabs
          value={activeTab}
          onValueChange={v => {
            setActiveTab(v as typeof activeTab);
            // Clear selection when switching tabs
            if (v !== 'my-loans') {
              clearSelection();
              setShowSelection(false);
            }
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-loans" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">My Loans</span>
              <span className="sm:hidden">Mine</span>
              {memoizedLoans.length > 0 && (
                <span className="ml-1 text-xs">({memoizedLoans.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Available</span>
              <span className="sm:hidden">Browse</span>
              {availableLoans.length > 0 && (
                <span className="ml-1 text-xs">({availableLoans.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">My Offers</span>
              <span className="sm:hidden">Offers</span>
              {myOffers.length > 0 && <span className="ml-1 text-xs">({myOffers.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-loans" className="space-y-6">
            {error ? (
              <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
            ) : (
              <>
                {showSelection && memoizedLoans.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === memoizedLoans.length && memoizedLoans.length > 0
                        }
                        onChange={() => toggleSelectAll(memoizedLoans.map(l => l.id))}
                        className="h-4 w-4 rounded border-gray-300 text-tiffany-600 focus:ring-tiffany-500"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                )}
                <EntityList
                  items={memoizedLoans}
                  isLoading={loading}
                  makeHref={loanEntityConfig.makeHref}
                  makeCardProps={loanEntityConfig.makeCardProps}
                  emptyState={loanEntityConfig.emptyState}
                  gridCols={loanEntityConfig.gridCols}
                  selectedIds={showSelection ? selectedIds : undefined}
                  onToggleSelect={showSelection ? toggleSelect : undefined}
                  showSelection={showSelection}
                />
                <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
              </>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            {availableLoans.length > 0 ? (
              <>
                <AvailableLoans
                  loans={availableLoans}
                  onOfferMade={() => {
                    loadAvailableLoans();
                    loadOffers();
                  }}
                />
                <CommercePagination
                  page={availablePage}
                  limit={availablePageSize}
                  total={availableTotal}
                  onPageChange={setAvailablePage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No loans available</h3>
                <p className="text-muted-foreground">
                  Check back later for community loan listings
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            {myOffers.length > 0 ? (
              <LoanOffersList offers={myOffers} onOfferUpdated={loadOffers} />
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No offers made yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available loans to make your first refinancing offer
                </p>
                <Button onClick={() => setActiveTab('available')} variant="outline">
                  Browse Available Loans
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </EntityListShell>

      {activeTab === 'my-loans' && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => {
            clearSelection();
            setShowSelection(false);
          }}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
          entityNamePlural="loans"
        />
      )}

      <CreateLoanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLoanCreated={handleLoanCreated}
      />
    </>
  );
}
