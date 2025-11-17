'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit, Users, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import ProfileShare from '@/components/sharing/ProfileShare';
import { cn } from '@/lib/utils';

interface ProfileActionsProps {
  profileId: string;
  username: string;
  profileName: string;
  profileBio?: string | null;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onEditClick?: () => void;
}

/**
 * ProfileActions Component
 *
 * Handles Share, Edit Profile, and Follow/Unfollow actions.
 * Positioned absolutely in the banner area.
 */
export default function ProfileActions({
  profileId,
  username,
  profileName,
  profileBio,
  isOwnProfile,
  isFollowing: initialIsFollowing = false,
  onEditClick,
}: ProfileActionsProps) {
  const [showShare, setShowShare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const endpoint = isFollowing ? '/api/social/unfollow' : '/api/social/follow';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profileId }),
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

  // Close share dropdown when clicking outside or pressing ESC
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

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showShare) {
        setShowShare(false);
      }
    };

    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showShare]);

  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
      {/* Share Button - Always visible */}
      <div className="relative" ref={shareButtonRef}>
        <Button
          onClick={() => setShowShare(!showShare)}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg min-h-[44px]"
          aria-label="Share profile"
          aria-expanded={showShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          <span>Share</span>
        </Button>
        {showShare && (
          <div ref={shareDropdownRef} className="absolute top-full right-0 mt-2 z-50">
            <ProfileShare
              username={username}
              profileName={profileName}
              profileBio={profileBio || undefined}
              onClose={() => setShowShare(false)}
            />
          </div>
        )}
      </div>

      {/* Edit Profile Button - Own profile only */}
      {isOwnProfile && onEditClick && (
        <Button
          onClick={onEditClick}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg min-h-[44px]"
          aria-label="Edit profile"
        >
          <Edit className="w-4 h-4 mr-2" />
          <span>Edit Profile</span>
        </Button>
      )}

      {/* Follow/Unfollow Button - Other profiles only */}
      {!isOwnProfile && (
        <Button
          onClick={handleFollowToggle}
          disabled={isFollowLoading}
          className={cn(
            'shadow-lg min-h-[44px]',
            isFollowing
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          )}
          aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
          aria-busy={isFollowLoading}
        >
          <Users className="w-4 h-4 mr-2" />
          <span>{isFollowLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}</span>
        </Button>
      )}
    </div>
  );
}
