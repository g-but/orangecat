/**
 * Notification Badge Component
 *
 * Reusable badge for displaying notification counts.
 * Follows DRY principle - used across messages, notifications, etc.
 *
 * Created: 2026-01-16
 */

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  /** Number of unread items */
  count: number;
  /** Maximum number to display before showing "9+" */
  maxDisplay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Notification badge for displaying unread counts
 *
 * @example
 * <NotificationBadge count={5} />
 * <NotificationBadge count={15} maxDisplay={9} /> // Shows "9+"
 */
export function NotificationBadge({ count, maxDisplay = 9, className }: NotificationBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        'absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 min-w-[16px] flex items-center justify-center font-semibold leading-none',
        className
      )}
      aria-label={`${count} unread`}
    >
      {count > maxDisplay ? `${maxDisplay}+` : count}
    </span>
  );
}
