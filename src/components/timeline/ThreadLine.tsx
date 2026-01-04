'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ThreadLineProps {
  depth?: number;
  isLast?: boolean;
  className?: string;
}

/**
 * Visual thread line component for X-like thread visualization
 * Shows connecting lines between posts in a thread
 */
export function ThreadLine({ depth = 1, isLast = false, className }: ThreadLineProps) {
  // Don't show thread line for root posts (depth 0)
  if (depth === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Thread line container */}
      <div className="flex flex-col items-center">
        {/* Vertical line connecting to parent */}
        <div
          className={cn(
            'w-0.5 bg-gray-300 flex-shrink-0',
            depth > 1 && '-mt-2 mb-2',
            depth === 1 && 'mb-2'
          )}
          style={{ height: depth > 1 ? '1rem' : '0.5rem' }}
        />

        {/* Horizontal connector (only for nested replies) */}
        {depth > 1 && <div className="w-6 h-0.5 bg-gray-300 flex-shrink-0" />}
      </div>

      {/* Content spacer */}
      <div className="flex-1" />
    </div>
  );
}

interface ThreadConnectorProps {
  depth?: number;
  hasChildren?: boolean;
  isLastInThread?: boolean;
  className?: string;
}

/**
 * Advanced thread connector with branching support
 */
export function ThreadConnector({
  depth = 0,
  hasChildren = false,
  isLastInThread = false,
  className,
}: ThreadConnectorProps) {
  if (depth === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-start', className)}>
      {/* Vertical thread line */}
      <div className="flex flex-col items-center w-8 flex-shrink-0">
        {/* Line above current post */}
        {depth > 0 && <div className="w-0.5 bg-gray-300 h-2" />}

        {/* Thread node */}
        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0" />

        {/* Line below current post (if has children) */}
        {hasChildren && !isLastInThread && <div className="w-0.5 bg-gray-300 flex-1 min-h-4" />}
      </div>

      {/* Content area with proper indentation */}
      <div className="flex-1" style={{ marginLeft: `${(depth - 1) * 16}px` }} />
    </div>
  );
}



