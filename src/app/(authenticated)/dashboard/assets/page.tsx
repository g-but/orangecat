'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { assetEntityConfig } from '@/config/entities/assets';
import type { Asset } from '@/types/asset';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Assets Page
 *
 * Following Engineering Principles:
 * - DRY: Uses shared EntityListShell, EntityList, useEntityList
 * - SSOT: Config from assetEntityConfig
 * - Consistency: Same pattern as services, products, causes
 * - Path: Moved to /dashboard/assets for consistency
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-30
 * Last Modified Summary: Moved to /dashboard/assets for path consistency
 */
export default function AssetsPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);

  const {
    items: assets,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<Asset>({
    apiEndpoint: assetEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading,
  });

  // Memoize assets to prevent unnecessary re-renders
  const memoizedAssets = useMemo(() => assets, [assets]);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {return;}

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} asset${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) {return;}

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async (id) => {
        const response = await fetch(`/api/assets/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete asset ${id}`);
        }
        const result = await response.json().catch(() => ({}));
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      });

      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedIds.size} asset${selectedIds.size > 1 ? 's' : ''}`);
      clearSelection();
      await refresh();
    } catch (error) {
      logger.error('Failed to delete assets', { error }, 'AssetsPage');
      toast.error('Failed to delete some assets. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your assets..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {memoizedAssets.length > 0 && (
        <Button
          onClick={() => setShowSelection(!showSelection)}
          variant="outline"
          size="sm"
        >
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button href={assetEntityConfig.createPath} className="bg-gradient-to-r from-green-600 to-green-700 w-full sm:w-auto">
        Add Asset
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="My Assets"
        description="Manage your assets and use them as collateral for loans"
        headerActions={headerActions}
      >
        {error ? (
          <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
        ) : (
          <>
            {showSelection && memoizedAssets.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === memoizedAssets.length && memoizedAssets.length > 0}
                    onChange={() => toggleSelectAll(memoizedAssets.map(a => a.id))}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Select All</span>
                </label>
              </div>
            )}
            <EntityList
              items={memoizedAssets}
              isLoading={loading}
              makeHref={assetEntityConfig.makeHref}
              makeCardProps={assetEntityConfig.makeCardProps}
              emptyState={assetEntityConfig.emptyState}
              gridCols={assetEntityConfig.gridCols}
              selectedIds={showSelection ? selectedIds : undefined}
              onToggleSelect={showSelection ? toggleSelect : undefined}
              showSelection={showSelection}
            />
            <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
          </>
        )}
      </EntityListShell>
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => {
          clearSelection();
          setShowSelection(false);
        }}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
