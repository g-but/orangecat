'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import ProfileShare from '@/components/sharing/ProfileShare';
import ProfileViewTabs from '@/components/profile/ProfileViewTabs';
import dynamic from 'next/dynamic';

const ProfileOverviewTab = dynamic(() => import('@/components/profile/ProfileOverviewTab'));
const ProfileTimelineTab = dynamic(() => import('@/components/profile/ProfileTimelineTab'));
const ProfileProjectsTab = dynamic(() => import('@/components/profile/ProfileProjectsTab'));
const ProfilePeopleTab = dynamic(() => import('@/components/profile/ProfilePeopleTab'));
const ProfileInfoTab = dynamic(() => import('@/components/profile/ProfileInfoTab'));
const ProfileWalletsTab = dynamic(() => import('@/components/profile/ProfileWalletsTab'));
import {
  Bitcoin,
  Zap,
  Edit,
  Share2,
  Users,
  User,
  MessageSquare,
  Target,
  Globe,
  ExternalLink,
  Info,
  Wallet as WalletIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProfileFormData } from '@/types/database';

/**
 * DEPRECATED: This component is being replaced by the unified ProfileLayout.
 * It will be removed once all references are migrated.
 *
 * Use ProfileLayout from '@/components/profile/ProfileLayout' instead.
 */
import type { Wallet } from '@/types/wallet';

interface PublicProfileClientProps {
  profile: Profile;
  projects?: any[];
  stats?: {
    projectCount: number;
    totalRaised: number;
    followerCount?: number;
    followingCount?: number;
    walletCount?: number;
  };
}

/**
 * Public Profile Client Component
 *
 * Handles client-side interactivity for public profile pages.
 * Uses modular tab system following DRY, modularity, and progressive exposure principles.
 */
export default function PublicProfileClient({
  profile,
  projects,
  stats,
}: PublicProfileClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwnProfile = profile.id === user?.id;

  const [showShare, setShowShare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  // Check follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id || isOwnProfile || !profile.id) {
        return;
      }

      try {
        const response = await fetch(`/api/social/following/${user.id}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const following = data.data.some((f: any) => f.following_id === profile.id);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error('Failed to check follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user?.id, profile.id, isOwnProfile]);

  // Load wallets for this profile (used for support CTA and wallets tab badge)
  useEffect(() => {
    const loadWallets = async () => {
      if (!profile.id) {
        return;
      }
      try {
        setWalletsLoading(true);
        const response = await fetch(`/api/wallets?profile_id=${profile.id}`);
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        // API returns { success: true, data: [...] } (standard response format)
        setWallets(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        // Non-fatal: just log to console; profile page should still render
        console.error('Failed to load wallets for profile:', error);
      } finally {
        setWalletsLoading(false);
      }
    };

    loadWallets();
  }, [profile.id]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user?.id || !profile.id || isFollowLoading) {
      return;
    }

    setIsFollowLoading(true);
    try {
      const endpoint = isFollowing ? '/api/social/unfollow' : '/api/social/follow';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profile.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? 'Unfollowed' : 'Followed');
      } else {
        throw new Error(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Handle profile save (for editing in Info tab)
  const handleProfileSave = async (data: ProfileFormData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');

      // Refresh the server-side data without full page reload
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
      throw error;
    }
  };

  // Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showShare &&
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShare]);

  // Define tabs for progressive loading
  // Order: Overview, Info, Timeline, Projects, People, Wallets
  const tabs = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        icon: <User className="w-4 h-4" />,
        content: (
          <ProfileOverviewTab
            profile={profile}
            stats={stats}
            isOwnProfile={isOwnProfile}
            context="public"
          />
        ),
      },
      {
        id: 'info',
        label: 'Info',
        icon: <Info className="w-4 h-4" />,
        content: (
          <ProfileInfoTab
            profile={profile}
            isOwnProfile={isOwnProfile}
            userId={user?.id}
            userEmail={user?.email}
            onSave={handleProfileSave}
          />
        ),
      },
      {
        id: 'timeline',
        label: 'Timeline',
        icon: <MessageSquare className="w-4 h-4" />,
        content: <ProfileTimelineTab profile={profile} isOwnProfile={isOwnProfile} />,
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: <Target className="w-4 h-4" />,
        badge: stats?.projectCount,
        content: <ProfileProjectsTab profile={profile} isOwnProfile={isOwnProfile} />,
      },
      {
        id: 'people',
        label: 'People',
        icon: <Users className="w-4 h-4" />,
        badge: `${stats?.followerCount || 0}/${stats?.followingCount || 0}`,
        content: <ProfilePeopleTab profile={profile} isOwnProfile={isOwnProfile} />,
      },
      {
        id: 'wallets',
        label: 'Wallets',
        icon: <WalletIcon className="w-4 h-4" />,
        badge: wallets.length || (stats as any)?.walletCount || undefined,
        content: <ProfileWalletsTab profile={profile} isOwnProfile={isOwnProfile} />,
      },
    ],
    [stats, wallets, profile, isOwnProfile, user, handleProfileSave]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Header Banner Section */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8">
          {/* Banner */}
          <div className="relative h-32 sm:h-48 md:h-64 lg:h-80 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            {profile.banner_url && (
              <Image src={profile.banner_url} alt="Profile banner" fill className="object-cover" />
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
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-4 border-white shadow-2xl"
              />
            ) : (
              <DefaultAvatar
                size={128}
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-2xl"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 lg:top-6 lg:right-6 flex gap-2 sm:gap-3">
            {/* Share Button */}
            <div className="relative" ref={shareButtonRef}>
              <Button
                onClick={() => setShowShare(!showShare)}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg text-xs sm:text-sm"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              {showShare && (
                <div
                  ref={shareDropdownRef}
                  className="absolute top-full right-0 mt-2 z-[9999] sm:z-50"
                  style={{
                    // Ensure dropdown appears above banner on mobile
                    position:
                      typeof window !== 'undefined' && window.innerWidth < 640
                        ? 'fixed'
                        : 'absolute',
                    top:
                      typeof window !== 'undefined' && window.innerWidth < 640 ? 'auto' : undefined,
                    bottom:
                      typeof window !== 'undefined' && window.innerWidth < 640 ? '20px' : undefined,
                    left:
                      typeof window !== 'undefined' && window.innerWidth < 640 ? '50%' : undefined,
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
                    profileBio={profile.bio || undefined}
                    onClose={() => setShowShare(false)}
                  />
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <>
                {/* Message Button */}
                <Button
                  onClick={() => router.push(`/messages?user=${profile.id}`)}
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg text-xs sm:text-sm"
                >
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Message</span>
                </Button>

                {/* Follow Button */}
                <Button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  size="sm"
                  className={cn(
                    'shadow-lg text-xs sm:text-sm',
                    isFollowing
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  )}
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                  </span>
                  <span className="sm:hidden">
                    {isFollowLoading ? '...' : isFollowing ? '−' : '+'}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content - Single Column */}
        <div className="mt-12 sm:mt-16 md:mt-20">
          {/* Profile Name & Bio */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border-0 p-4 sm:p-6 mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              {profile.name || profile.username || 'User'}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-orange-600 font-medium mb-3 sm:mb-4">
              @{profile.username}
            </p>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
              >
                <Globe className="w-4 h-4 mr-2" />
                Visit Website
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>

          {/* Tabbed Content - View Only */}
          <ProfileViewTabs tabs={tabs} defaultTab="timeline" />
        </div>

        {/* Support CTA for non-own profiles with wallets.
            Uses multi-wallet system; falls back to legacy fields if needed. */}
        {!isOwnProfile &&
          (wallets.length > 0 || profile.bitcoin_address || profile.lightning_address) && (
            <div className="mt-4 sm:mt-6 lg:mt-8">
              <Card className="bg-gradient-to-r from-orange-50 to-teal-50 border-2 border-orange-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                        Support {profile.name || profile.username}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        Send Bitcoin directly to support their work and projects
                      </p>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
                      {/* Primary Bitcoin wallet: scroll to wallet section if present */}
                      {(wallets.length > 0 || profile.bitcoin_address) && (
                        <Button
                          onClick={() => {
                            const element = document.querySelector(
                              '[data-wallet-section],[data-bitcoin-card]'
                            );
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          size="sm"
                          className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm"
                        >
                          <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Send Bitcoin</span>
                          <span className="sm:hidden">Bitcoin</span>
                        </Button>
                      )}
                      {profile.lightning_address && (
                        <Button
                          onClick={() => {
                            const element = document.querySelector('[data-lightning-card]');
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 md:flex-none border-yellow-400 hover:bg-yellow-50 text-xs sm:text-sm"
                        >
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Send Lightning</span>
                          <span className="sm:hidden">Lightning</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
      </div>
    </div>
  );
}
