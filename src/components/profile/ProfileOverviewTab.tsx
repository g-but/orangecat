'use client';

import { ScalableProfile } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { User, Globe, Calendar, Mail, Phone } from 'lucide-react';
import { SocialLinksDisplay } from './SocialLinksDisplay';
import { SocialLink } from '@/types/social';
import { ROUTES } from '@/config/routes';

interface ProfileOverviewTabProps {
  profile: ScalableProfile;
  stats?: {
    projectCount: number;
    totalRaised: number;
  };
  /**
   * Whether the currently authenticated user is viewing their own profile.
   * Enables edit prompts and links in dashboard context.
   */
  isOwnProfile?: boolean;
  /**
   * Rendering context:
   * - "public": public profile view (default)
   * - "dashboard": /dashboard/info owner-focused view
   */
  context?: 'public' | 'dashboard';
}

/**
 * ProfileOverviewTab Component
 *
 * Shows profile bio, stats, and key information.
 * Default tab that loads immediately for fast initial view.
 */
export default function ProfileOverviewTab({
  profile,
  stats,
  isOwnProfile = false,
  context = 'public',
}: ProfileOverviewTabProps) {
  const isDashboardView = context === 'dashboard';
  const publicContactEmail = profile.contact_email || profile.email;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bio Section - always visible; prompts to fill in when empty */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            About
          </h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {profile.bio ? (
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {profile.bio}
            </p>
          ) : isOwnProfile && isDashboardView ? (
            <a
              href={`${ROUTES.DASHBOARD.INFO_EDIT}#bio`}
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group text-sm sm:text-base"
            >
              <span className="text-gray-400 italic group-hover:text-orange-600">
                Tell people more about yourself
              </span>
              <span className="text-xs uppercase tracking-wide">Add bio</span>
            </a>
          ) : (
            <p className="text-sm sm:text-base text-gray-400 italic">No bio yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                  {stats.projectCount}
                </div>
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

      {/* Online presence / credibility */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">Online presence</h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
          {/* Website */}
          <div className="flex items-center gap-3 text-gray-700">
            <Globe className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Website</div>
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm sm:text-base"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              ) : isOwnProfile && isDashboardView ? (
                <a
                  href={`${ROUTES.DASHBOARD.INFO_EDIT}#website`}
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline text-sm sm:text-base"
                >
                  <span className="text-gray-400 italic">Add a website</span>
                  <span className="text-xs uppercase tracking-wide">Edit</span>
                </a>
              ) : (
                <span className="text-sm sm:text-base text-gray-400 italic">
                  No website added yet.
                </span>
              )}
            </div>
          </div>

          {/* Social Media & Links */}
          <div className="pt-3 border-t border-gray-200">
            {profile.social_links &&
            typeof profile.social_links === 'object' &&
            'links' in profile.social_links &&
            profile.social_links.links &&
            Array.isArray(profile.social_links.links) &&
            (profile.social_links.links as SocialLink[]).length > 0 ? (
              <SocialLinksDisplay
                links={profile.social_links.links as SocialLink[]}
                compact={true}
              />
            ) : isOwnProfile && isDashboardView ? (
              <a
                href={`${ROUTES.DASHBOARD.INFO_EDIT}#socialLinks`}
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline text-sm sm:text-base"
              >
                <span className="text-gray-400 italic">Add social links or profiles</span>
                <span className="text-xs uppercase tracking-wide">Edit</span>
              </a>
            ) : (
              <span className="text-sm sm:text-base text-gray-400 italic">No links added yet.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact: how to reach this person */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold">Contact</h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
          {/* Contact Email (public) */}
          <div className="flex items-center gap-3 text-gray-700 pt-3 border-t border-gray-200">
            <Mail className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Contact email</div>
              {publicContactEmail ? (
                <a
                  href={`mailto:${publicContactEmail}`}
                  className="text-blue-600 hover:underline break-all text-sm sm:text-base"
                >
                  {publicContactEmail}
                </a>
              ) : isOwnProfile && isDashboardView ? (
                <a
                  href={`${ROUTES.DASHBOARD.INFO_EDIT}#contactEmail`}
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline text-sm sm:text-base"
                >
                  <span className="text-gray-400 italic">Add a public contact email</span>
                  <span className="text-xs uppercase tracking-wide">Edit</span>
                </a>
              ) : (
                <span className="text-sm sm:text-base text-gray-400 italic">
                  No public email added.
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm text-gray-500">Phone</div>
              {profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="text-blue-600 hover:underline text-sm sm:text-base"
                >
                  {profile.phone}
                </a>
              ) : isOwnProfile && isDashboardView ? (
                <a
                  href={`${ROUTES.DASHBOARD.INFO_EDIT}#phone`}
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline text-sm sm:text-base"
                >
                  <span className="text-gray-400 italic">Add a phone number</span>
                  <span className="text-xs uppercase tracking-wide">Edit</span>
                </a>
              ) : (
                <span className="text-sm sm:text-base text-gray-400 italic">
                  No phone number added.
                </span>
              )}
            </div>
          </div>

          {/* Joined Date (contextual meta) */}
          {profile.created_at && (
            <div className="flex items-center gap-3 text-gray-500 text-sm pt-3 border-t border-gray-200">
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
