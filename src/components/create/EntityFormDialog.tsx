'use client';

/**
 * ENTITY FORM DIALOG
 *
 * A responsive dialog/bottom-sheet wrapper around EntityForm.
 * Uses Dialog on desktop and BottomSheet on mobile for optimal UX.
 *
 * Replaces custom form dialogs (CreateGroupDialog, CreateEventDialog, etc.)
 * by delegating to EntityForm with the entity's existing config.
 *
 * Created: 2026-02-24
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import BottomSheet from '@/components/ui/BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

import { EntityForm } from './EntityForm';
import type { EntityConfig } from './types';

interface EntityFormDialogProps<T extends Record<string, unknown>> {
  config: EntityConfig<T>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: T & { id: string }) => void;
  mode?: 'create' | 'edit';
  entityId?: string;
  initialValues?: Partial<T>;
}

export function EntityFormDialog<T extends Record<string, unknown>>({
  config,
  open,
  onOpenChange,
  onSuccess,
  mode = 'create',
  entityId,
  initialValues,
}: EntityFormDialogProps<T>) {
  const isMobile = useIsMobile();

  const handleSuccess = (data: T & { id: string }) => {
    onOpenChange(false);
    onSuccess?.(data);
  };

  const formContent = (
    <EntityForm
      config={config}
      initialValues={initialValues}
      onSuccess={handleSuccess}
      mode={mode}
      entityId={entityId}
      embedded
    />
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title={mode === 'edit' ? `Edit ${config.name}` : config.formTitle}
        maxHeight="90vh"
      >
        {formContent}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? `Edit ${config.name}` : config.formTitle}</DialogTitle>
          <DialogDescription>{config.formDescription}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
