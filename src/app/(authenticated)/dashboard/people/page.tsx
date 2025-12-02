'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, UserPlus, UserMinus, Search, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  bitcoin_address: string | null;
  lightning_address: string | null;
}

interface Connection {
  profile: Profile;
  created_at: string;
}

export default function PeoplePage() {
  const { user, isLoading: authLoading, hydrated, session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (hydrated && !authLoading && (!user || !session)) {
      router.push('/auth?from=/dashboard/people');
    }
  }, [user, session, hydrated, authLoading, router]);

  const loadConnections = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    try {
      // Load both following and followers in parallel
      const [followingRes, followersRes] = await Promise.all([
        fetch(`/api/social/following/${user.id}`),
        fetch(`/api/social/followers/${user.id}`),
      ]);

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        if (followingData.success) {
          // Transform API response to Connection format
          // API returns: { data: { data: [...], pagination: {...} } }
          const transformed = (followingData.data?.data || [])
            .map((item: any) => {
              // Handle both nested profiles object and direct profile data
              const profileData = item.profiles || (item.following_id ? null : item);
              if (!profileData) {
                logger.warn('Missing profile data in following response', { item }, 'PeoplePage');
                return null;
              }
              return {
                profile: {
                  id: profileData.id || item.following_id,
                  username: profileData.username,
                  name: profileData.name,
                  avatar_url: profileData.avatar_url,
                  bio: profileData.bio,
                  bitcoin_address: profileData.bitcoin_address,
                  lightning_address: profileData.lightning_address,
                },
                created_at: item.created_at,
              };
            })
            .filter(Boolean) as Connection[];
          setFollowing(transformed);
        }
      }

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        if (followersData.success) {
          // Transform API response to Connection format
          // API returns: { data: { data: [...], pagination: {...} } }
          const transformed = (followersData.data?.data || [])
            .map((item: any) => {
              // Handle both nested profiles object and direct profile data
              const profileData = item.profiles || (item.follower_id ? null : item);
              if (!profileData) {
                logger.warn('Missing profile data in followers response', { item }, 'PeoplePage');
                return null;
              }
              return {
                profile: {
                  id: profileData.id || item.follower_id,
                  username: profileData.username,
                  name: profileData.name,
                  avatar_url: profileData.avatar_url,
                  bio: profileData.bio,
                  bitcoin_address: profileData.bitcoin_address,
                  lightning_address: profileData.lightning_address,
                },
                created_at: item.created_at,
              };
            })
            .filter(Boolean) as Connection[];
          setFollowers(transformed);
        }
      }
    } catch (error) {
      logger.error('Failed to load connections', { error }, 'PeoplePage');
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load connections
  useEffect(() => {
    if (user?.id && hydrated) {
      loadConnections();
    }
  }, [user?.id, hydrated, loadConnections]);

  const handleFollow = async (profileId: string) => {
    if (!user?.id) {
      return;
    }

    setFollowingLoading(profileId);
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profileId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Connected!');
        // Reload connections
        loadConnections();
      } else {
        throw new Error(data.error || 'Failed to connect');
      }
    } catch (error) {
      logger.error('Failed to follow user', { error, profileId }, 'PeoplePage');
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setFollowingLoading(null);
    }
  };

  const handleUnfollow = async (profileId: string) => {
    if (!user?.id) {
      return;
    }

    setFollowingLoading(profileId);
    try {
      const response = await fetch('/api/social/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: profileId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Disconnected');
        // Reload connections
        loadConnections();
      } else {
        throw new Error(data.error || 'Failed to disconnect');
      }
    } catch (error) {
      logger.error('Failed to unfollow user', { error, profileId }, 'PeoplePage');
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
    } finally {
      setFollowingLoading(null);
    }
  };

  const isFollowing = (profileId: string) => {
    return following.some(conn => conn.profile.id === profileId);
  };

  if (!hydrated || authLoading || isLoading) {
    return <Loading fullScreen />;
  }

  if (!user || !session) {
    return null; // Will redirect
  }

  const connections = activeTab === 'following' ? following : followers;
  const emptyMessage =
    activeTab === 'following'
      ? "You haven't connected with anyone yet. Start building your Bitcoin network!"
      : 'No one has connected with you yet. Share your profile to get started!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">People</h1>
          </div>
          <p className="text-gray-600">
            Connect with Bitcoin enthusiasts and easily access their profiles to send Bitcoin
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-3">
          <Link href="/discover?section=people">
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Discover People
            </Button>
          </Link>
        </div>

        {/* Connections List */}
        {connections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600 mb-6">{emptyMessage}</p>
              <Link href="/discover?section=people">
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Discover People
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map(connection => {
              const profile = connection.profile;
              const displayName = profile.name || profile.username || 'Anonymous';
              const isUserFollowing = isFollowing(profile.id);
              const isLoading = followingLoading === profile.id;

              return (
                <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Link href={`/profile/${profile.username || profile.id}`}>
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 flex-shrink-0">
                          {profile.avatar_url ? (
                            <Image
                              src={profile.avatar_url}
                              alt={displayName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-orange-600 font-semibold text-xl">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${profile.username || profile.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate">
                            {displayName}
                          </h3>
                        </Link>
                        {profile.username && (
                          <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                        )}
                        {profile.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {activeTab === 'followers' && !isUserFollowing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFollow(profile.id)}
                              disabled={isLoading}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              Follow
                            </Button>
                          )}
                          {isUserFollowing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnfollow(profile.id)}
                              disabled={isLoading}
                            >
                              <UserMinus className="w-3 h-3 mr-1" />
                              Unfollow
                            </Button>
                          )}
                          {(profile.bitcoin_address || profile.lightning_address) && (
                            <Link href={`/profile/${profile.username || profile.id}`}>
                              <Button size="sm" variant="outline">
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Send BTC
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
