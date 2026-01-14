'use client';
import { logger } from '@/utils/logger';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ScalableProfile, ProfileFormData, Project } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import ProfileShare from '@/components/sharing/ProfileShare';
import ProfileViewTabs from '@/components/profile/ProfileViewTabs';
import ProfileOverviewTab from '@/components/profile/ProfileOverviewTab';
import ProfileTimelineTab from '@/components/profile/ProfileTimelineTab';
import ProfileProjectsTab from '@/components/profile/ProfileProjectsTab';
import ProfilePeopleTab from '@/components/profile/ProfilePeopleTab';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import ProfileWalletsTab from '@/components/profile/ProfileWalletsTab';
import ProfileEntityTab from '@/components/profile/ProfileEntityTab';
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
  Package,
  Briefcase,
  Heart,
  Calendar,
  Coins,
  Building,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Unified Profile Layout Component
 *
 * Single, DRY component for all profile display scenarios:
 * - Public profile pages
 * - Dashboard profile views
 * - Edit modes
 *
 * Replaces PublicProfileClient and UnifiedProfileLayout to eliminate duplication.
 */

interface ProfileLayoutProps {
  profile: ScalableProfile;
  projects?: Project[];
  stats?: {
    projectCount: number;
    totalRaised: number;
    followerCount?: number;
    followingCount?: number;
    walletCount?: number;
    // Entity counts for profile tabs
    productCount?: number;
    serviceCount?: number;
    causeCount?: number;
    eventCount?: number;
    loanCount?: number;
    assetCount?: number;
    aiAssistantCount?: number;
  };
  mode?: 'view' | 'edit';
  onSave?: (data: ProfileFormData) => Promise<void>;
  onModeChange?: (mode: 'view' | 'edit') => void;
  className?: string;
}

export default function ProfileLayout({
  profile,
  projects,
  stats,
  mode = 'view',
  onSave,
  onModeChange,
  className,
}: ProfileLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
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
          const following = data.data.some(
            (f: { following_id: string }) => f.following_id === profile.id
          );
          setIsFollowing(following);
        }
      } catch (error) {
        logger.error('Failed to check follow status:', error);
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
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShare]);

  // Define tabs for progressive loading
  // Order: Overview, Info, Timeline, Projects, People, Wallets
  const tabs = [
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
          profile={profile as import('@/types/database').Profile & { email?: string | null }}
          isOwnProfile={isOwnProfile}
          userId={user?.id}
          userEmail={user?.email}
          onSave={onSave || handleProfileSave}
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
      id: 'products',
      label: 'Products',
      icon: <Package className="w-4 h-4" />,
      badge: stats?.productCount,
      content: <ProfileEntityTab profile={profile} entityType="product" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Briefcase className="w-4 h-4" />,
      badge: stats?.serviceCount,
      content: <ProfileEntityTab profile={profile} entityType="service" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'causes',
      label: 'Causes',
      icon: <Heart className="w-4 h-4" />,
      badge: stats?.causeCount,
      content: <ProfileEntityTab profile={profile} entityType="cause" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="w-4 h-4" />,
      badge: stats?.eventCount,
      content: <ProfileEntityTab profile={profile} entityType="event" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'loans',
      label: 'Loans',
      icon: <Coins className="w-4 h-4" />,
      badge: stats?.loanCount,
      content: <ProfileEntityTab profile={profile} entityType="loan" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <Building className="w-4 h-4" />,
      badge: stats?.assetCount,
      content: <ProfileEntityTab profile={profile} entityType="asset" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'ai-assistants',
      label: 'AI Assistants',
      icon: <Bot className="w-4 h-4" />,
      badge: stats?.aiAssistantCount,
      content: <ProfileEntityTab profile={profile} entityType="ai_assistant" isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'people',
      label: 'People',
      icon: <Users className="w-4 h-4" />,
      badge: stats?.followerCount,
      content: <ProfilePeopleTab profile={profile} isOwnProfile={isOwnProfile} />,
    },
    {
      id: 'wallets',
      label: 'Wallets',
      icon: <Wallet className="w-4 h-4" />,
      badge: stats?.walletCount,
      content: <ProfileWalletsTab profile={profile} isOwnProfile={isOwnProfile} />,
    },
  ];

  // For public profiles, hide tabs with no content
  const filteredTabs = tabs.filter(tab => {
    if (isOwnProfile) {
      return true;
    }
    switch (tab.id) {
      case 'projects':
        return (stats?.projectCount || 0) > 0;
      case 'products':
        return (stats?.productCount || 0) > 0;
      case 'services':
        return (stats?.serviceCount || 0) > 0;
      case 'causes':
        return (stats?.causeCount || 0) > 0;
      case 'events':
        return (stats?.eventCount || 0) > 0;
      case 'loans':
        return (stats?.loanCount || 0) > 0;
      case 'assets':
        return (stats?.assetCount || 0) > 0;
      case 'ai-assistants':
        return (stats?.aiAssistantCount || 0) > 0;
      case 'people':
        return (stats?.followerCount || 0) + (stats?.followingCount || 0) > 0;
      case 'wallets':
        return (
          (stats?.walletCount || 0) > 0 || !!profile.bitcoin_address || !!profile.lightning_address
        );
      default:
        return true; // overview, info, timeline always visible
    }
  });

  return (
    <div
      className={cn('min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100', className)}
    >
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
                    profileBio={profile.bio ?? undefined}
                    onClose={() => setShowShare(false)}
                  />
                </div>
              )}
            </div>

            {!isOwnProfile && (
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
          <ProfileViewTabs tabs={filteredTabs} defaultTab="timeline" />
        </div>
      </div>
    </div>
  );
}
