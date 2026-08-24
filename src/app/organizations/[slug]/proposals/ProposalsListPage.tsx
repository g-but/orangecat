'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ProposalsList } from '@/components/groups/proposals/ProposalsList';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface ProposalsListPageProps {
  groupId: string;
  groupSlug: string;
  groupName: string;
  canCreateProposal: boolean;
}

export function ProposalsListPage({
  groupId,
  groupSlug,
  groupName,
  canCreateProposal,
}: ProposalsListPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href={`${ENTITY_REGISTRY['organization'].publicBasePath}/${groupSlug}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to {groupName}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-fg-primary">Proposals</h1>
        <p className="text-fg-secondary mt-1">View and vote on proposals for {groupName}</p>
      </div>
      <ProposalsList
        groupId={groupId}
        groupSlug={groupSlug}
        canCreateProposal={canCreateProposal}
      />
    </div>
  );
}
