/**
 * AvatarLink Component
 *
 * Reusable avatar component that always links to a user's public profile (overview tab).
 * Ensures DRY code and consistent behavior across the application.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created reusable avatar link component
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarLinkProps {
  /**
   * Username or user ID for the profile link
   * If username is provided, uses /profiles/{username}
   * Otherwise falls back to /profiles/{userId} or /profiles/me for current user
   */
  username?: string | null;
  userId?: string | null;
  
  /**
   * Avatar image URL
   */
  avatarUrl?: string | null;
  
  /**
   * Display name for alt text and fallback initial
   */
  name?: string | null;
  
  /**
   * Size of the avatar (default: 48)
   */
  size?: number;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show online status indicator (green dot)
   */
  showOnlineStatus?: boolean;
  
  /**
   * Whether this is the current user's avatar
   */
  isCurrentUser?: boolean;
}

/**
 * AvatarLink - Reusable avatar component that links to profile
 *
 * Always navigates to /profiles/{username} (overview tab) when clicked.
 * Handles both image avatars and fallback initials.
 */
export default function AvatarLink({
  username,
  userId,
  avatarUrl,
  name,
  size = 48,
  className = '',
  showOnlineStatus = false,
  isCurrentUser = false,
}: AvatarLinkProps) {
  // Determine profile URL - prefer username, fallback to userId or /profiles/me
  const profileUrl = username
    ? `/profiles/${username}`
    : userId
      ? `/profiles/${userId}`
      : isCurrentUser
        ? '/profiles/me'
        : '#';

  const displayName = name || username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link
      href={profileUrl}
      className={cn(
        'relative flex-shrink-0 inline-block transition-all duration-200',
        'hover:ring-2 hover:ring-orange-200 rounded-full',
        className
      )}
      title={`View ${displayName}'s profile`}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          width={size}
          height={size}
          className={cn(
            'rounded-full object-cover border-2 border-white shadow-sm',
            'transition-all duration-200'
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center border-2 border-white shadow-sm',
            'bg-gradient-to-br from-orange-400 to-yellow-500',
            'text-white font-semibold transition-all duration-200'
          )}
          style={{ width: size, height: size, fontSize: `${size * 0.4}px` }}
        >
          {initial}
        </div>
      )}
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </Link>
  );
}

