'use client';

import React, { useState } from 'react';
import { X, Trash2, Globe, Lock, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TimelineVisibility } from '@/types/timeline';
import { cn } from '@/lib/utils';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  isProcessing: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onExitSelectionMode: () => void;
  onBulkDelete: () => void;
  onBulkVisibilityChange: (visibility: TimelineVisibility) => void;
  className?: string;
}

/**
 * Sticky toolbar for bulk post actions
 *
 * Appears when posts are selected, providing actions for:
 * - Select/Deselect all
 * - Bulk delete
 * - Bulk visibility change (public/private)
 *
 * Designed to integrate with the timeline's sticky header area
 */
export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  isProcessing,
  onSelectAll,
  onClearSelection: _onClearSelection,
  onExitSelectionMode,
  onBulkDelete,
  onBulkVisibilityChange,
  className,
}: BulkActionsToolbarProps) {
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const allSelected = selectedCount === totalCount && totalCount > 0;
  const hasSelection = selectedCount > 0;

  return (
    <div
      className={cn(
        'sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200',
        'px-4 py-2.5 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Selection status and controls */}
        <div className="flex items-center gap-3">
          {/* Select all toggle */}
          <button
            onClick={onSelectAll}
            disabled={isProcessing}
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
              allSelected ? 'text-sky-600' : 'text-gray-600'
            )}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span className="hidden sm:inline">{allSelected ? 'Deselect all' : 'Select all'}</span>
          </button>

          {/* Selection count */}
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{selectedCount}</span>
            <span className="hidden sm:inline"> of {totalCount}</span>
            <span className="sm:hidden">/{totalCount}</span>
            <span className="ml-1">{selectedCount === 1 ? 'post' : 'posts'}</span>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* Visibility dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisibilityMenu(prev => !prev)}
              disabled={!hasSelection || isProcessing}
              className="gap-1.5 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Visibility</span>
            </Button>

            {showVisibilityMenu && (
              <>
                {/* Backdrop to close menu */}
                <div className="fixed inset-0 z-40" onClick={() => setShowVisibilityMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      onBulkVisibilityChange('public');
                      setShowVisibilityMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Globe className="w-4 h-4 text-green-600" />
                    <span>Make Public</span>
                  </button>
                  <button
                    onClick={() => {
                      onBulkVisibilityChange('private');
                      setShowVisibilityMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Lock className="w-4 h-4 text-gray-600" />
                    <span>Make Private</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            disabled={!hasSelection || isProcessing}
            className="gap-1.5 text-sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">{selectedCount > 0 ? selectedCount : ''}</span>
          </Button>

          {/* Exit selection mode */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitSelectionMode}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Exit selection mode"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionsToolbar;
