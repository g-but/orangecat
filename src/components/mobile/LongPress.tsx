'use client';

import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/touch/feedback';

interface LongPressProps {
  children: React.ReactNode;
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  delay?: number;
  haptic?: boolean;
  className?: string;
}

/**
 * LongPress — wraps children and fires onLongPress after a sustained press.
 * Cancels if the user moves or releases early.
 */
export function LongPress({
  children,
  onLongPress,
  delay = 500,
  haptic = true,
  className,
}: LongPressProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      timerRef.current = setTimeout(() => {
        if (haptic) { hapticFeedback('medium'); }
        onLongPress(event);
        timerRef.current = null;
      }, delay);
    },
    [onLongPress, delay, haptic]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div
      className={cn('select-none', className)}
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchMove={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </div>
  );
}
