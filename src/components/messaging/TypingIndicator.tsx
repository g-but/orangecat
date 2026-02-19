'use client';

/**
 * Typing Indicator Component
 *
 * Displays animated typing indicator with user avatars.
 * Mimics the Facebook Messenger style typing bubble.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { TypingUser } from '@/features/messaging/hooks/useTypingPresence';

interface TypingIndicatorProps {
  /** List of users currently typing */
  typingUsers: TypingUser[];
  /** Optional class name for the container */
  className?: string;
  /** Show user avatars */
  showAvatars?: boolean;
  /** Maximum avatars to show before "+N" */
  maxAvatars?: number;
}

/**
 * Animated typing dots component
 */
function TypingDots() {
  return (
    <div className="flex items-center space-x-1">
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

/**
 * User avatar for typing indicator
 */
function TypingAvatar({ user, size = 'sm' }: { user: TypingUser; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.username}
        width={size === 'sm' ? 24 : 32}
        height={size === 'sm' ? 24 : 32}
        className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-sm`}
        title={user.username}
        unoptimized
      />
    );
  }

  // Fallback to initials
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium border-2 border-white shadow-sm`}
      title={user.username}
    >
      {initials}
    </div>
  );
}

/**
 * Format typing text based on number of users
 */
function formatTypingText(typingUsers: TypingUser[]): string {
  if (typingUsers.length === 0) {
    return '';
  }
  if (typingUsers.length === 1) {
    return `${typingUsers[0].username} is typing`;
  }
  if (typingUsers.length === 2) {
    return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
  }
  return `${typingUsers.length} people are typing`;
}

export function TypingIndicator({
  typingUsers,
  className = '',
  showAvatars = true,
  maxAvatars = 3,
}: TypingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade in/out effect
  useEffect(() => {
    if (typingUsers.length > 0) {
      setIsVisible(true);
      return;
    }
    // Slight delay before hiding to prevent flicker
    const timeout = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timeout);
  }, [typingUsers.length]);

  if (!isVisible || typingUsers.length === 0) {
    return null;
  }

  const displayedUsers = typingUsers.slice(0, maxAvatars);
  const extraCount = typingUsers.length - maxAvatars;
  const typingText = formatTypingText(typingUsers);

  return (
    <div
      className={`flex items-center space-x-2 px-3 py-2 transition-opacity duration-200 ${
        typingUsers.length > 0 ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {/* Avatars */}
      {showAvatars && (
        <div className="flex -space-x-2">
          {displayedUsers.map(user => (
            <TypingAvatar key={user.userId} user={user} />
          ))}
          {extraCount > 0 && (
            <div
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium border-2 border-white shadow-sm"
              title={`${extraCount} more`}
            >
              +{extraCount}
            </div>
          )}
        </div>
      )}

      {/* Typing bubble */}
      <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
        <TypingDots />
      </div>

      {/* Text label (shown on larger screens) */}
      <span className="hidden sm:inline text-sm text-gray-500">{typingText}</span>
    </div>
  );
}

/**
 * Compact typing indicator (just dots and text, no avatars)
 */
export function TypingIndicatorCompact({
  typingUsers,
  className = '',
}: Pick<TypingIndicatorProps, 'typingUsers' | 'className'>) {
  if (typingUsers.length === 0) {
    return null;
  }

  const typingText = formatTypingText(typingUsers);

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      <TypingDots />
      <span>{typingText}...</span>
    </div>
  );
}

/**
 * Online status badge
 */
export function OnlineStatusBadge({
  status,
  size = 'sm',
}: {
  status: 'online' | 'away' | 'offline';
  size?: 'xs' | 'sm' | 'md';
}) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <span
      className={`${sizeClasses[size]} ${statusColors[status]} rounded-full inline-block ring-2 ring-white`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

/**
 * Online users list component
 */
export function OnlineUsersList({
  users,
  className = '',
}: {
  users: Array<{
    userId: string;
    username: string;
    avatarUrl?: string;
    status: 'online' | 'away' | 'offline';
  }>;
  className?: string;
}) {
  const onlineCount = users.filter(u => u.status === 'online').length;
  const awayCount = users.filter(u => u.status === 'away').length;

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs text-gray-500 font-medium">
        {onlineCount} online{awayCount > 0 ? `, ${awayCount} away` : ''}
      </div>
      <div className="flex flex-wrap gap-2">
        {users.map(user => (
          <div
            key={user.userId}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-full text-xs"
          >
            <OnlineStatusBadge status={user.status} size="xs" />
            <span className="text-gray-700">{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TypingIndicator;
