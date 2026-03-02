'use client';

import { useMemo, useState } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { investmentEntityConfig } from '@/config/entities/investments';
import { Investment } from '@/types/investments';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Search } from 'lucide-react';

/**
 * Investments Dashboard Page
 */
export default function InvestmentsPage() {
  const { user, isLoading, hydrated } = useRequireAuth();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-investments' | 'open'>('my-investments');

  const {
    items: myInvestments,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<Investment>({
    apiEndpoint: '/api/investments',
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'my-investments',
  });

  const {
    items: openInvestments,
    loading: openLoading,
    page: openPage,
    total: openTotal,
    setPage: setOpenPage,
  } = useEntityList<Investment>({
    apiEndpoint: '/api/investments?public=true',
    limit: 12,
    enabled: hydrated && !isLoading && activeTab === 'open',
  });

  const memoizedInvestments = useMemo(() => myInvestments, [myInvestments]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} investment${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async id => {
        const response = await fetch(`/api/investments/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete investment ${id}`);
        }
        return response.json().catch(() => ({}));
      });

      await Promise.all(deletePromises);
      toast.success(
        `Successfully deleted ${selectedIds.size} investment${selectedIds.size > 1 ? 's' : ''}`
      );
      clearSelection();
      await refresh();
    } catch (error) {
      logger.error('Failed to delete investments', { error }, 'InvestmentsPage');
      toast.error('Failed to delete some investments. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your investments..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'my-investments' && memoizedInvestments.length > 0 && (
        <Button onClick={() => setShowSelection(!showSelection)} variant="outline" size="sm">
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button
        href={investmentEntityConfig.createPath}
        className="bg-gradient-to-r from-green-600 to-green-700 w-full sm:w-auto"
      >
        Create Investment
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="Investments"
        description="Create investment opportunities and manage structured deals"
        headerActions={headerActions}
      >
        <Tabs
          value={activeTab}
          onValueChange={v => {
            setActiveTab(v as typeof activeTab);
            if (v !== 'my-investments') {
              clearSelection();
              setShowSelection(false);
            }
          }}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-investments" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">My Investments</span>
              <span className="sm:hidden">Mine</span>
              {memoizedInvestments.length > 0 && (
                <span className="ml-1 text-xs">({memoizedInvestments.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Open Opportunities</span>
              <span className="sm:hidden">Browse</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-investments" className="space-y-6">
            {error ? (
              <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
            ) : (
              <>
                {showSelection && memoizedInvestments.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === memoizedInvestments.length &&
                          memoizedInvestments.length > 0
                        }
                        onChange={() => toggleSelectAll(memoizedInvestments.map(i => i.id))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                )}
                <EntityList
                  items={memoizedInvestments}
                  isLoading={loading}
                  makeHref={investmentEntityConfig.makeHref}
                  makeCardProps={investmentEntityConfig.makeCardProps}
                  emptyState={investmentEntityConfig.emptyState}
                  gridCols={investmentEntityConfig.gridCols}
                  selectedIds={showSelection ? selectedIds : undefined}
                  onToggleSelect={showSelection ? toggleSelect : undefined}
                  showSelection={showSelection}
                />
                <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
              </>
            )}
          </TabsContent>

          <TabsContent value="open" className="space-y-6">
            {openInvestments.length > 0 || openLoading ? (
              <>
                <EntityList
                  items={openInvestments}
                  isLoading={openLoading}
                  makeHref={investmentEntityConfig.makeHref}
                  makeCardProps={investmentEntityConfig.makeCardProps}
                  emptyState={{
                    title: 'No open opportunities',
                    description: 'Check back later for investment opportunities',
                  }}
                  gridCols={investmentEntityConfig.gridCols}
                />
                <CommercePagination
                  page={openPage}
                  limit={12}
                  total={openTotal}
                  onPageChange={setOpenPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No open opportunities</h3>
                <p className="text-muted-foreground">
                  Check back later for investment opportunities from the community
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </EntityListShell>

      {activeTab === 'my-investments' && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          onClearSelection={() => {
            clearSelection();
            setShowSelection(false);
          }}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
          entityNamePlural="investments"
        />
      )}
    </>
  );
}
