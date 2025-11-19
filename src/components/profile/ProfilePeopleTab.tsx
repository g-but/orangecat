'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, UserPlus } from 'lucide-react';
import { Profile } from '@/types/database';
import DefaultAvatar from '@/components/ui/DefaultAvatar';

interface ProfilePeopleTabProps {
  profile: Profile;
  isOwnProfile?: boolean;
}

interface Connection {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
}

/**
 * ProfilePeopleTab Component
 *
 * Displays user's connections (followers/following) in a tab context.
 * Shows people the user is connected with.
 */
export default function ProfilePeopleTab({ profile, isOwnProfile }: ProfilePeopleTabProps) {
  const [following, setFollowing] = useState<Connection[]>([]);
  const [followers, setFollowers] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'following' | 'followers'>('following');

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoading(true);

        // Fetch following
        const followingResponse = await fetch(`/api/social/following/${profile.id}`);
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          if (followingData.success && followingData.data) {
            // Extract profiles from nested structure
            const followingProfiles = followingData.data
              .map((item: any) => item.profiles)
              .filter((p: any) => p !== null);
            setFollowing(followingProfiles);
          }
        }

        // Fetch followers
        const followersResponse = await fetch(`/api/social/followers/${profile.id}`);
        if (followersResponse.ok) {
          const followersData = await followersResponse.json();
          if (followersData.success && followersData.data) {
            // Extract profiles from nested structure
            const followerProfiles = followersData.data
              .map((item: any) => item.profiles)
              .filter((p: any) => p !== null);
            setFollowers(followerProfiles);
          }
        }
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile.id) {
      fetchConnections();
    }
  }, [profile.id]);

  if (loading) {
    return <div className="text-gray-500 text-sm py-8 text-center">Loading connections...</div>;
  }

  const currentList = activeView === 'following' ? following : followers;
  const hasConnections = currentList.length > 0;

  return (
    <div className="space-y-6">
      {/* Toggle between Following and Followers */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView('following')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeView === 'following'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Following ({following.length})
        </button>
        <button
          onClick={() => setActiveView('followers')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeView === 'followers'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Followers ({followers.length})
        </button>
      </div>

      {/* Empty State */}
      {!hasConnections && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeView === 'following' ? 'No Following Yet' : 'No Followers Yet'}
          </h3>
          <p className="text-gray-600">
            {isOwnProfile
              ? activeView === 'following'
                ? 'Start following people to see them here'
                : 'When people follow you, they will appear here'
              : activeView === 'following'
                ? 'Not following anyone yet'
                : 'No followers yet'}
          </p>
        </div>
      )}

      {/* People List */}
      {hasConnections && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map(person => {
            // Skip if no username or id
            if (!person.username || !person.id) {
              console.warn('Person missing username or id:', person);
              return null;
            }

            return (
              <Link
                key={person.id}
                href={`/profiles/${person.username}`}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
              >
                {person.avatar_url ? (
                  <Image
                    src={person.avatar_url}
                    alt={person.name || person.username}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <DefaultAvatar size={48} className="rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {person.name || person.username}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">@{person.username}</p>
                  {person.bio && <p className="text-sm text-gray-600 line-clamp-2">{person.bio}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
