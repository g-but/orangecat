'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CreateAssetDialog as AssetForm } from './CreateAssetDialogForm';

interface CreateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetCreated?: () => void;
}

export function CreateAssetDialog({ open, onOpenChange, onAssetCreated }: CreateAssetDialogProps) {
  const handleAssetCreated = () => {
    toast.success('Asset created successfully!');
    onAssetCreated?.();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Asset for Collateral</DialogTitle>
          <DialogDescription>
            Quickly create an asset that you can use as collateral for your loan. You can edit these
            details later from the Assets page.
          </DialogDescription>
        </DialogHeader>

        <AssetForm onAssetCreated={handleAssetCreated} onCancel={handleClose} mode="quick" />
      </DialogContent>
    </Dialog>
  );
}
