import { NextRequest } from 'next/server';
import {
  handleApiError,
  apiUnauthorized,
  apiSuccess,
  apiNotFound,
  apiBadRequest,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { getProposal } from '@/services/groups/queries/proposals';
import { updateProposal, deleteProposal } from '@/services/groups/mutations/proposals';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { id } = params;
    const result = await getProposal(id);
    if (!result.success) {
      return apiNotFound(result.error);
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error('Error in GET /api/groups/[slug]/proposals/[id]', error, 'API');
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = params;
    const payload = await request.json();
    const result = await updateProposal(id, payload);
    if (!result.success) {
      return apiBadRequest(result.error);
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error('Error in PUT /api/groups/[slug]/proposals/[id]', error, 'API');
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = params;
    const result = await deleteProposal(id);
    if (!result.success) {
      return apiBadRequest(result.error);
    }
    return apiSuccess({ deleted: true });
  } catch (error) {
    logger.error('Error in DELETE /api/groups/[slug]/proposals/[id]', error, 'API');
    return handleApiError(error);
  }
}
