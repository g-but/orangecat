'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import ProfileShare from '@/components/sharing/ProfileShare';
import ProfileViewTabs from '@/components/profile/ProfileViewTabs';
import ProfileOverviewTab from '@/components/profile/ProfileOverviewTab';
import ProfileTimelineTab from '@/components/profile/ProfileTimelineTab';
import ProfileProjectsTab from '@/components/profile/ProfileProjectsTab';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import ProfileWalletsTab from '@/components/profile/ProfileWalletsTab';
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
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PublicProfileClientProps {
  profile: Profile;
  projects?: any[];
  stats?: {
    projectCount: number;
    totalRaised: number;
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
  const isOwnProfile = profile.id === user?.id;

  const [showShare, setShowShare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
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
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <User className="w-4 h-4" />,
      content: <ProfileOverviewTab profile={profile} stats={stats} />,
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
      id: 'info',
      label: 'Info',
      icon: <Info className="w-4 h-4" />,
      content: <ProfileInfoTab profile={profile} />,
    },
    {
      id: 'wallets',
      label: 'Wallets',
      icon: <Wallet className="w-4 h-4" />,
      content: <ProfileWalletsTab profile={profile} isOwnProfile={isOwnProfile} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Banner Section */}
        <div className="relative mb-8">
          {/* Banner */}
          <div className="relative h-80 bg-gradient-to-r from-orange-400 via-orange-500 to-teal-500 rounded-2xl shadow-xl overflow-hidden">
            {profile.banner_url && (
              <Image src={profile.banner_url} alt="Profile banner" fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || 'User'}
                width={128}
                height={128}
                className="rounded-2xl object-cover border-4 border-white shadow-2xl"
              />
            ) : (
              <DefaultAvatar size={128} className="rounded-2xl border-4 border-white shadow-2xl" />
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-6 right-6 flex gap-3">
            {/* Share Button */}
            <div className="relative" ref={shareButtonRef}>
              <Button
                onClick={() => setShowShare(!showShare)}
                variant="outline"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {showShare && (
                <div ref={shareDropdownRef} className="absolute top-full right-0 mt-2 z-50">
                  <ProfileShare
                    username={profile.username || ''}
                    profileName={profile.name || profile.username || 'User'}
                    profileBio={profile.bio || undefined}
                    onClose={() => setShowShare(false)}
                  />
                </div>
              )}
            </div>

            {isOwnProfile && (
              <Link href="/profiles/me">
                <Button
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            )}

            {!isOwnProfile && (
              <Button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={cn(
                  'shadow-lg',
                  isFollowing
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                )}
              >
                <Users className="w-4 h-4 mr-2" />
                {isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="mt-20">
          {/* Profile Name & Bio */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.name || profile.username || 'User'}
            </h1>
            <p className="text-lg text-orange-600 font-medium mb-4">@{profile.username}</p>
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

          {/* Tabbed Content with Progressive Loading */}
          <ProfileViewTabs tabs={tabs} defaultTab="overview" />
        </div>

        {/* Support CTA for non-own profiles with wallets */}
        {!isOwnProfile && (profile.bitcoin_address || profile.lightning_address) && (
          <div className="mt-8">
            <Card className="bg-gradient-to-r from-orange-50 to-teal-50 border-2 border-orange-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Support {profile.name || profile.username}
                    </h3>
                    <p className="text-gray-600">
                      Send Bitcoin directly to support their work and projects
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {profile.bitcoin_address && (
                      <Button
                        onClick={() => {
                          const element = document.querySelector('[data-bitcoin-card]');
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Bitcoin className="w-4 h-4 mr-2" />
                        Send Bitcoin
                      </Button>
                    )}
                    {profile.lightning_address && (
                      <Button
                        onClick={() => {
                          const element = document.querySelector('[data-lightning-card]');
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        variant="outline"
                        className="border-yellow-400 hover:bg-yellow-50"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Send Lightning
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
