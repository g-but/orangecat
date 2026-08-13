'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Share2, Users, Settings, Bitcoin, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import ProfileShare from '@/components/sharing/ProfileShare';
import { ROUTES } from '@/config/routes';
import type { ScalableProfile } from '@/services/profile/types';

interface ProfileBannerSectionProps {
  profile: ScalableProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  showShare: boolean;
  shareButtonRef: React.RefObject<HTMLDivElement | null>;
  shareDropdownRef: React.RefObject<HTMLDivElement | null>;
  onShareToggle: () => void;
  onFollowToggle: () => void;
}

export function ProfileBannerSection({
  profile,
  isOwnProfile,
  isFollowing,
  isFollowLoading,
  showShare,
  shareButtonRef,
  shareDropdownRef,
  onShareToggle,
  onFollowToggle,
}: ProfileBannerSectionProps) {
  return (
    <div className="relative mb-4 sm:mb-6 lg:mb-8">
      {/* Banner — monochrome neutral default per migration 6/N; user
          banner_url image overlays on top. The dark-bottom overlay stays
          so action buttons remain readable. */}
      <div className="relative h-32 sm:h-48 md:h-64 lg:h-80 bg-surface-raised border border-subtle rounded-lg sm:rounded-md shadow-none overflow-hidden">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt="Profile banner"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1024px"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      {/* Avatar */}
      <div className="absolute -bottom-8 sm:-bottom-12 md:-bottom-16 left-3 sm:left-6 lg:left-8">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.name || 'User'}
            width={128}
            height={128}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-lg sm:rounded-lg object-cover border-2 sm:border-4 border-fg-inverted shadow-sm"
          />
        ) : (
          <DefaultAvatar
            size={128}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-lg sm:rounded-lg border-2 sm:border-4 border-fg-inverted shadow-sm"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-6 lg:right-6 flex gap-2 sm:gap-3">
        <div className="relative" ref={shareButtonRef}>
          <Button
            onClick={onShareToggle}
            variant="outline"
            size="sm"
            className="bg-surface-base/90 dark:bg-surface-base/90 backdrop-blur-sm hover:bg-surface-raised dark:hover:bg-surface-base shadow-sm text-xs sm:text-sm"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          {showShare && (
            <div
              ref={shareDropdownRef}
              className="absolute top-full right-0 mt-2 z-modal"
              style={{
                position:
                  typeof window !== 'undefined' && window.innerWidth < 640 ? 'fixed' : 'absolute',
                top: typeof window !== 'undefined' && window.innerWidth < 640 ? 'auto' : undefined,
                bottom:
                  typeof window !== 'undefined' && window.innerWidth < 640 ? '20px' : undefined,
                left: typeof window !== 'undefined' && window.innerWidth < 640 ? '50%' : undefined,
                transform:
                  typeof window !== 'undefined' && window.innerWidth < 640
                    ? 'translateX(-50%)'
                    : undefined,
                right:
                  typeof window !== 'undefined' && window.innerWidth < 640 ? 'auto' : undefined,
              }}
            >
              <ProfileShare
                username={profile.username || ''}
                profileName={profile.name || profile.username || 'User'}
                profileBio={profile.bio ?? undefined}
                onClose={() => onShareToggle()}
              />
            </div>
          )}
        </div>

        {profile.username && (
          <Link href={ROUTES.PAY(profile.username)}>
            <Button variant="accent" size="sm" className="shadow-sm text-xs sm:text-sm">
              <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pay</span>
            </Button>
          </Link>
        )}

        {!isOwnProfile && profile.id && (
          <Link href={`${ROUTES.MESSAGES}?to=${encodeURIComponent(profile.id)}`}>
            <Button variant="outline" size="sm" className="bg-surface-base/90 shadow-sm text-xs sm:text-sm">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          </Link>
        )}

        {isOwnProfile ? (
          <Link href={ROUTES.DASHBOARD.INFO_EDIT}>
            <Button variant="primary" size="sm" className="shadow-sm text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onFollowToggle}
            disabled={isFollowLoading}
            variant={isFollowing ? 'secondary' : 'outline'}
            size="sm"
            className="shadow-sm text-xs sm:text-sm"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
            </span>
            <span className="sm:hidden">{isFollowLoading ? '...' : isFollowing ? '−' : '+'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
