'use client';

import Link from 'next/link';
import { MessageSquare, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEntitiesForCreateMenu,
  COLOR_CLASSES,
  type EntityMetadata,
  type EntityCategory,
} from '@/config/entity-registry';

interface CreateOption {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: EntityCategory | 'content';
}

/**
 * Generate create options from entity registry (SSOT)
 * Post is added as a special case since it's content, not a structured entity
 */
function generateCreateOptions(): CreateOption[] {
  const postOption: CreateOption = {
    name: 'Post',
    description: 'Share an update on your timeline',
    href: '/timeline?compose=true',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'content',
  };

  const entityOptions: CreateOption[] = getEntitiesForCreateMenu().map((entity: EntityMetadata) => {
    const colors = COLOR_CLASSES[entity.colorTheme];
    return {
      name: entity.name,
      description: entity.createActionLabel,
      href: entity.createPath,
      icon: entity.icon,
      color: colors.text,
      bgColor: colors.bg,
      category: entity.category,
    };
  });

  return [postOption, ...entityOptions];
}

// Generate options once (they don't change at runtime)
const CREATE_OPTIONS = generateCreateOptions();

interface MobileCreateSheetProps {
  /** Whether the sheet is visible */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Optional callback when an option is selected (before navigation) */
  onSelect?: (option: CreateOption) => void;
}

/**
 * Mobile Create Sheet
 *
 * A bottom sheet that displays all create options for mobile users.
 * Used by MobileBottomNav when the "+" button triggers a menu.
 * Reusable component extracted from SmartCreateButton's MobileCreateButton.
 */
export function MobileCreateSheet({ isOpen, onClose, onSelect }: MobileCreateSheetProps) {
  if (!isOpen) {
    return null;
  }

  const handleSelect = (option: CreateOption) => {
    onSelect?.(option);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* Handle indicator */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2">Create New</h3>

        {/* Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CREATE_OPTIONS.map(option => (
            <Link
              key={option.name}
              href={option.href}
              onClick={() => handleSelect(option)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 active:bg-orange-100 transition-colors touch-manipulation"
            >
              <div className={cn('p-2.5 rounded-xl', option.bgColor)}>
                <option.icon className={cn('w-5 h-5', option.color)} />
              </div>
              <span className="text-xs font-medium text-gray-900 text-center">{option.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobileCreateSheet;
