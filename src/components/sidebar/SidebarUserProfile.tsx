/**
 * Sidebar User Profile Component
 *
 * Displays user profile section in the sidebar with avatar and user info
 * Desktop: Icon-only with flyout tooltip on hover
 * Mobile: Full avatar with name when drawer is open
 *
 * Created: 2025-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Added flyout tooltip for desktop fixed-width sidebar
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import type { Profile } from '@/types/database';
import { FlyoutTooltip } from './FlyoutTooltip';

interface SidebarUserProfileProps {
  profile: Profile;
  isExpanded: boolean;
  onNavigate?: () => void;
}

export function SidebarUserProfile({ profile, isExpanded, onNavigate }: SidebarUserProfileProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!profile) {
    return null;
  }

  // Use actual username URL for better UX and SEO, fallback to /profiles/me if no username
  const profileUrl = profile.username
    ? `/profiles/${profile.username}`
    : '/profiles/me';

  const displayName = profile.name || profile.username || 'User';
  const username = profile.username || 'username';

  return (
    <div
      className="relative px-2 py-3 border-b border-gray-100 flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={profileUrl}
        className={`flex items-center hover:bg-gray-50 p-2 rounded-xl transition-colors duration-150 group ${
          isExpanded ? 'gap-3' : 'justify-center'
        }`}
        onClick={() => {
          if (onNavigate) {
            onNavigate();
          }
        }}
      >
        <div className="relative flex-shrink-0">
          {profile.avatar_url && !avatarError ? (
            <Image
              src={profile.avatar_url}
              alt={displayName}
              width={isExpanded ? 40 : 32}
              height={isExpanded ? 40 : 32}
              className="rounded-full object-cover group-hover:ring-2 group-hover:ring-tiffany-200 transition-all"
              onError={() => setAvatarError(true)}
              unoptimized={profile.avatar_url?.includes('supabase.co')}
            />
          ) : (
            <DefaultAvatar
              size={isExpanded ? 40 : 32}
              className="group-hover:ring-2 group-hover:ring-tiffany-200 rounded-full transition-all"
            />
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
        </div>

        {/* Show text only on mobile expanded */}
        {isExpanded && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-tiffany-700 transition-colors">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">@{username}</p>
          </div>
        )}
      </Link>

      {/* Flyout Tooltip - Desktop only */}
      <FlyoutTooltip isVisible={!isExpanded && isHovered}>
        <p className="font-medium">{displayName}</p>
        <p className="text-xs text-gray-400">@{username}</p>
      </FlyoutTooltip>
    </div>
  );
}
