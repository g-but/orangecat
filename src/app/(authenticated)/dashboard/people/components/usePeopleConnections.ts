import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import type { Profile } from '@/types/profile';

export interface Connection {
  profile: Profile;
  created_at: string;
}

interface ConnectionResponseItem {
  following_id?: string;
  follower_id?: string;
  created_at: string;
  profiles?: Profile;
  id?: string;
  username?: string;
  name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  bitcoin_address?: string;
  lightning_address?: string;
}

function transformConnectionItem(
  item: ConnectionResponseItem,
  idField: 'following_id' | 'follower_id',
  logContext: string
): Connection | null {
  const profileData = item.profiles || (item[idField] ? null : (item as unknown as Profile));
  if (!profileData) {
    logger.warn(`Missing profile data in ${logContext} response`, { item }, 'PeoplePage');
    return null;
  }
  return {
    profile: {
      id: (profileData as Profile).id || item[idField] || '',
      username: (profileData as Profile).username,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: (profileData as Profile).name || (profileData as any).display_name || null,
      avatar_url: (profileData as Profile).avatar_url,
      bio: (profileData as Profile).bio,
      bitcoin_address: (profileData as Profile).bitcoin_address,
      lightning_address: (profileData as Profile).lightning_address,
      created_at: (profileData as Profile).created_at || item.created_at,
      updated_at: (profileData as Profile).updated_at || item.created_at,
    },
    created_at: item.created_at,
  };
}

function parseResponseArray(data: { success?: boolean; data?: unknown }): ConnectionResponseItem[] {
  if (!data.success) return [];
  const raw = data.data;
  if (Array.isArray(raw)) return raw as ConnectionResponseItem[];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const nested = (raw as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as ConnectionResponseItem[];
  }
  return [];
}

export function usePeopleConnections(userId: string | undefined, hydrated: boolean) {
  const [following, setFollowing] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [allUsers, setAllUsers] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [followingRes, followersRes, allRes] = await Promise.all([
        fetch(`/api/social/following/${userId}`, { credentials: 'same-origin' }),
        fetch(`/api/social/followers/${userId}`, { credentials: 'same-origin' }),
        fetch(`/api/profiles?limit=100`, { credentials: 'same-origin' }),
      ]);

      if (followingRes.ok) {
        const data = await followingRes.json();
        const items = parseResponseArray(data);
        setFollowing(
          items
            .map(item => transformConnectionItem(item, 'following_id', 'following'))
            .filter(Boolean) as Connection[]
        );
      }

      if (followersRes.ok) {
        const data = await followersRes.json();
        const items = parseResponseArray(data);
        setFollowers(
          items
            .map(item => transformConnectionItem(item, 'follower_id', 'followers'))
            .filter(Boolean) as Connection[]
        );
      }

      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.success) {
          const arr = Array.isArray(allData.data?.data) ? allData.data.data : [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformed: Connection[] = arr.map((p: any) => ({
            profile: {
              id: p.id,
              username: p.username,
              name: p.name,
              avatar_url: p.avatar_url,
              bio: p.bio,
              bitcoin_address: p.bitcoin_address,
              lightning_address: p.lightning_address,
              created_at: p.created_at || '',
              updated_at: p.updated_at || p.created_at || '',
            },
            created_at: p.created_at,
          }));
          setAllUsers(transformed);
        }
      }
    } catch (error) {
      logger.error('Failed to load connections', { error }, 'PeoplePage');
      toast.error('Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && hydrated) {
      loadConnections();
    }
  }, [userId, hydrated, loadConnections]);

  const handleFollow = async (profileId: string) => {
    if (!userId) return;
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
    if (!userId) return;
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

  return {
    following,
    followers,
    allUsers,
    isLoading,
    followingLoading,
    handleFollow,
    handleUnfollow,
    isFollowing,
  };
}
