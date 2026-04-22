import { NextRequest } from 'next/server';
import {
  handleApiError,
  apiUnauthorized,
  apiSuccess,
  apiBadRequest,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { cancelProposal } from '@/services/groups/mutations/proposals';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

export async function POST(
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

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

    const { id } = params;
    const result = await cancelProposal(id, supabase);
    if (!result.success) {
      return apiBadRequest(result.error);
    }
    return apiSuccess(result.proposal);
  } catch (error) {
    logger.error('Error in POST /api/groups/[slug]/proposals/[id]/cancel', error, 'API');
    return handleApiError(error);
  }
}
