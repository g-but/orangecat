'use client';

import type { ScalableProfile } from '@/services/profile/types';
import { Project } from '@/types/database';
import ProfileLayout from '@/components/profile/ProfileLayout';
import type { EntityType } from '@/config/entity-registry';
import type { Article } from '@/services/articles/types';
import type { EconomicProfile } from '@/services/cat/economic-profile';

interface ProfilePageClientProps {
  profile: ScalableProfile;
  projects?: Project[];
  articles?: Article[];
  isOwnProfile?: boolean;
  economicProfile?: EconomicProfile | null;
  stats: {
    projectCount: number;
    totalRaised: number;
    followerCount: number;
    followingCount: number;
    walletCount: number;
    entityCounts?: Partial<Record<EntityType, number>>;
  };
}

export default function ProfilePageClient({
  profile,
  projects,
  articles,
  isOwnProfile,
  economicProfile,
  stats,
}: ProfilePageClientProps) {
  return (
    <ProfileLayout
      profile={profile}
      projects={projects}
      articles={articles}
      stats={stats}
      serverIsOwnProfile={isOwnProfile}
      economicProfile={economicProfile}
    />
  );
}
