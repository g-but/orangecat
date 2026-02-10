'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeletePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  postPreview?: string;
}

export function DeletePostDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  postPreview,
}: DeletePostDialogProps) {
  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      // Error handling is done in the parent component
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete post?</h2>

          {/* Description */}
          <p className="text-gray-600 text-center text-sm mb-2">
            This can&apos;t be undone and it will be removed from your profile, the timeline, and
            search results.
          </p>

          {/* Post preview */}
          {postPreview && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-700 text-sm line-clamp-3">{postPreview}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-6">
            <Button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>

            <Button
              onClick={onClose}
              disabled={isDeleting}
              variant="outline"
              className="w-full py-3 rounded-full font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeletePostDialog;
