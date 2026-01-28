import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiUnauthorized } from '@/lib/api/standardResponse';
import { handleApiError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { getGroup } from '@/services/groups/queries/groups';
import { getGroupProposals } from '@/services/groups/queries/proposals';
import { createProposal } from '@/services/groups/mutations/proposals';
import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { searchParams } = request.nextUrl;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (searchParams.get('status') || 'all') as any;
    const proposalType = searchParams.get('proposal_type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const groupResult = await getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Access control: If not public, require auth+membership
    if (!groupResult.group.is_public) {
      const supabase = await createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return apiUnauthorized();
      }
      // membership is enforced in service queries as well; this guards early
    }

    const result = await getGroupProposals(groupResult.group.id, {
      status,
      proposal_type: proposalType,
      limit,
      offset,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return apiSuccess({ proposals: result.proposals, total: result.total });
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/proposals', error, 'API');
    return handleApiError(error);
  }
}

export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { slug } = await context.params;

    const groupResult = await getGroup(slug, true);
    if (!groupResult.success || !groupResult.group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const result = await createProposal({ group_id: groupResult.group.id, ...body });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.proposal }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals', error, 'API');
    return handleApiError(error);
  }
});
