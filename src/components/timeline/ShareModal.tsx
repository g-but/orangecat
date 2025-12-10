'use client';

import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (text: string) => Promise<void> | void;
  defaultText?: string;
  isSubmitting?: boolean;
}

export function ShareModal({ isOpen, onClose, onShare, defaultText = '', isSubmitting = false }: ShareModalProps) {
  const [text, setText] = useState(defaultText);

  useEffect(() => {
    if (isOpen) setText(defaultText);
  }, [isOpen, defaultText]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share Post">
      <div className="p-4 space-y-4">
        <label htmlFor="share-text" className="text-sm font-medium text-gray-700">
          Add a comment (optional)
        </label>
        <textarea
          id="share-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onShare(text);
            }
          }}
          rows={4}
          className="w-full border rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          maxLength={500}
          placeholder="Add context to your share..."
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => onShare(text)} isLoading={isSubmitting}>
            Share
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}

