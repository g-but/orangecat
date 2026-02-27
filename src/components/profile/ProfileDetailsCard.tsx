'use client';

import { User, MapPin, Globe, Calendar, Mail, Info, Clock, Phone } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SocialLinksDisplay } from './SocialLinksDisplay';
import { SocialLink } from '@/types/social';
import { format } from 'date-fns';
import { isLocationHidden } from '@/lib/location-privacy';
import { ProfileField } from './ProfileField';
import { ROUTES } from '@/config/routes';
import type { Profile as DatabaseProfile } from '@/types/database';

interface ProfileDetailsCardProps {
  profile: DatabaseProfile & { email?: string | null };
  isOwnProfile: boolean;
  userEmail?: string;
  isDashboardView: boolean;
}

export function ProfileDetailsCard({
  profile,
  isOwnProfile,
  userEmail,
  isDashboardView,
}: ProfileDetailsCardProps) {
  const joinDate = profile.created_at ? new Date(profile.created_at) : null;
  const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;
  const publicContactEmail = profile.contact_email || profile.email || userEmail || null;

  const locationValue = (() => {
    if (isLocationHidden(profile.location_context || '')) {
      return <div className="font-medium text-gray-400">Hidden</div>;
    }
    const label = profile.location_search || profile.location;
    return label ? <div className="font-medium text-gray-900">{label}</div> : undefined;
  })();

  const socialLinks =
    profile.social_links &&
    typeof profile.social_links === 'object' &&
    'links' in profile.social_links &&
    profile.social_links.links &&
    (profile.social_links.links as SocialLink[]).length > 0 ? (
      <SocialLinksDisplay links={profile.social_links.links as SocialLink[]} />
    ) : undefined;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-500" />
          {isDashboardView ? 'Profile & Account Details' : 'Profile Information'}
        </h3>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="profile-section-heading">
          <div className="mb-3">
            <h4
              id="profile-section-heading"
              className="text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              Profile
            </h4>
            <p className="mt-1 text-xs text-gray-500">Basic information about who you are.</p>
          </div>
          <div className="space-y-4">
            <ProfileField
              icon={User}
              label="Username"
              value={
                <div className="font-medium text-gray-900">@{profile.username || 'Not set'}</div>
              }
              isOwnProfile={isOwnProfile}
            />
            <ProfileField
              icon={User}
              label="Display Name"
              value={
                profile.name ? (
                  <div className="font-medium text-gray-900">{profile.name}</div>
                ) : undefined
              }
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#name`}
              isOwnProfile={isOwnProfile}
            />
            <ProfileField
              icon={Info}
              label="Bio"
              value={
                profile.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                ) : undefined
              }
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#bio`}
              isOwnProfile={isOwnProfile}
            />
            <ProfileField
              icon={MapPin}
              label="Location"
              value={locationValue}
              editHref={
                !isLocationHidden(profile.location_context || '')
                  ? `${ROUTES.DASHBOARD.INFO_EDIT}#location`
                  : undefined
              }
              isOwnProfile={isOwnProfile}
            />
          </div>
        </section>

        <section
          aria-labelledby="online-presence-section-heading"
          className="pt-6 border-t border-gray-200"
        >
          <div className="mb-3">
            <h4
              id="online-presence-section-heading"
              className="text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              Online Presence
            </h4>
            <p className="mt-1 text-xs text-gray-500">Where people can find you on the web.</p>
          </div>
          <div className="space-y-4">
            <ProfileField
              icon={Globe}
              label="Website"
              value={
                profile.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {profile.website}
                  </a>
                ) : undefined
              }
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#website`}
              isOwnProfile={isOwnProfile}
            />
            <ProfileField
              icon={Globe}
              label="Social Media & Links"
              value={socialLinks}
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#socialLinks`}
              emptyText="No links added yet"
              isOwnProfile={isOwnProfile}
            />
          </div>
        </section>

        <section
          aria-labelledby="contact-section-heading"
          className="pt-6 border-t border-gray-200"
        >
          <div className="mb-3">
            <h4
              id="contact-section-heading"
              className="text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              Contact Information
            </h4>
            <p className="mt-1 text-xs text-gray-500">How people can reach you.</p>
          </div>
          <div className="space-y-4">
            {isOwnProfile && (
              <ProfileField
                icon={Mail}
                label="Registration Email (private)"
                value={
                  <div>
                    <div className="font-medium text-gray-900 break-all">
                      {profile.email || userEmail || 'Unknown'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Used for account login. Not shown on public profile.
                    </p>
                  </div>
                }
                isOwnProfile={isOwnProfile}
              />
            )}
            <ProfileField
              icon={Mail}
              label={`Contact Email${isOwnProfile ? ' (public)' : ''}`}
              value={
                publicContactEmail ? (
                  <a
                    href={`mailto:${publicContactEmail}`}
                    className="font-medium text-blue-600 hover:underline break-all"
                  >
                    {publicContactEmail}
                  </a>
                ) : undefined
              }
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#contactEmail`}
              isOwnProfile={isOwnProfile}
            />
            <ProfileField
              icon={Phone}
              label="Phone"
              value={
                profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {profile.phone}
                  </a>
                ) : undefined
              }
              editHref={`${ROUTES.DASHBOARD.INFO_EDIT}#phone`}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </section>

        <section aria-labelledby="meta-section-heading" className="pt-6 border-t border-gray-200">
          <div className="mb-3">
            <h4
              id="meta-section-heading"
              className="text-sm font-semibold text-gray-900 uppercase tracking-wide"
            >
              Account Activity
            </h4>
          </div>
          <div className="space-y-3">
            {joinDate && (
              <ProfileField
                icon={Calendar}
                label="Member Since"
                value={
                  <div className="font-medium text-gray-900">
                    {format(joinDate, 'MMMM d, yyyy')}
                  </div>
                }
              />
            )}
            {lastActive && (
              <ProfileField
                icon={Clock}
                label="Last Active"
                value={
                  <div className="font-medium text-gray-900">
                    {format(lastActive, 'MMMM d, yyyy')}
                  </div>
                }
              />
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
