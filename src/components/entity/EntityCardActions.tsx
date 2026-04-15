'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2, Eye, EyeOff, Rocket, Pause } from 'lucide-react';
import { ENTITY_STATUS } from '@/config/status-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EntityCardActionsProps {
  editUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
  isDeleting?: boolean;
  /** Whether entity is currently shown on profile */
  showOnProfile?: boolean;
  /** Callback to toggle profile visibility */
  onToggleVisibility?: () => void | Promise<void>;
  /** Whether visibility toggle is in progress */
  isTogglingVisibility?: boolean;
  /** Current entity status (for publish/pause actions) */
  entityStatus?: string;
  /** Callback to change entity status */
  onStatusChange?: (newStatus: string) => void | Promise<void>;
  /** Whether status change is in progress */
  isChangingStatus?: boolean;
}

export function EntityCardActions({
  editUrl,
  onEdit,
  onDelete,
  deleteConfirmTitle = 'Delete Item',
  deleteConfirmDescription = 'Are you sure you want to delete this item? This action cannot be undone.',
  isDeleting = false,
  showOnProfile,
  onToggleVisibility,
  isTogglingVisibility = false,
  entityStatus,
  onStatusChange,
  isChangingStatus = false,
}: EntityCardActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
    setShowDeleteDialog(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleVisibilityClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleVisibility) {
      await onToggleVisibility();
    }
  };

  const handleStatusClick = async (e: React.MouseEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onStatusChange) {
      await onStatusChange(newStatus);
    }
  };

  if (!editUrl && !onEdit && !onDelete && !onToggleVisibility && !onStatusChange) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={e => e.stopPropagation()}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(editUrl || onEdit) && (
            <DropdownMenuItem onClick={editUrl ? undefined : handleEditClick} asChild={!!editUrl}>
              {editUrl ? (
                <a href={editUrl} className="flex items-center">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </a>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </>
              )}
            </DropdownMenuItem>
          )}
          {onStatusChange && entityStatus === ENTITY_STATUS.DRAFT && (
            <DropdownMenuItem
              onClick={e => handleStatusClick(e, ENTITY_STATUS.ACTIVE)}
              disabled={isChangingStatus}
              className="text-green-600 focus:text-green-600 focus:bg-green-50"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {isChangingStatus ? 'Publishing...' : 'Publish'}
            </DropdownMenuItem>
          )}
          {onStatusChange && entityStatus === ENTITY_STATUS.ACTIVE && (
            <DropdownMenuItem
              onClick={e => handleStatusClick(e, ENTITY_STATUS.PAUSED)}
              disabled={isChangingStatus}
            >
              <Pause className="mr-2 h-4 w-4" />
              {isChangingStatus ? 'Pausing...' : 'Pause'}
            </DropdownMenuItem>
          )}
          {onStatusChange && entityStatus === ENTITY_STATUS.PAUSED && (
            <DropdownMenuItem
              onClick={e => handleStatusClick(e, ENTITY_STATUS.ACTIVE)}
              disabled={isChangingStatus}
              className="text-green-600 focus:text-green-600 focus:bg-green-50"
            >
              <Rocket className="mr-2 h-4 w-4" />
              {isChangingStatus ? 'Publishing...' : 'Resume'}
            </DropdownMenuItem>
          )}
          {onToggleVisibility && (
            <DropdownMenuItem
              onClick={handleVisibilityClick}
              disabled={isTogglingVisibility}
              className={showOnProfile === false ? 'text-gray-500' : ''}
            >
              {showOnProfile === false ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {isTogglingVisibility ? 'Updating...' : 'Show on Profile'}
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  {isTogglingVisibility ? 'Updating...' : 'Hide from Profile'}
                </>
              )}
            </DropdownMenuItem>
          )}
          {onDelete && (editUrl || onEdit || onToggleVisibility) && <DropdownMenuSeparator />}
          {onDelete && (
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
