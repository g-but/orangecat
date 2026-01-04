/**
 * Proposal Detail Page
 *
 * Displays a single proposal with full details and voting functionality.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Initial implementation
 */

import { ProposalDetail } from '@/components/groups/proposals/ProposalDetail';
import { createServerClient } from '@/lib/supabase/server';
import { checkGroupPermission } from '@/services/groups/permissions';
import { getGroupBySlug } from '@/services/groups/queries/groups';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  const { slug, id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get group
  const groupResult = await getGroupBySlug(slug);
  if (!groupResult.success || !groupResult.group) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Group not found</p>
      </div>
    );
  }

  const group = groupResult.group;

  // Check permissions
  let canVote = false;
  let canActivate = false;

  if (user) {
    canVote = await checkGroupPermission(group.id, user.id, 'canVote');
    // Can activate if proposer or admin
    const canCreateProposal = await checkGroupPermission(group.id, user.id, 'canCreateProposals');
    canActivate = canCreateProposal; // For now, same permission
  }

  return (
    <ProposalDetail
      proposalId={id}
      groupSlug={slug}
      groupId={group.id}
      canVote={canVote}
      canActivate={canActivate}
    />
  );
}

