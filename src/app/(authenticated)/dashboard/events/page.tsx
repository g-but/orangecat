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
import { eventEntityConfig, type Event } from '@/config/entities/events';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

/**
 * Events Dashboard Page
 *
 * Manage your events - in-person gatherings and meetups with Bitcoin-powered ticketing.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial creation using modular EntityList pattern
 */
export default function EventsDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);

  const {
    items: events,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<Event>({
    apiEndpoint: eventEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading,
  });

  // Memoize events to prevent unnecessary re-renders
  const memoizedEvents = useMemo(() => events, [events]);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {return;}

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} event${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) {return;}

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async (id) => {
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete event ${id}`);
        }
        const result = await response.json().catch(() => ({}));
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      });

      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedIds.size} event${selectedIds.size > 1 ? 's' : ''}`);
      clearSelection();
      await refresh();
    } catch (error) {
      logger.error('Failed to delete events', { error }, 'EventsDashboardPage');
      toast.error('Failed to delete some events. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your events..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {memoizedEvents.length > 0 && (
        <Button
          onClick={() => setShowSelection(!showSelection)}
          variant="outline"
          size="sm"
        >
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button href={eventEntityConfig.createPath} className="bg-gradient-to-r from-blue-600 to-blue-700 w-full sm:w-auto">
        Create Event
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="My Events"
        description="Organize in-person gatherings and meetups with Bitcoin-powered ticketing"
        headerActions={headerActions}
      >
        {error ? (
          <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
        ) : (
          <>
            {showSelection && memoizedEvents.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === memoizedEvents.length && memoizedEvents.length > 0}
                    onChange={() => toggleSelectAll(memoizedEvents.map(e => e.id))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Select All</span>
                </label>
              </div>
            )}
            <EntityList
              items={memoizedEvents}
              isLoading={loading}
              makeHref={eventEntityConfig.makeHref}
              makeCardProps={eventEntityConfig.makeCardProps}
              emptyState={eventEntityConfig.emptyState}
              gridCols={eventEntityConfig.gridCols}
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
        entityNamePlural="Events"
      />
    </>
  );
}
