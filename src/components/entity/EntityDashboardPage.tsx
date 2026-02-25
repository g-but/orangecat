'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { EntityConfig, BaseEntity } from '@/types/entity';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * EntityDashboardPage - Reusable dashboard page component for all entity types
 *
 * This component encapsulates the common pattern used across all entity dashboard pages:
 * - Authentication check
 * - Data fetching with pagination
 * - Bulk selection and deletion
 * - Individual item deletion via 3-dot menu
 * - Loading and empty states
 *
 * Created: 2025-01-03
 * Last Modified: 2025-01-03
 * Last Modified Summary: Initial creation for DRY entity dashboard pages
 */

interface EntityDashboardPageProps<T extends BaseEntity> {
  config: EntityConfig<T>;
  /** Page title (defaults to config.namePlural) */
  title?: string;
  /** Page description */
  description?: string;
  /** Loading message */
  loadingMessage?: string;
  /** Create button label (defaults to "Create {config.name}") */
  createButtonLabel?: string;
  /** Items per page */
  limit?: number;
  /** Optional content to render above the list (e.g., info banners) */
  headerContent?: ReactNode;
}

export default function EntityDashboardPage<T extends BaseEntity>({
  config,
  title,
  description,
  loadingMessage,
  createButtonLabel,
  limit = 12,
  headerContent,
}: EntityDashboardPageProps<T>) {
  const { user, isLoading: authLoading, hydrated } = useRequireAuth();
  const userCurrency = useUserCurrency();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

  const { items, loading, error, page, total, setPage, refresh } = useEntityList<T>({
    apiEndpoint: config.apiEndpoint,
    userId: user?.id,
    limit,
    enabled: !!user?.id && hydrated && !authLoading,
  });

  // Memoize items to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [items]);

  // Delete a single item
  const handleDeleteItem = useCallback(
    async (id: string) => {
      setDeletingIds(prev => new Set(prev).add(id));
      try {
        const response = await fetch(`${config.apiEndpoint}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete ${config.name}`);
        }
        toast.success(`${config.name} deleted successfully`);
        await refresh();
      } catch (error) {
        logger.error(`Failed to delete ${config.name}`, { error, id }, 'EntityDashboardPage');
        toast.error(`Failed to delete ${config.name}. Please try again.`);
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [config.apiEndpoint, config.name, refresh]
  );

  // Bulk delete selected items
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} ${selectedIds.size > 1 ? config.namePlural.toLowerCase() : config.name.toLowerCase()}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async id => {
        const response = await fetch(`${config.apiEndpoint}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete ${config.name} ${id}`);
        }
        return response.json().catch(() => ({}));
      });

      await Promise.all(deletePromises);
      toast.success(
        `Successfully deleted ${selectedIds.size} ${selectedIds.size > 1 ? config.namePlural.toLowerCase() : config.name.toLowerCase()}`
      );
      clearSelection();
      await refresh();
    } catch (error) {
      logger.error(`Failed to delete ${config.namePlural}`, { error }, 'EntityDashboardPage');
      toast.error(`Failed to delete some ${config.namePlural.toLowerCase()}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, config.apiEndpoint, config.name, config.namePlural, clearSelection, refresh]);

  // Loading state
  if (!hydrated || authLoading) {
    return (
      <Loading
        fullScreen
        message={loadingMessage || `Loading your ${config.namePlural.toLowerCase()}...`}
      />
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Determine color class based on theme
  const colorClass = {
    orange: 'bg-gradient-to-r from-orange-600 to-orange-700',
    blue: 'bg-gradient-to-r from-blue-600 to-blue-700',
    green: 'bg-gradient-to-r from-green-600 to-green-700',
    purple: 'bg-gradient-to-r from-purple-600 to-purple-700',
    tiffany: 'bg-gradient-to-r from-teal-500 to-teal-600',
  }[config.colorTheme || 'orange'];

  const headerActions = (
    <div className="flex items-center gap-2">
      {memoizedItems.length > 0 && (
        <Button onClick={() => setShowSelection(!showSelection)} variant="outline" size="sm">
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button href={config.createPath} className={`${colorClass} w-full sm:w-auto`}>
        {createButtonLabel || `Create ${config.name}`}
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title={title || `My ${config.namePlural}`}
        description={description}
        headerActions={headerActions}
      >
        {headerContent}
        {error ? (
          <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
        ) : (
          <>
            {showSelection && memoizedItems.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === memoizedItems.length && memoizedItems.length > 0}
                    onChange={() => toggleSelectAll(memoizedItems.map(item => item.id))}
                    className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Select All</span>
                </label>
              </div>
            )}
            <EntityList
              items={memoizedItems}
              isLoading={loading}
              makeHref={config.makeHref}
              makeCardProps={item => config.makeCardProps(item, userCurrency)}
              emptyState={config.emptyState}
              gridCols={config.gridCols}
              selectedIds={showSelection ? selectedIds : undefined}
              onToggleSelect={showSelection ? toggleSelect : undefined}
              showSelection={showSelection}
              onDeleteItem={handleDeleteItem}
              deletingIds={deletingIds}
            />
            <CommercePagination page={page} limit={limit} total={total} onPageChange={setPage} />
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
