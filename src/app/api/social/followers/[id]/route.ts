import { NextRequest } from 'next/server';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { withOptionalAuth } from '@/lib/api/withAuth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  try {
    const { id } = await context.params;

    const idValidation = getValidationError(validateUUID(id, 'user ID'));
    if (idValidation) {return idValidation;}

    const { supabase } = request;
    const { searchParams } = new URL((request as NextRequest).url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error, count } = await supabase.from(DATABASE_TABLES.FOLLOWS)
      .select(
        'follower_id, created_at, profile:profiles!follows_follower_id_fkey(id, username, name, avatar_url, bio, bitcoin_address, lightning_address)',
        { count: 'exact' }
      )
      .eq('following_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch followers', { userId: id, error: error.message });
      return apiInternalError('Failed to fetch followers');
    }

    return apiSuccess(
      { data: data || [], pagination: { limit, offset, total: count || 0 } },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching followers', { error });
    return apiInternalError('Internal server error');
  }
});
