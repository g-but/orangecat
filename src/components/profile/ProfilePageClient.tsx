'use client';

import { ScalableProfile, Project } from '@/types/database';
import ProfileLayout from '@/components/profile/ProfileLayout';

interface ProfilePageClientProps {
  profile: ScalableProfile;
  projects?: Project[];
  isOwnProfile?: boolean;
  stats: {
    projectCount: number;
    totalRaised: number;
    followerCount: number;
    followingCount: number;
    walletCount: number;
    productCount?: number;
    serviceCount?: number;
    causeCount?: number;
    eventCount?: number;
    loanCount?: number;
    assetCount?: number;
    aiAssistantCount?: number;
  };
}

export default function ProfilePageClient({
  profile,
  projects,
  isOwnProfile,
  stats,
}: ProfilePageClientProps) {
  return (
    <ProfileLayout
      profile={profile}
      projects={projects}
      stats={stats}
      serverIsOwnProfile={isOwnProfile}
    />
  );
}
