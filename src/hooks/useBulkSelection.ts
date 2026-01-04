'use client';

import { useState, useCallback } from 'react';

/**
 * useBulkSelection - Reusable hook for managing bulk selection state
 * 
 * Used across all entity list pages for consistent bulk selection behavior
 */
export function useBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev => {
      // If all are selected, deselect all; otherwise select all
      const allSelected = allIds.length > 0 && allIds.every(id => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    setSelectedIds,
  };
}
