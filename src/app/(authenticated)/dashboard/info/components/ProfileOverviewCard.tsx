import Image from 'next/image';
import { User, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { SocialLinksDisplay } from '@/components/profile/SocialLinksDisplay';
import { isLocationHidden, getLocationGroupLabel } from '@/lib/location-privacy';
import type { Profile } from '@/types/database';
import type { SocialLink } from '@/types/social';

interface ProfileOverviewCardProps {
  profile: Profile;
  socialLinks: SocialLink[];
}

export default function ProfileOverviewCard({ profile, socialLinks }: ProfileOverviewCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name || profile.username || 'Profile'}
                width={96}
                height={96}
                className="w-24 h-24 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-orange-100 border-4 border-white shadow-lg flex items-center justify-center mx-auto sm:mx-0">
                <User className="w-10 h-10 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {profile.name || profile.username || 'Anonymous User'}
              </h2>
              {profile.username && (
                <p className="text-gray-600 text-sm sm:text-base">@{profile.username}</p>
              )}
              {!isLocationHidden(profile.location_context || '') && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">
                    {getLocationGroupLabel(profile.location_context || '') ||
                      profile.location_search}
                  </span>
                </div>
              )}
            </div>

            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {profile.bio}
                </p>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="flex justify-center sm:justify-start">
                <SocialLinksDisplay links={socialLinks} compact={true} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
