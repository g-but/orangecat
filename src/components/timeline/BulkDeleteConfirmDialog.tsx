'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TIMELINE_SURFACE } from '@/config/timeline';

interface BulkDeleteConfirmDialogProps {
  count: number;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation for deleting several posts at once.
 *
 * Lifted out of TimelineComponent, which was doing feed state, selection,
 * infinite scroll AND this modal. Deleting is the one irreversible thing the
 * timeline offers, so its wording lives in one place rather than inline among
 * the scroll sentinel and the empty state.
 */
export const BulkDeleteConfirmDialog: React.FC<BulkDeleteConfirmDialogProps> = ({
  count,
  isProcessing,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-page/80 backdrop-blur-sm">
    <Card className="mx-4 w-full max-w-md rounded-md border-subtle bg-surface-page">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-status-negative/20 bg-status-negative/10">
            <Trash2 className="w-6 h-6 text-status-negative" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Delete {count} {count === 1 ? 'post' : 'posts'}?
            </h2>
            <p className="text-sm text-fg-secondary">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-fg-primary mb-6">
          Are you sure you want to delete {count === 1 ? 'this post' : 'these posts'}?
          {count > 1 && ' They will be'} permanently removed from your timeline.
        </p>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className={TIMELINE_SURFACE.chip}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BulkDeleteConfirmDialog;
