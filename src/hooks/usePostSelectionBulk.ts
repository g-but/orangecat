'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { TimelineDisplayEvent, TimelineVisibility } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  failedIds: string[];
  error?: string;
}

interface BulkProps {
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setIsSelectionMode: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  onPostsDeleted?: (deletedIds: string[]) => void;
  onVisibilityChanged?: (eventIds: string[], newVisibility: TimelineVisibility) => void;
}

export interface UsePostSelectionBulkReturn {
  bulkDelete: (events: TimelineDisplayEvent[]) => Promise<BulkOperationResult>;
  bulkSetVisibility: (
    events: TimelineDisplayEvent[],
    visibility: TimelineVisibility
  ) => Promise<BulkOperationResult>;
}

async function runBulkOperation<T>(
  ids: string[],
  setIsProcessing: Dispatch<SetStateAction<boolean>>,
  operationFn: (id: string) => Promise<T>,
  isSuccess: (result: T) => boolean
): Promise<{ successfulIds: string[]; failedIds: string[] }> {
  setIsProcessing(true);
  try {
    const results = await Promise.allSettled(ids.map(operationFn));
    const successfulIds: string[] = [];
    const failedIds: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && isSuccess(result.value)) {
        successfulIds.push(ids[index]);
      } else {
        failedIds.push(ids[index]);
      }
    });
    return { successfulIds, failedIds };
  } finally {
    setIsProcessing(false);
  }
}

export function usePostSelectionBulk({
  selectedIds,
  setSelectedIds,
  setIsSelectionMode,
  setIsProcessing,
  onPostsDeleted,
  onVisibilityChanged,
}: BulkProps): UsePostSelectionBulkReturn {
  const bulkDelete = useCallback(
    async (_events: TimelineDisplayEvent[]): Promise<BulkOperationResult> => {
      if (selectedIds.size === 0) {
        return { success: true, successCount: 0, failureCount: 0, failedIds: [] };
      }

      const idsToDelete = Array.from(selectedIds);
      logger.info(`Starting bulk delete of ${idsToDelete.length} posts`, null, 'usePostSelection');

      try {
        const { successfulIds, failedIds } = await runBulkOperation(
          idsToDelete,
          setIsProcessing,
          id => timelineService.deleteEvent(id, 'Bulk deleted by user'),
          result => !!result
        );

        if (successfulIds.length > 0) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            successfulIds.forEach(id => next.delete(id));
            return next;
          });
          onPostsDeleted?.(successfulIds);
        }

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
      }
    },
    [selectedIds, setSelectedIds, setIsSelectionMode, setIsProcessing, onPostsDeleted]
  );

  const bulkSetVisibility = useCallback(
    async (
      _events: TimelineDisplayEvent[],
      visibility: TimelineVisibility
    ): Promise<BulkOperationResult> => {
      if (selectedIds.size === 0) {
        return { success: true, successCount: 0, failureCount: 0, failedIds: [] };
      }

      const idsToUpdate = Array.from(selectedIds);
      logger.info(
        `Starting bulk visibility change to ${visibility} for ${idsToUpdate.length} posts`,
        null,
        'usePostSelection'
      );

      try {
        const { successfulIds, failedIds } = await runBulkOperation(
          idsToUpdate,
          setIsProcessing,
          id => timelineService.updateEvent(id, { visibility }),
          result => result.success
        );

        if (successfulIds.length > 0) {
          onVisibilityChanged?.(successfulIds, visibility);
        }

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
      }
    },
    [selectedIds, setSelectedIds, setIsSelectionMode, setIsProcessing, onVisibilityChanged]
  );

  return { bulkDelete, bulkSetVisibility };
}
