/**
 * ComposerShared - Shared Components for Post Composers
 *
 * SSOT for reusable UI pieces used by both TimelineComposer and PostComposerMobile.
 * Follows DRY principle by extracting duplicated rendering logic.
 *
 * Used by:
 * - TimelineComposer (inline posting)
 * - PostComposerMobile (fullscreen/modal posting)
 */

'use client';

import React from 'react';
import { Bold, Italic, X, FolderPlus, WifiOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================

export interface Project {
  id: string;
  title: string;
}

// ==================== TEXT FORMAT TOOLBAR ====================

export interface TextFormatToolbarProps {
  onFormat: (format: 'bold' | 'italic') => void;
  variant?: 'sky' | 'orange';
  size?: 'sm' | 'md';
}

/**
 * Toolbar for applying text formatting (bold/italic)
 */
export function TextFormatToolbar({
  onFormat,
  variant = 'sky',
  size = 'sm',
}: TextFormatToolbarProps) {
  const baseClasses = cn(
    'flex items-center justify-center rounded-full transition-colors',
    size === 'sm' ? 'h-9 w-9' : 'p-2 min-h-[44px] min-w-[44px]'
  );

  const colorClasses =
    variant === 'sky'
      ? 'text-sky-600 hover:bg-sky-50 active:bg-sky-100'
      : 'text-orange-500 hover:bg-orange-50';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onFormat('bold')}
        className={cn(baseClasses, colorClasses)}
        title="Bold (Ctrl+B)"
        aria-label="Make text bold"
      >
        <Bold className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
      <button
        type="button"
        onClick={() => onFormat('italic')}
        className={cn(baseClasses, colorClasses)}
        title="Italic (Ctrl+I)"
        aria-label="Make text italic"
      >
        <Italic className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
      </button>
    </div>
  );
}

// ==================== PROJECT SELECTION PANEL ====================

export interface ProjectSelectionPanelProps {
  projects: Project[];
  selectedProjects: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  isPosting: boolean;
  variant?: 'orange' | 'default';
}

/**
 * Collapsible panel for selecting projects to cross-post
 */
export function ProjectSelectionPanel({
  projects,
  selectedProjects,
  onToggle,
  onClose,
  isPosting,
  variant = 'orange',
}: ProjectSelectionPanelProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-orange-50/50 rounded-xl border border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
          Cross-post to Projects
        </span>
        <button
          onClick={onClose}
          className="text-orange-400 hover:text-orange-600 active:text-orange-700 transition-colors p-2 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full touch-manipulation"
          aria-label="Close project selection"
        >
          <X className="w-4 h-4 sm:w-3 sm:h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {projects.map(project => (
          <button
            key={project.id}
            type="button"
            onClick={() => onToggle(project.id)}
            disabled={isPosting}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full border transition-all',
              selectedProjects.includes(project.id)
                ? variant === 'orange'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            )}
          >
            {project.title}
          </button>
        ))}
      </div>
      {selectedProjects.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          This post will appear on {selectedProjects.length} project timeline
          {selectedProjects.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// ==================== PROJECT TOGGLE BUTTON ====================

export interface ProjectToggleButtonProps {
  showProjects: boolean;
  selectedCount: number;
  onToggle: () => void;
  variant?: 'sky' | 'orange';
}

/**
 * Button to toggle project selection panel
 */
export function ProjectToggleButton({
  showProjects,
  selectedCount,
  onToggle,
  variant = 'sky',
}: ProjectToggleButtonProps) {
  const isActive = showProjects || selectedCount > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'h-9 w-9 flex items-center justify-center rounded-full transition-colors touch-manipulation',
        isActive
          ? variant === 'sky'
            ? 'text-sky-700 bg-sky-50'
            : 'text-orange-700 bg-orange-50'
          : variant === 'sky'
            ? 'text-sky-600 hover:bg-sky-50 active:bg-sky-100'
            : 'text-orange-600 hover:bg-orange-50 active:bg-orange-100'
      )}
      title="Cross-post to projects"
      aria-label="Toggle project selection"
    >
      <FolderPlus className="w-4 h-4" />
    </button>
  );
}

// ==================== COMPOSER MESSAGES ====================

export interface ComposerMessagesProps {
  error?: string | null;
  success?: boolean;
  onClearError?: () => void;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Error and success message display for composers
 */
export function ComposerMessages({
  error,
  success,
  onClearError,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: ComposerMessagesProps) {
  if (error) {
    return (
      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-red-600 text-sm flex-1">{error}</div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {onRetry && retryCount < maxRetries && (
          <div className="mt-2">
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 underline rounded-md min-h-[44px] px-2 flex items-center"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
        ✓ Post shared successfully!
      </div>
    );
  }

  return null;
}

// ==================== CHARACTER COUNTER ====================

export interface CharacterCounterProps {
  count: number;
  max?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  className?: string;
}

/**
 * Character count display with color warnings
 */
export function CharacterCounter({
  count,
  max = 500,
  warningThreshold = 400,
  dangerThreshold = 450,
  className,
}: CharacterCounterProps) {
  if (count === 0) {
    return null;
  }

  const colorClass =
    count > dangerThreshold
      ? 'text-red-500'
      : count > warningThreshold
        ? 'text-orange-500'
        : 'text-gray-400';

  return (
    <div className={cn('text-sm font-medium', colorClass, className)}>
      {count}/{max}
    </div>
  );
}

// ==================== OFFLINE INDICATOR ====================

export interface OfflineIndicatorProps {
  isOnline: boolean;
}

/**
 * Shows offline status indicator
 */
export function OfflineIndicator({ isOnline }: OfflineIndicatorProps) {
  if (isOnline) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
}

// ==================== POST BUTTON ====================

export interface PostButtonProps {
  onClick: () => void;
  disabled: boolean;
  isPosting: boolean;
  text?: string;
  variant?: 'sky' | 'orange' | 'gradient';
  size?: 'sm' | 'md';
}

/**
 * Primary post/submit button
 */
export function PostButton({
  onClick,
  disabled,
  isPosting,
  text = 'Post',
  variant = 'sky',
  size = 'sm',
}: PostButtonProps) {
  const baseClasses = cn(
    'rounded-full font-bold transition-all disabled:opacity-50 disabled:shadow-none',
    size === 'sm' ? 'px-5 py-2 text-sm shadow-sm' : 'px-6 py-2 shadow-sm min-h-[44px] min-w-[80px]'
  );

  const variantClasses = {
    sky: 'bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    gradient:
      'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-300 text-white hover:shadow-md',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, variantClasses[variant])}
      size="sm"
    >
      {isPosting ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Posting...</span>
        </div>
      ) : (
        text
      )}
    </Button>
  );
}

// ==================== CONTEXT INDICATOR ====================

export interface ContextIndicatorProps {
  targetName: string;
}

/**
 * Shows where the post will appear
 */
export function ContextIndicator({ targetName }: ContextIndicatorProps) {
  return (
    <div className="mb-1.5 flex items-center">
      <span className="text-xs sm:text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 sm:py-0.5 rounded-full">
        To {targetName}
      </span>
    </div>
  );
}
