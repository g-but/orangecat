'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { SearchProfile } from '@/services/search';
import { ROUTES } from '@/config/routes';

interface ProfileCardProps {
  profile: SearchProfile;
  viewMode?: 'grid' | 'list';
}

export default function ProfileCard({ profile, viewMode = 'grid' }: ProfileCardProps) {
  const displayName = profile.name || profile.username || 'Anonymous';

  const TypeBadge = () => (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tiffany-100 text-tiffany-700 border border-tiffany-200">
      <Users className="w-3 h-3 mr-1" />
      Person
    </div>
  );

  if (viewMode === 'list') {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-tiffany-100 to-tiffany-200 flex-shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-tiffany-600 font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
                <h3 className="font-semibold text-gray-900 hover:text-tiffany-600 transition-colors truncate">
                  {displayName}
                </h3>
              </Link>
              <TypeBadge />
            </div>
            {profile.username && (
              <p className="text-sm text-gray-600 truncate">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
            )}
          </div>

          <div className="flex-shrink-0">
            <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
              <Button size="sm" variant="outline">
                <ExternalLink className="w-3 h-3 mr-1" />
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="text-center">
        <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-tiffany-100 to-tiffany-200 mx-auto mb-4">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} fill className="object-cover" />
            ) : (
              <DefaultAvatar size={80} className="rounded-full" />
            )}
          </div>
        </Link>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
            <h3 className="font-semibold text-gray-900 hover:text-tiffany-600 transition-colors">
              {displayName}
            </h3>
          </Link>
          <TypeBadge />
        </div>

        {profile.username && <p className="text-sm text-gray-600 mb-3">@{profile.username}</p>}

        {profile.bio && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{profile.bio}</p>}

        <Link href={ROUTES.PROFILES.VIEW(profile.username || profile.id)}>
          <Button size="sm" variant="outline" className="w-full">
            <ExternalLink className="w-3 h-3 mr-1" />
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}
