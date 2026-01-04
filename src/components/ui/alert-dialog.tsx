'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * AlertDialog - A modal dialog for confirmations and alerts
 *
 * Uses the base Dialog component with alert-specific styling and semantics.
 *
 * Created: 2025-01-03
 * Last Modified: 2025-01-03
 * Last Modified Summary: Initial creation for entity card delete confirmations
 */

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn('sm:max-w-[425px]', className)}
    {...props}
  >
    {children}
  </DialogContent>
));
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = DialogHeader;
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = DialogFooter;
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = DialogTitle;
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = DialogDescription;
AlertDialogDescription.displayName = 'AlertDialogDescription';

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn('bg-red-600 hover:bg-red-700 text-white', className)}
      {...props}
    >
      {children}
    </Button>
  )
);
AlertDialogAction.displayName = 'AlertDialogAction';

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="outline"
      className={cn('', className)}
      {...props}
    >
      {children}
    </Button>
  )
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
