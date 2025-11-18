'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { User, Users, UserPlus, Globe, Calendar, Bitcoin, Zap, Target } from 'lucide-react';

interface ProfileOverviewTabProps {
  profile: Profile;
  stats?: {
    projectCount: number;
    totalRaised: number;
  };
}

interface SocialStats {
  followers: number;
  following: number;
}

/**
 * ProfileOverviewTab Component
 *
 * Shows profile bio, social stats, project stats, and key information.
 * Default tab that loads immediately for fast initial view.
 */
export default function ProfileOverviewTab({ profile, stats }: ProfileOverviewTabProps) {
  const [socialStats, setSocialStats] = useState<SocialStats>({ followers: 0, following: 0 });
  const [loadingSocial, setLoadingSocial] = useState(true);

  // Load social stats
  useEffect(() => {
    const loadSocialStats = async () => {
      try {
        setLoadingSocial(true);

        const [followersRes, followingRes] = await Promise.all([
          fetch(`/api/social/followers/${profile.id}`),
          fetch(`/api/social/following/${profile.id}`),
        ]);

        const [followersData, followingData] = await Promise.all([
          followersRes.json(),
          followingRes.json(),
        ]);

        setSocialStats({
          followers: followersData.pagination?.total || 0,
          following: followingData.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to load social stats:', error);
      } finally {
        setLoadingSocial(false);
      }
    };

    loadSocialStats();
  }, [profile.id]);

  return (
    <div className="space-y-6">
      {/* Bio Section */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              About
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Mobile Friendly */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Followers */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {loadingSocial ? '...' : socialStats.followers}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                {socialStats.followers === 1 ? 'Follower' : 'Followers'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Following */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="text-center">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-teal-500" />
              <div className="text-2xl sm:text-3xl font-bold text-teal-600">
                {loadingSocial ? '...' : socialStats.following}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Following</div>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        {stats && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="text-center">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.projectCount}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  {stats.projectCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Raised */}
        {stats && stats.totalRaised > 0 && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 pb-4">
              <div className="text-center">
                <Bitcoin className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  ₿{(stats.totalRaised / 100000000).toFixed(4)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Raised</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact & Payment Information */}
      <Card>
        <CardHeader>
          <h3 className="text-base sm:text-lg font-semibold">Contact & Payment</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.website && (
            <div className="flex items-start gap-3 text-gray-700">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Website</p>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base text-blue-600 hover:underline break-all"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}

          {profile.bitcoin_address && (
            <div className="flex items-start gap-3 text-gray-700">
              <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Bitcoin Address</p>
                <code className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded block break-all">
                  {profile.bitcoin_address}
                </code>
              </div>
            </div>
          )}

          {profile.lightning_address && (
            <div className="flex items-start gap-3 text-gray-700">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Lightning Address</p>
                <code className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded block break-all">
                  {profile.lightning_address}
                </code>
              </div>
            </div>
          )}

          {profile.created_at && (
            <div className="flex items-center gap-3 text-gray-500 text-xs sm:text-sm pt-2 border-t">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>
                Joined{' '}
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
