'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Lock, Loader2 } from 'lucide-react';
import { TimelineDisplayEvent, TimelineVisibility } from '@/types/timeline';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineDisplayEvent;
  onSave: (updates: {
    title: string;
    description: string;
    visibility: TimelineVisibility;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function EditPostModal({
  isOpen,
  onClose,
  event,
  onSave,
  isSaving = false,
}: EditPostModalProps) {
  const [content, setContent] = useState(event.description || event.title || '');
  const [visibility, setVisibility] = useState<TimelineVisibility>(event.visibility || 'public');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new event
  useEffect(() => {
    if (isOpen) {
      setContent(event.description || event.title || '');
      setVisibility(event.visibility || 'public');
      setError(null);
    }
  }, [isOpen, event]);

  // Lock body scroll when modal is open
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

  const handleSave = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Post content cannot be empty');
      return;
    }

    if (trimmedContent.length > 5000) {
      setError('Post content is too long (max 5000 characters)');
      return;
    }

    setError(null);

    try {
      const title =
        trimmedContent.length <= 120
          ? trimmedContent
          : `${trimmedContent.slice(0, 117).trimEnd()}...`;

      await onSave({
        title,
        description: trimmedContent,
        visibility,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const hasChanges =
    content.trim() !== (event.description || event.title || '').trim() ||
    visibility !== (event.visibility || 'public');

  const charCount = content.length;
  const maxChars = 5000;
  const isOverLimit = charCount > maxChars;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 -ml-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-[17px] font-bold text-gray-900">Edit post</h2>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || isOverLimit || !content.trim()}
            size="sm"
            className="rounded-full px-4 py-1.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Error message */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Textarea */}
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's happening?"
            className={cn(
              'min-h-[150px] text-[17px] leading-relaxed border-none bg-transparent p-0 focus:ring-0 resize-none placeholder:text-gray-500',
              isOverLimit && 'text-red-600'
            )}
            disabled={isSaving}
            autoFocus
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            {/* Visibility selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  visibility === 'public'
                    ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                )}
                disabled={isSaving}
              >
                {visibility === 'public' ? (
                  <>
                    <Globe className="w-4 h-4" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Private
                  </>
                )}
              </button>
            </div>

            {/* Character count */}
            <div
              className={cn('text-sm', isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400')}
            >
              {charCount.toLocaleString()} / {maxChars.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPostModal;
