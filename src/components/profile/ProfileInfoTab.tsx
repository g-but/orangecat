'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Profile as DatabaseProfile, ProfileFormData } from '@/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  User,
  MapPin,
  Globe,
  Calendar,
  Mail,
  Twitter,
  Github,
  Info,
  Shield,
  Clock,
  Edit as EditIcon,
  Phone,
} from 'lucide-react';
import { SocialLinksDisplay } from './SocialLinksDisplay';
import { SocialLink } from '@/types/social';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import ModernProfileEditor from './ModernProfileEditor';

interface ProfileInfoTabProps {
  profile: DatabaseProfile & { email?: string | null };
  isOwnProfile?: boolean;
  userId?: string;
  userEmail?: string;
  onSave?: (data: ProfileFormData) => Promise<void>;
  /**
   * Context in which the info tab is rendered.
   * - "public": full public profile info (used on public profile pages)
   * - "dashboard": owner-focused view on /dashboard/info with less duplication
   */
  context?: 'public' | 'dashboard';
}

/**
 * ProfileInfoTab Component
 *
 * Shows detailed profile information including location, join date,
 * social links, and other metadata. Supports in-place editing for own profile.
 *
 * Best Practices:
 * - DRY: Reusable info display and edit mode
 * - Modular: Separate from overview, integrates ModernProfileEditor
 * - Progressive: Lazy loaded on first click
 * - Mobile-first: Edit in context without navigation
 */
export default function ProfileInfoTab({
  profile,
  isOwnProfile = false,
  userId,
  userEmail,
  onSave,
  context = 'public',
}: ProfileInfoTabProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const joinDate = profile.created_at ? new Date(profile.created_at) : null;
  const lastActive = profile.updated_at ? new Date(profile.updated_at) : null;
  const isDashboardView = context === 'dashboard';
  const publicContactEmail = profile.contact_email || profile.email || userEmail || null;

  // Handle save from editor
  const handleSave = async (data: ProfileFormData) => {
    if (onSave) {
      try {
        await onSave(data);
        // Only switch back to view mode if save succeeded
        setMode('view');
      } catch (error) {
        // Error is already handled by onSave (toast shown)
        // Stay in edit mode so user can try again
        console.error('Failed to save profile:', error);
      }
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setMode('view');
  };

  // If in edit mode and we have required props, show editor
  if (mode === 'edit' && isOwnProfile && userId && onSave) {
    return (
      <div className="space-y-6">
        <ModernProfileEditor
          profile={profile as any}
          userId={userId}
          userEmail={userEmail}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      {/* Edit Button (only for own profile) */}
      {isOwnProfile && userId && onSave && (
        <div className="flex justify-end">
          <Button onClick={() => setMode('edit')} variant="outline">
            <EditIcon className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      )}

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-gray-500" />
            {isDashboardView ? 'Profile & Account Details' : 'Profile Information'}
          </h3>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* SECTION 1: Profile (username, name, bio, location) */}
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
              {/* Username - Always show, with @ prefix */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">@{profile.username || 'Not set'}</div>
                </div>
              </div>

              {/* Display Name - Always show */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Display Name</div>
                  {profile.name ? (
                    <div className="font-medium text-gray-900">{profile.name}</div>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#name"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">Not filled out yet</div>
                  )}
                </div>
              </div>

              {/* Bio - always part of profile section; in dashboard it may also appear in overview */}
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Bio</div>
                  {profile.bio ? (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {profile.bio}
                    </p>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#bio"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <p className="text-gray-400 italic">Not filled out yet</p>
                  )}
                </div>
              </div>

              {/* Location - Always show */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Location</div>
                  {profile.location_search || profile.location ? (
                    <div className="font-medium text-gray-900">
                      {profile.location_search || profile.location}
                    </div>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#location"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">Not filled out yet</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Online presence (website, social media, other links) */}
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
              {/* Website */}
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Website</div>
                  {profile.website ? (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline break-all"
                    >
                      {profile.website}
                    </a>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#website"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">Not filled out yet</div>
                  )}
                </div>
              </div>

              {/* Social Media & Links */}
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-2">Social Media & Links</div>
                  {profile.social_links &&
                  typeof profile.social_links === 'object' &&
                  'links' in profile.social_links &&
                  profile.social_links.links &&
                  profile.social_links.links.length > 0 ? (
                    <SocialLinksDisplay links={profile.social_links.links as SocialLink[]} />
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#socialLinks"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        No links added yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">No links added yet</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Contact information (registration email, contact email, phone) */}
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
              <p className="mt-1 text-xs text-gray-500">
                How people can reach you, and which email is used for your account.
              </p>
            </div>

            <div className="space-y-4">
              {/* Registration / Account Email (only for own profile) */}
              {isOwnProfile && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Registration Email (private)</div>
                    <div className="font-medium text-gray-900 break-all">
                      {profile.email || userEmail || 'Unknown'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Used for account login and security. This is not shown on your public profile.
                    </p>
                  </div>
                </div>
              )}

              {/* Public Contact Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">
                    Contact Email {isOwnProfile && '(public)'}
                  </div>
                  {publicContactEmail ? (
                    <a
                      href={`mailto:${publicContactEmail}`}
                      className="font-medium text-blue-600 hover:underline break-all"
                    >
                      {publicContactEmail}
                    </a>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#contactEmail"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">Not filled out yet</div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Phone</div>
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {profile.phone}
                    </a>
                  ) : isOwnProfile ? (
                    <Link
                      href="/dashboard/info/edit#phone"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
                    >
                      <span className="text-gray-400 italic group-hover:text-orange-600">
                        Not filled out yet
                      </span>
                      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-xs">Click to add</span>
                    </Link>
                  ) : (
                    <div className="text-gray-400 italic">Not filled out yet</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Meta: Join Date & Last Active */}
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
              {/* Join Date */}
              {joinDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Member Since</div>
                    <div className="font-medium text-gray-900">
                      {format(joinDate, 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {/* Last Active */}
              {lastActive && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Last Active</div>
                    <div className="font-medium text-gray-900">
                      {format(lastActive, 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Account Status
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email Verified</span>
            <span className={profile.email ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {profile.email ? '✓ Verified' : 'Not verified'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Profile Complete</span>
            <span className="text-green-600 font-medium">
              {profile.bio && profile.avatar_url ? '✓ Complete' : 'In Progress'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
