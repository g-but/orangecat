/**
 * Message Context Menu Component
 *
 * X-style context menu that appears on tap-and-hold (mobile) or right-click (desktop)
 * Provides actions for editing and deleting messages
 *
 * Created: 2025-12-12
 * Last Modified: 2025-12-12
 * Last Modified Summary: Created X-style message context menu for tap-and-hold functionality
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * X-style context menu for message actions
 * Appears on tap-and-hold (mobile) or right-click (desktop)
 */
export function MessageContextMenu({
  isOpen,
  position,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Add listeners with slight delay to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) {
      return;
    }

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    // Adjust horizontal position
    if (adjustedX + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // Adjust vertical position
    if (adjustedY + rect.height > viewportHeight) {
      adjustedY = position.y - rect.height - 10;
    }
    if (adjustedY < 10) {
      adjustedY = 10;
    }

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [isOpen, position]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} onTouchStart={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className={cn(
          'fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200',
          'min-w-[160px] py-1',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
        style={{
          left: position.x,
          top: position.y,
        }}
        role="menu"
        aria-label="Message actions"
      >
        {canEdit && (
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit();
              onClose();
            }}
            className={cn(
              'w-full px-4 py-2.5 text-left text-sm text-gray-700',
              'hover:bg-gray-50 active:bg-gray-100',
              'flex items-center gap-3 transition-colors'
            )}
            role="menuitem"
          >
            <Edit className="w-4 h-4 text-gray-500" />
            <span>Edit</span>
          </button>
        )}

        {canDelete && (
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete();
              onClose();
            }}
            className={cn(
              'w-full px-4 py-2.5 text-left text-sm text-red-600',
              'hover:bg-red-50 active:bg-red-100',
              'flex items-center gap-3 transition-colors'
            )}
            role="menuitem"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Delete</span>
          </button>
        )}

        {/* Close button (mobile) */}
        <div className="border-t border-gray-100 mt-1 pt-1 md:hidden">
          <button
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className={cn(
              'w-full px-4 py-2.5 text-center text-sm text-gray-500',
              'hover:bg-gray-50 active:bg-gray-100',
              'flex items-center justify-center gap-2 transition-colors'
            )}
            role="menuitem"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </>
  );
}
