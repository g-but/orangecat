'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import EntityListPage from '@/components/entities/EntityListPage';
import { Building } from 'lucide-react';
import Button from '@/components/ui/Button';

type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export default function OrganizationsDashboardPage() {
  const { user, hydrated, isLoading } = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/profiles/${user.id}/organizations`);
        if (!res.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const json = await res.json();
        setOrgs(json.data || []);
      } catch (e) {
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (!hydrated || isLoading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    router.push('/auth');
    return <Loading fullScreen />;
  }

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <EntityListPage<Organization>
      title="Organizations"
      description="Manage your organizations and communities."
      icon={<Building className="w-5 h-5" />}
      primaryHref="/organizations/create"
      primaryLabel="Create New Organization"
      secondaryHref="/discover?section=organizations"
      secondaryLabel="Browse Existing Organizations"
      items={orgs}
      emptyTitle="No organizations yet"
      emptyDescription="Create an organization to collaborate with others or discover communities to join."
      explanation="An organization is a collective entity managed by multiple people, representing groups like nonprofits, companies, or DAOs for shared fundraising and management."
      examples={[
        {
          title: 'Red Cross',
          description:
            'A global humanitarian organization providing emergency assistance and disaster relief.',
        },
        {
          title: 'Local Food Bank',
          description: 'A community organization distributing food to those in need.',
        },
        {
          title: 'Open Source Project Foundation',
          description: 'A foundation supporting open-source software development.',
        },
      ]}
      renderItem={o => (
        <div>
          <div className="font-semibold text-gray-900">{o.name}</div>
          {o.description ? (
            <p className="text-sm text-gray-600 line-clamp-2">{o.description}</p>
          ) : null}
          <div className="pt-2">
            <Button href={`/organizations/${o.slug || o.id}`} size="sm" variant="outline">
              Open
            </Button>
          </div>
        </div>
      )}
    />
  );
}
