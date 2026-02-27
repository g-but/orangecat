'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { isLocationHidden, getLocationGroupLabel } from '@/lib/location-privacy';
import { ROUTES } from '@/config/routes';
import { Profile } from '@/types/database';
import Image from 'next/image';
import {
  Info,
  Edit,
  ArrowRight,
  User,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SocialLinksDisplay } from '@/components/profile/SocialLinksDisplay';
import { SocialLink } from '@/types/social';

/**
 * Dashboard Info Page - VIEW MODE
 *
 * Shows profile information in a clean, organized layout.
 * This is the default view when accessing "My Info" from the sidebar.
 * Users can click "Edit Profile" button to switch to edit mode.
 *
 * UX Principles:
 * - Clean, professional layout matching edit page quality
 * - Logical information architecture with clear sections
 * - No duplications - consolidated information display
 * - Easy to scan and understand
 */
export default function DashboardInfoPage() {
  const { user, profile: storeProfile, isLoading: authLoading } = useRequireAuth();
  const _router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyEdit, setShowStickyEdit] = useState(false);

  // Use profile from auth store instead of fetching
  useEffect(() => {
    if (!authLoading) {
      if (storeProfile) {
        setProfile(storeProfile);
      }
      setIsLoading(false);
    }
  }, [storeProfile, authLoading]);

  // Refresh profile after edits (called when returning from edit page)
  useEffect(() => {
    if (storeProfile) {
      setProfile(storeProfile);
    }
  }, [storeProfile]);

  // Handle sticky edit button visibility
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky button when scrolled past header
      const headerHeight = 120; // Approximate header height
      setShowStickyEdit(window.scrollY > headerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Loading state
  if (authLoading || isLoading) {
    return <Loading />;
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // No profile loaded yet – fall back to loading state instead of error to avoid flash
  if (!profile) {
    return <Loading />;
  }

  // Parse social links
  const socialLinks: SocialLink[] =
    profile.social_links &&
    typeof profile.social_links === 'object' &&
    'links' in profile.social_links
      ? (profile.social_links as { links: SocialLink[] }).links || []
      : [];

  const publicContactEmail = profile.contact_email || profile.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      {/* Sticky Edit Button - Mobile & Desktop */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          showStickyEdit
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <Link href={ROUTES.DASHBOARD.INFO_EDIT}>
          <Button
            size="sm"
            className="shadow-lg hover:shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 px-4 py-2 h-auto"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Info className="w-5 h-5 text-orange-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">My Profile</h1>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <p className="text-sm sm:text-base text-gray-600 ml-0 sm:ml-12 max-w-2xl">
              View your profile information. This is what others see on your public profile.
            </p>
            {/* Desktop Edit Button - Hidden on mobile since we have sticky button */}
            <div className="hidden sm:block">
              <Link href={ROUTES.DASHBOARD.INFO_EDIT}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg px-6 py-2.5 h-auto">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Main Content - 2/3 width on desktop */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Profile Overview */}
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

                    {/* Bio */}
                    {profile.bio && (
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                      <div className="flex justify-center sm:justify-start">
                        <SocialLinksDisplay links={socialLinks} compact={true} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Username</div>
                      <div className="font-medium text-gray-900">
                        {profile.username ? `@${profile.username}` : 'Not set'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Display Name</div>
                      <div className="font-medium text-gray-900">{profile.name || 'Not set'}</div>
                    </div>
                  </div>

                  {!isLocationHidden(profile.location_context || '') ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">
                          {getLocationGroupLabel(profile.location_context || '') ||
                            profile.location_search ||
                            profile.location ||
                            'Not set'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-300 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium text-gray-400">Hidden</div>
                      </div>
                    </div>
                  )}

                  {profile.created_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">Member Since</div>
                        <div className="font-medium text-gray-900">
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900">Online Presence</h3>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
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
                        className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="text-gray-400 italic">Not set</div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  {socialLinks.length > 0 ? (
                    <SocialLinksDisplay links={socialLinks} />
                  ) : (
                    <div className="text-gray-400 italic">No social links added</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Registration Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Registration Email</div>
                    <div className="font-medium text-gray-900 break-all">
                      {profile.email || user.email || 'Unknown'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Used for account login and security
                    </p>
                  </div>
                </div>

                {/* Public Contact Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Public Contact Email</div>
                    {publicContactEmail ? (
                      <a
                        href={`mailto:${publicContactEmail}`}
                        className="font-medium text-blue-600 hover:underline break-all"
                      >
                        {publicContactEmail}
                      </a>
                    ) : (
                      <div className="text-gray-400 italic">Not set</div>
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
                    ) : (
                      <div className="text-gray-400 italic">Not set</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
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

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {profile.username && (
                    <Link href={`/profiles/${profile.username}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        View Public Profile
                      </Button>
                    </Link>
                  )}
                  <Link href={ROUTES.DASHBOARD.WALLETS}>
                    <Button variant="outline" className="w-full justify-start">
                      Manage Wallets
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
