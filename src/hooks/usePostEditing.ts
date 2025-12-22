'use client';

import { useState, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export interface UsePostEditingProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onDelete?: () => void;
}

export interface UsePostEditingReturn {
  // Menu state
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;

  // Edit modal state
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;

  // Delete confirmation state
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;

  // Edit form state
  editTitle: string;
  setEditTitle: (title: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  editVisibility: 'public' | 'private';
  setEditVisibility: (visibility: 'public' | 'private') => void;

  // Loading states
  isEditing: boolean;
  isDeleting: boolean;

  // Actions
  handleEdit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  startEditing: () => void;
  cancelEditing: () => void;
}

export function usePostEditing({
  event,
  onUpdate,
  onDelete,
}: UsePostEditingProps): UsePostEditingReturn {
  const { user } = useAuth();

  // Menu state
  const [showMenu, setShowMenu] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description || '');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>(
    event.visibility || 'public'
  );

  // Loading states
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can edit this post
  const canEdit = user?.id === event.actor.id;

  // Start editing
  const startEditing = useCallback(() => {
    if (!canEdit) {
      return;
    }

    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditVisibility(event.visibility || 'public');
    setShowEditModal(true);
    setShowMenu(false);
  }, [canEdit, event.title, event.description, event.visibility]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setShowEditModal(false);
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditVisibility(event.visibility || 'public');
  }, [event.title, event.description, event.visibility]);

  // Handle edit submission
  const handleEdit = useCallback(async () => {
    if (isEditing || !canEdit) {
      return;
    }

    setIsEditing(true);
    try {
      const result = await timelineService.updateEvent(event.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        visibility: editVisibility,
      });

      if (result.success) {
        onUpdate({
          title: editTitle.trim(),
          description: editDescription.trim(),
          visibility: editVisibility,
        });
        setShowEditModal(false);
        logger.info('Successfully updated event', null, 'usePostEditing');
      } else {
        throw new Error(result.error || 'Failed to update post');
      }
    } catch (error) {
      logger.error('Failed to update event', error, 'usePostEditing');
      throw error;
    } finally {
      setIsEditing(false);
    }
  }, [event.id, editTitle, editDescription, editVisibility, isEditing, canEdit, onUpdate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (isDeleting || !canEdit) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await timelineService.deleteEvent(event.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        setShowMenu(false);
        onDelete?.();
        logger.info('Successfully deleted event', null, 'usePostEditing');
      } else {
        throw new Error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      logger.error('Failed to delete event', error, 'usePostEditing');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [event.id, isDeleting, canEdit, onDelete]);

  return {
    // Menu state
    showMenu,
    setShowMenu,

    // Edit modal state
    showEditModal,
    setShowEditModal,

    // Delete confirmation state
    showDeleteConfirm,
    setShowDeleteConfirm,

    // Edit form state
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editVisibility,
    setEditVisibility,

    // Loading states
    isEditing,
    isDeleting,

    // Actions
    handleEdit,
    handleDelete,
    startEditing,
    cancelEditing,
  };
}
