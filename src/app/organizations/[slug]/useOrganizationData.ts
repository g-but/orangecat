import { useEffect, useState } from 'react';
import type { OrganizationGroup, OrganizationMember, OrganizationProposal } from './types';

interface UseOrganizationDataOptions {
  fetchProposals?: boolean;
  proposalsLimit?: number;
}

interface OrganizationData {
  group: OrganizationGroup | null;
  members: OrganizationMember[];
  proposals: OrganizationProposal[];
  loading: boolean;
  error: string | null;
}

export function useOrganizationData(
  slug: string,
  options: UseOrganizationDataOptions = {}
): OrganizationData {
  const { fetchProposals = false, proposalsLimit = 5 } = options;
  const [group, setGroup] = useState<OrganizationGroup | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [proposals, setProposals] = useState<OrganizationProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch(`/api/groups/${slug}`),
          fetch(`/api/groups/${slug}/members`),
        ];
        if (fetchProposals) {
          fetches.push(fetch(`/api/groups/${slug}/proposals?limit=${proposalsLimit}`));
        }

        const responses = await Promise.all(fetches);
        const [groupRes, membersRes] = responses;
        const proposalsRes = fetchProposals ? responses[2] : null;

        if (!groupRes.ok) {
          setError('Organization not found');
          return;
        }

        const groupData = await groupRes.json();
        setGroup(groupData.group);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.members || []);
        }

        if (proposalsRes?.ok) {
          const proposalsData = await proposalsRes.json();
          setProposals(proposalsData.data?.proposals || proposalsData.proposals || []);
        }
      } catch {
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, fetchProposals, proposalsLimit]);

  return { group, members, proposals, loading, error };
}
