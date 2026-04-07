'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import { ROUTES } from '@/config/routes';
import { Profile } from '@/types/database';
import { Info, Edit, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { SocialLink } from '@/types/social';
import ProfileOverviewCard from './components/ProfileOverviewCard';
import BasicInformationCard from './components/BasicInformationCard';
import OnlinePresenceCard from './components/OnlinePresenceCard';
import InfoSidebar from './components/InfoSidebar';

export default function DashboardInfoPage() {
  const { user, profile: storeProfile, isLoading: authLoading } = useRequireAuth();
  const _router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStickyEdit, setShowStickyEdit] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (storeProfile) {
        setProfile(storeProfile);
      }
      setIsLoading(false);
    }
  }, [storeProfile, authLoading]);

  useEffect(() => {
    if (storeProfile) {
      setProfile(storeProfile);
    }
  }, [storeProfile]);

  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = 120;
      setShowStickyEdit(window.scrollY > headerHeight);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (authLoading || isLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return <Loading />;
  }

  const socialLinks: SocialLink[] =
    profile.social_links &&
    typeof profile.social_links === 'object' &&
    'links' in profile.social_links
      ? (profile.social_links as { links: SocialLink[] }).links || []
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      {/* Sticky Edit Button */}
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
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <ProfileOverviewCard profile={profile} socialLinks={socialLinks} />
            <BasicInformationCard profile={profile} />
            <OnlinePresenceCard profile={profile} socialLinks={socialLinks} />
          </div>

          {/* Sidebar */}
          <InfoSidebar profile={profile} userEmail={user.email} />
        </div>
      </div>
    </div>
  );
}
