/**
 * Header Action Buttons
 *
 * Modular, reusable header action components.
 * Follows SOC principle - each button is self-contained.
 *
 * Created: 2026-01-16
 */

'use client';

import { Search, MessageSquare, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUnreadCount } from '@/stores/messaging';
import { useUnreadNotifications } from '@/hooks/useNotifications';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { TOUCH_TARGETS, HEADER_BUTTON_BASE } from '@/constants/header';
import { cn } from '@/lib/utils';

interface HeaderActionButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Aria label for accessibility */
  ariaLabel: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Badge count (optional) */
  badgeCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base header action button
 *
 * Reusable button component following DRY principle
 */
function HeaderActionButton({
  onClick,
  ariaLabel,
  icon,
  badgeCount = 0,
  className,
}: HeaderActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(TOUCH_TARGETS.RESPONSIVE, HEADER_BUTTON_BASE.BASE, className)}
      aria-label={ariaLabel}
    >
      {icon}
      <NotificationBadge count={badgeCount} />
    </button>
  );
}

/**
 * Mobile search button
 */
export function MobileSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        TOUCH_TARGETS.MOBILE,
        HEADER_BUTTON_BASE.BASE,
        HEADER_BUTTON_BASE.MOBILE_SEARCH,
        'transition-all'
      )}
      aria-label="Search projects, people, organizations"
    >
      <Search className="w-5 h-5" strokeWidth={2} />
    </button>
  );
}

/**
 * Messages button with unread count
 */
export function MessagesButton() {
  const router = useRouter();
  const unreadCount = useUnreadCount();

  return (
    <HeaderActionButton
      onClick={() => router.push('/messages')}
      ariaLabel={`Messages ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      icon={<MessageSquare className="w-5 h-5" />}
      badgeCount={unreadCount}
    />
  );
}

/**
 * Notifications button with unread count
 */
export function NotificationsButton({ onClick }: { onClick: () => void }) {
  const { count: unreadCount } = useUnreadNotifications();

  return (
    <HeaderActionButton
      onClick={onClick}
      ariaLabel={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      icon={<Bell className="w-5 h-5" />}
      badgeCount={unreadCount}
    />
  );
}
