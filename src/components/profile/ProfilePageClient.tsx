'use client';

import { ScalableProfile, Project } from '@/types/database';
import ProfileLayout from '@/components/profile/ProfileLayout';

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
  return <ProfileLayout profile={profile} projects={projects} stats={stats} />;
}
