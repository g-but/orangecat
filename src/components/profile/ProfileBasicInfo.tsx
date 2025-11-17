'use client';

import { Globe, ExternalLink } from 'lucide-react';
import { ScalableProfile } from '@/types/database';

interface ProfileBasicInfoProps {
  profile: ScalableProfile;
}

/**
 * ProfileBasicInfo Component
 *
 * Displays profile name, username, bio, and website link.
 * Clean, focused component for basic profile information.
 */
export default function ProfileBasicInfo({ profile }: ProfileBasicInfoProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {profile.name || profile.username || 'User'}
        </h1>
        <p className="text-lg text-orange-600 font-medium mb-4">@{profile.username}</p>
        {profile.bio && (
          <p className="text-gray-600 text-base leading-relaxed mb-4">{profile.bio}</p>
        )}
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
    </div>
  );
}
