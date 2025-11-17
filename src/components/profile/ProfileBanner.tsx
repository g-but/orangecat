'use client';

import Image from 'next/image';
import { ScalableProfile } from '@/types/database';
import DefaultAvatar from '@/components/ui/DefaultAvatar';

interface ProfileBannerProps {
  profile: ScalableProfile;
  children?: React.ReactNode; // For action buttons overlay
}

/**
 * ProfileBanner Component
 *
 * Displays the profile banner image with avatar overlay.
 * Responsive heights: 192px mobile → 256px tablet → 320px desktop
 * Avatar sizes: 96px mobile → 128px desktop
 */
export default function ProfileBanner({ profile, children }: ProfileBannerProps) {
  return (
    <div className="relative mb-8">
      {/* Banner - Responsive height */}
      <div className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
        {/* Banner Image */}
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Profile banner"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Banner Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Avatar - Responsive positioning and sizing */}
      <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.name || 'User'}
            width={96}
            height={96}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-2xl"
            priority
          />
        ) : (
          <DefaultAvatar
            size={128}
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-2xl"
          />
        )}
      </div>

      {/* Action Buttons Overlay (passed as children) */}
      {children}
    </div>
  );
}
