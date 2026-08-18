'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import { SearchProfile } from '@/services/search';
import { ROUTES } from '@/config/routes';
import { MAKER_STATUS_METADATA, isMakerStatus } from '@/config/maker-status';

interface ProfileCardProps {
  profile: SearchProfile;
  viewMode?: 'grid' | 'list';
}

/**
 * A person result. One tap target for the whole card (the entire card is
 * the link, not a separate "View Profile" button nested inside it) — the
 * only decision a visitor makes here is "open this profile or not". Visual
 * weight follows the same order a visitor reads in: name first, @handle as
 * quiet secondary identity, status/bio last and smallest.
 */
export default function ProfileCard({ profile, viewMode = 'grid' }: ProfileCardProps) {
  const displayName = profile.name || profile.username || 'Anonymous';
  const href = ROUTES.PROFILES.VIEW(profile.username || profile.id);
  const hasStatus = isMakerStatus(profile.current_status);

  const TypeBadge = () => (
    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-border-subtle bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-fg-tertiary">
      <Users className="h-3 w-3" aria-hidden="true" />
      Person
    </span>
  );

  const StatusBadge = () =>
    hasStatus ? (
      <span className="inline-flex items-center rounded-full border border-default bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-fg-secondary">
        {MAKER_STATUS_METADATA[profile.current_status].label}
      </span>
    ) : null;

  const Avatar = ({ size }: { size: number }) =>
    profile.avatar_url ? (
      <div
        className="relative flex-shrink-0 overflow-hidden rounded-full bg-surface-raised"
        style={{ width: size, height: size }}
      >
        <Image
          src={profile.avatar_url}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>
    ) : (
      <DefaultAvatar size={size} className="flex-shrink-0" />
    );

  if (viewMode === 'list') {
    return (
      <Link href={href} aria-label={displayName} className="block">
        <Card className="oc-card-link p-4">
          <div className="flex items-center gap-4">
            <Avatar size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3 className="truncate text-base font-semibold text-fg-primary">{displayName}</h3>
                {profile.username && (
                  <span className="truncate text-sm text-fg-tertiary">@{profile.username}</span>
                )}
                <TypeBadge />
              </div>
              {(hasStatus || profile.bio) && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge />
                  {profile.bio && (
                    <p className="line-clamp-1 text-sm text-fg-secondary">{profile.bio}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={href} aria-label={displayName} className="block h-full">
      <Card className="oc-card-link h-full p-6">
        <div className="flex h-full flex-col items-center text-center">
          <Avatar size={72} />

          <h3 className="mt-4 line-clamp-1 text-base font-semibold text-fg-primary">
            {displayName}
          </h3>
          {profile.username && (
            <p className="mt-0.5 truncate text-sm text-fg-tertiary">@{profile.username}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <TypeBadge />
            <StatusBadge />
          </div>

          {profile.bio && (
            <p className="mt-3 line-clamp-3 text-sm text-fg-secondary">{profile.bio}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
