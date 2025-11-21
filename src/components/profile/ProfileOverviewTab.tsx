'use client';

import { Profile } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { User, MapPin, Globe, Calendar, Bitcoin, Zap } from 'lucide-react';

interface ProfileOverviewTabProps {
  profile: Profile;
  stats?: {
    projectCount: number;
    totalRaised: number;
  };
}

/**
 * ProfileOverviewTab Component
 *
 * Shows profile bio, stats, and key information.
 * Default tab that loads immediately for fast initial view.
 */
export default function ProfileOverviewTab({ profile, stats }: ProfileOverviewTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bio Section */}
      {profile.bio && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              About
            </h3>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{stats.projectCount}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  {stats.projectCount === 1 ? 'Project' : 'Projects'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                  ₿{(stats.totalRaised / 100000000).toFixed(8)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Raised</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">Contact</h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
          {profile.website && (
            <div className="flex items-center gap-3 text-gray-700">
              <Globe className="w-5 h-5 text-gray-400" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {profile.bitcoin_address && (
            <div className="flex items-start gap-2 sm:gap-3 text-gray-700">
              <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <code className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto break-all">
                {profile.bitcoin_address}
              </code>
            </div>
          )}

          {profile.lightning_address && (
            <div className="flex items-start gap-2 sm:gap-3 text-gray-700">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <code className="text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded flex-1 overflow-x-auto break-all">
                {profile.lightning_address}
              </code>
            </div>
          )}

          {profile.created_at && (
            <div className="flex items-center gap-3 text-gray-500 text-sm pt-2 border-t">
              <Calendar className="w-4 h-4" />
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
