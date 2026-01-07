'use client';

import dynamic from 'next/dynamic';
import { ScalableProfile, Project } from '@/types/database';

// Dynamic import to keep initial payload small and preserve a skeleton
const ProfileLayout = dynamic(() => import('@/components/profile/ProfileLayout'), {
  ssr: false,
  loading: () => (
    <div className="max-w-5xl mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/2 bg-gray-100 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
        <div className="h-64 w-full bg-gray-100 rounded" />
      </div>
    </div>
  ),
});

interface ProfilePageClientProps {
  profile: ScalableProfile;
  projects?: Project[];
  stats: {
    projectCount: number;
    totalRaised: number;
    followerCount: number;
    followingCount: number;
    walletCount: number;
    // Entity counts for profile tabs
    productCount?: number;
    serviceCount?: number;
    causeCount?: number;
    eventCount?: number;
    loanCount?: number;
    assetCount?: number;
    aiAssistantCount?: number;
  };
}

export default function ProfilePageClient({ profile, projects, stats }: ProfilePageClientProps) {
  return (
    <ProfileLayout
      profile={profile}
      projects={projects}
      stats={stats}
    />
  );
}

