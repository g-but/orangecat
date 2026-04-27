'use client';

import { useState, useCallback, useMemo } from 'react';
import { TimelineDisplayEvent, TimelineVisibility } from '@/types/timeline';
import { usePostSelectionBulk, type BulkOperationResult } from './usePostSelectionBulk';

export type { BulkOperationResult } from './usePostSelectionBulk';

export interface UsePostSelectionOptions {
  onPostsDeleted?: (deletedIds: string[]) => void;
  onVisibilityChanged?: (eventIds: string[], newVisibility: TimelineVisibility) => void;
}

export interface UsePostSelectionReturn {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  isProcessing: boolean;
  toggleSelectionMode: () => void;
  toggleSelection: (eventId: string) => void;
  selectAll: (events: TimelineDisplayEvent[]) => void;
  clearSelection: () => void;
  isSelected: (eventId: string) => boolean;
  bulkDelete: (events: TimelineDisplayEvent[]) => Promise<BulkOperationResult>;
  bulkSetVisibility: (
    events: TimelineDisplayEvent[],
    visibility: TimelineVisibility
  ) => Promise<BulkOperationResult>;
  selectedCount: number;
  canPerformBulkAction: boolean;
}

export function usePostSelection(options: UsePostSelectionOptions = {}): UsePostSelectionReturn {
  const { onPostsDeleted, onVisibilityChanged } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

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

  const selectAll = useCallback((events: TimelineDisplayEvent[]) => {
    const visibleIds = events.filter(e => !e.isDeleted).map(e => e.id);
    setSelectedIds(prev => {
      const allSelected = visibleIds.every(id => prev.has(id));
      return allSelected ? new Set() : new Set(visibleIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((eventId: string) => selectedIds.has(eventId), [selectedIds]);

  const { bulkDelete, bulkSetVisibility } = usePostSelectionBulk({
    selectedIds,
    setSelectedIds,
    setIsSelectionMode,
    setIsProcessing,
    onPostsDeleted,
    onVisibilityChanged,
  });

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);
  const canPerformBulkAction = useMemo(
    () => selectedIds.size > 0 && !isProcessing,
    [selectedIds, isProcessing]
  );

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
