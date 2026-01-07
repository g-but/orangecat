import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiUnauthorized } from '@/lib/api/standardResponse';
import { handleApiError } from '@/lib/api/standardResponse';
import { getGroup } from '@/services/groups/queries/groups';
import { getGroupProposals } from '@/services/groups/queries/proposals';
import { createProposal } from '@/services/groups/mutations/proposals';
import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = request.nextUrl;
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
      if (!user) {return apiUnauthorized();}
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

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {return apiUnauthorized();}

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
}

