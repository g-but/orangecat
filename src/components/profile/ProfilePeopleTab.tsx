'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { Users, UserPlus, UserMinus, User } from 'lucide-react';
import { logger } from '@/utils/logger';
import Image from 'next/image';

interface ProfilePeopleTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}

interface FollowUser {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

/**
 * ProfilePeopleTab Component
 *
 * Displays followers and following lists for a profile.
 * Shows social connections and allows follow/unfollow actions.
 */
export default function ProfilePeopleTab({ profile, isOwnProfile }: ProfilePeopleTabProps) {
  const [activeView, setActiveView] = useState<'followers' | 'following'>('followers');
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, [profile.id]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load followers
      const followersResponse = await fetch(`/api/social/followers/${profile.id}`);
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData.data || []);
      }

      // Load following
      const followingResponse = await fetch(`/api/social/following/${profile.id}`);
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        setFollowing(followingData.data || []);
      }
    } catch (err) {
      logger.error('Error loading connections', err, 'ProfilePeopleTab');
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading connections</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayList = activeView === 'followers' ? followers : following;
  const emptyMessage = activeView === 'followers'
    ? `${isOwnProfile ? 'You have' : 'No'} no followers yet`
    : `${isOwnProfile ? 'You are' : 'Not'} not following anyone yet`;

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{followers.length}</div>
              <div className="text-sm text-gray-600 mt-1">
                {followers.length === 1 ? 'Follower' : 'Followers'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{following.length}</div>
              <div className="text-sm text-gray-600 mt-1">Following</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('followers')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeView === 'followers'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveView('following')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeView === 'following'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Following ({following.length})
        </button>
      </div>

      {/* People List */}
      {displayList.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium">{emptyMessage}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayList.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <a
                    href={`/profiles/${user.username || user.id}`}
                    className="flex-shrink-0"
                  >
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.name || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <DefaultAvatar size={48} className="rounded-full" />
                    )}
                  </a>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/profiles/${user.username || user.id}`}
                      className="font-semibold text-gray-900 hover:text-orange-600 transition-colors block truncate"
                    >
                      {user.name || 'Anonymous'}
                    </a>
                    {user.username && (
                      <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.location.href = `/profiles/${user.username || user.id}`;
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
