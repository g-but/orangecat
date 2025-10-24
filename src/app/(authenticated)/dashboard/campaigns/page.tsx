'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import EntityListPage from '@/components/entities/EntityListPage';
import { Target } from 'lucide-react';
import { useCampaignStore, Campaign } from '@/stores/campaignStore';
import Button from '@/components/ui/Button';

export default function ProjectsDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth();
  const router = useRouter();
  const { projects, loadProjects } = useCampaignStore();

  // Load projects when user is available (hook must be called before any returns)
  useEffect(() => {
    if (user?.id) {
      loadProjects(user.id);
    }
  }, [user?.id, loadProjects]);

  // Memoize items (hook must be called before any returns)
  const items = useMemo(() => projects, [projects]);

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen />;
  }

  // Handle unauthenticated state
  if (!user || !session) {
    router.push('/auth?from=projects');
    return <Loading fullScreen />;
  }

  return (
    <EntityListPage<Campaign>
      title="Projects"
      description="Manage your fundraising projects."
      icon={<Target className="w-5 h-5" />}
      primaryHref="/projects/create"
      primaryLabel="Create New Campaign"
      secondaryHref="/discover?section=projects"
      secondaryLabel="Browse Existing Projects"
      items={items}
      emptyTitle="No projects yet"
      emptyDescription="Start your fundraising journey by creating a project or exploring others."
      explanation="A project is a time-bound fundraising effort with a specific goal, aimed at raising Bitcoin for personal causes, community projects, or organizational needs."
      examples={[
        {
          title: 'Help John Pay Medical Bills',
          description:
            'A personal project to cover unexpected medical expenses through community support.',
        },
        {
          title: 'Food Bank Winter Drive 2025',
          description:
            'An organization-led initiative to collect donations for winter supplies and food distribution.',
        },
        {
          title: 'Open Source Project Funding',
          description:
            'A project to raise funds for developing and maintaining open-source Bitcoin software.',
        },
      ]}
      renderItem={c => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{c.title || 'Untitled Campaign'}</h3>
              {c.description ? (
                <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
              ) : null}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : c.isPaused ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {c.isActive ? 'Active' : c.isPaused ? 'Paused' : 'Draft'}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <span>
              {(c.total_funding || 0) > 0
                ? `${c.total_funding || 0} raised`
                : 'No funds raised yet'}
              {c.goal_amount ? ` of ${c.goal_amount}` : ''}
            </span>
          </div>
          <div className="pt-2 flex gap-2">
            {c.isActive ? (
              <Button href={`/fund-us/${c.id}`} size="sm" variant="outline">
                Open
              </Button>
            ) : (
              <Button href={`/projects/create?draft=${c.id}`} size="sm" variant="outline">
                Edit
              </Button>
            )}
          </div>
        </div>
      )}
    />
  );
}
