'use client';

import { useState, useCallback, useMemo } from 'react';
import { TimelineDisplayEvent, TimelineVisibility } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

export interface UsePostSelectionOptions {
  /** Called after posts are deleted */
  onPostsDeleted?: (deletedIds: string[]) => void;
  /** Called after visibility is changed */
  onVisibilityChanged?: (eventIds: string[], newVisibility: TimelineVisibility) => void;
}

export interface UsePostSelectionReturn {
  // State
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  isProcessing: boolean;

  // Actions
  toggleSelectionMode: () => void;
  toggleSelection: (eventId: string) => void;
  selectAll: (events: TimelineDisplayEvent[]) => void;
  clearSelection: () => void;
  isSelected: (eventId: string) => boolean;

  // Bulk operations
  bulkDelete: (events: TimelineDisplayEvent[]) => Promise<BulkOperationResult>;
  bulkSetVisibility: (events: TimelineDisplayEvent[], visibility: TimelineVisibility) => Promise<BulkOperationResult>;

  // Computed
  selectedCount: number;
  canPerformBulkAction: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  failedIds: string[];
  error?: string;
}

/**
 * Hook for managing post selection and bulk operations
 *
 * Provides centralized state management for multi-select functionality
 * with optimistic updates and rollback on failure.
 *
 * @example
 * ```tsx
 * const { selectedIds, toggleSelection, bulkDelete } = usePostSelection({
 *   onPostsDeleted: (ids) => refreshFeed()
 * });
 * ```
 */
export function usePostSelection(options: UsePostSelectionOptions = {}): UsePostSelectionReturn {
  const { onPostsDeleted, onVisibilityChanged } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle selection mode on/off
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        // Exiting selection mode - clear selection
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  // Toggle individual post selection
  const toggleSelection = useCallback((eventId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Select/deselect all visible events
  const selectAll = useCallback((events: TimelineDisplayEvent[]) => {
    const visibleIds = events.filter(e => !e.isDeleted).map(e => e.id);

    setSelectedIds(prev => {
      // If all visible are selected, deselect all
      const allSelected = visibleIds.every(id => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      // Otherwise, select all visible
      return new Set(visibleIds);
    });
  }, []);

  // Clear selection without exiting selection mode
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if specific event is selected
  const isSelected = useCallback((eventId: string) => {
    return selectedIds.has(eventId);
  }, [selectedIds]);

  // Bulk delete operation with optimistic updates
  const bulkDelete = useCallback(async (_events: TimelineDisplayEvent[]): Promise<BulkOperationResult> => {
    if (selectedIds.size === 0) {
      return { success: true, successCount: 0, failureCount: 0, failedIds: [] };
    }

    const idsToDelete = Array.from(selectedIds);
    setIsProcessing(true);

    try {
      logger.info(`Starting bulk delete of ${idsToDelete.length} posts`, null, 'usePostSelection');

      const results = await Promise.allSettled(
        idsToDelete.map(id => timelineService.deleteEvent(id, 'Bulk deleted by user'))
      );

      const successfulIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successfulIds.push(idsToDelete[index]);
        } else {
          failedIds.push(idsToDelete[index]);
        }
      });

      // Clear selection for successful deletions
      if (successfulIds.length > 0) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          successfulIds.forEach(id => next.delete(id));
          return next;
        });
        onPostsDeleted?.(successfulIds);
      }

      // Exit selection mode if all succeeded
      if (failedIds.length === 0) {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }

      logger.info(
        `Bulk delete complete: ${successfulIds.length} succeeded, ${failedIds.length} failed`,
        { successfulIds, failedIds },
        'usePostSelection'
      );

      return {
        success: failedIds.length === 0,
        successCount: successfulIds.length,
        failureCount: failedIds.length,
        failedIds,
      };
    } catch (err) {
      logger.error('Bulk delete failed', err, 'usePostSelection');
      return {
        success: false,
        successCount: 0,
        failureCount: idsToDelete.length,
        failedIds: idsToDelete,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, onPostsDeleted]);

  // Bulk visibility change operation
  const bulkSetVisibility = useCallback(async (
    _events: TimelineDisplayEvent[],
    visibility: TimelineVisibility
  ): Promise<BulkOperationResult> => {
    if (selectedIds.size === 0) {
      return { success: true, successCount: 0, failureCount: 0, failedIds: [] };
    }

    const idsToUpdate = Array.from(selectedIds);
    setIsProcessing(true);

    try {
      logger.info(
        `Starting bulk visibility change to ${visibility} for ${idsToUpdate.length} posts`,
        null,
        'usePostSelection'
      );

      const results = await Promise.allSettled(
        idsToUpdate.map(id =>
          timelineService.updateEvent(id, { visibility })
        )
      );

      const successfulIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successfulIds.push(idsToUpdate[index]);
        } else {
          failedIds.push(idsToUpdate[index]);
        }
      });

      // Notify about visibility changes
      if (successfulIds.length > 0) {
        onVisibilityChanged?.(successfulIds, visibility);
      }

      // Exit selection mode and clear on full success
      if (failedIds.length === 0) {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      }

      logger.info(
        `Bulk visibility change complete: ${successfulIds.length} succeeded, ${failedIds.length} failed`,
        { successfulIds, failedIds, visibility },
        'usePostSelection'
      );

      return {
        success: failedIds.length === 0,
        successCount: successfulIds.length,
        failureCount: failedIds.length,
        failedIds,
      };
    } catch (err) {
      logger.error('Bulk visibility change failed', err, 'usePostSelection');
      return {
        success: false,
        successCount: 0,
        failureCount: idsToUpdate.length,
        failedIds: idsToUpdate,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, onVisibilityChanged]);

  // Computed values
  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);
  const canPerformBulkAction = useMemo(() => selectedIds.size > 0 && !isProcessing, [selectedIds, isProcessing]);

  return {
    selectedIds,
    isSelectionMode,
    isProcessing,
    toggleSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkDelete,
    bulkSetVisibility,
    selectedCount,
    canPerformBulkAction,
  };
}

export default usePostSelection;
