'use client';

import { Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  entityNamePlural?: string;
  additionalInfo?: React.ReactNode;
  className?: string;
}

/**
 * BulkActionsBar - Reusable bulk actions component for entity list pages
 * 
 * Displays a fixed bottom bar when items are selected, allowing bulk operations.
 * Used across all entity list pages (services, products, assets, etc.)
 */
export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  isDeleting = false,
  entityNamePlural = 'items',
  additionalInfo,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40',
        'pb-safe', // Safe area for mobile
        className
      )}
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
              {selectedCount} {entityNamePlural} selected
            </span>
            {additionalInfo && (
              <div className="flex-1 min-w-0">{additionalInfo}</div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              disabled={isDeleting}
            >
              Clear
            </button>
            <Button
              onClick={onDelete}
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
