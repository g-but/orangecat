/**
 * Sidebar User Profile Component
 *
 * Displays user profile section in the sidebar with avatar and user info
 *
 * Created: 2025-01-07
 * Last Modified: 2025-01-07
 * Last Modified Summary: Created sidebar user profile component
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import type { Profile } from '@/types/database';

interface SidebarUserProfileProps {
  profile: Profile;
  isExpanded: boolean;
  onNavigate?: () => void;
}

export function SidebarUserProfile({ profile, isExpanded, onNavigate }: SidebarUserProfileProps) {
  const [avatarError, setAvatarError] = useState(false);

  if (!profile) {
    return null;
  }

  // Use actual username URL for better UX and SEO, fallback to /profiles/me if no username
  const profileUrl = profile.username 
    ? `/profiles/${profile.username}` 
    : '/profiles/me';

  return (
    <div
      className={`px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 border-b border-gray-100 flex-shrink-0 ${
        isExpanded ? 'block' : 'hidden lg:flex lg:flex-col lg:items-center'
      }`}
    >
      <Link
        href={profileUrl}
        className={`flex items-center hover:bg-gray-50 p-1.5 sm:p-2 lg:p-3 rounded-xl transition-all duration-200 group w-full ${
          isExpanded ? 'space-x-2 sm:space-x-3' : 'lg:flex-col lg:space-y-2 lg:space-x-0'
        }`}
        onClick={(e) => {
          // Only call onNavigate if provided (for mobile sidebar closing)
          // Don't prevent default navigation
          if (onNavigate) {
            onNavigate();
          }
        }}
      >
        <div className="relative flex-shrink-0">
          {profile.avatar_url && !avatarError ? (
            <Image
              src={profile.avatar_url}
              alt={profile.name || 'User Avatar'}
              width={isExpanded ? 40 : 36}
              height={isExpanded ? 40 : 36}
              className="rounded-full object-cover transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <DefaultAvatar
              size={isExpanded ? 40 : 36}
              className="transition-all duration-300 group-hover:ring-2 group-hover:ring-tiffany-200 rounded-full"
            />
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full" />
        </div>
        <div className={`flex-1 min-w-0 ${isExpanded ? 'block' : 'hidden lg:hidden'}`}>
          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate group-hover:text-tiffany-700 transition-colors">
            {profile.name || profile.username || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">@{profile.username || 'username'}</p>
        </div>
      </Link>
    </div>
  );
}
