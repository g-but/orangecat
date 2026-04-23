/**
 * Wallets API - List and Create
 *
 * GET  /api/wallets?profile_id=xxx  - List wallets for a profile or project
 * POST /api/wallets                 - Create a new wallet
 */

import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { handleSupabaseError } from '@/lib/wallets/errorHandling';
import {  applyRateLimitHeaders, rateLimitWriteAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { apiSuccess, apiRateLimited } from '@/lib/api/standardResponse';
import { validateOneOfIds, getValidationError } from '@/lib/api/validation';
import { getTableName } from '@/config/entity-registry';
import { createWallet } from '@/domain/wallets/createWallet';

// Public wallet fields (safe to return without auth)
const PUBLIC_WALLET_FIELDS =
  'id, address_or_xpub, wallet_type, label, category, category_icon, lightning_address, is_primary, display_order, profile_id, project_id';

// GET /api/wallets?profile_id=xxx OR ?project_id=xxx
export const GET = withOptionalAuth(async request => {
  try {
    const { user, supabase } = request;
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');
    const projectId = searchParams.get('project_id');

    const idValidation = validateOneOfIds(
      { profile_id: profileId, project_id: projectId },
      'profile_id or project_id is required'
    );
    const validationError = getValidationError(idValidation);
    if (validationError) {return validationError;}

    const isOwner = user ? isProfileOwner(user, profileId) : false;
    const selectFields = isOwner ? '*' : PUBLIC_WALLET_FIELDS;

    let query = supabase
      .from(getTableName('wallet'))
      .select(selectFields)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch wallets', {
        profileId,
        projectId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError('fetch wallets', error, { profileId, projectId });
    }

    return apiSuccess(data || [], { cache: 'SHORT' });
  } catch (error) {
    logger.error('Unexpected error in GET /api/wallets', { error });
    return handleSupabaseError('fetch wallets', error);
  }
});

function isProfileOwner(user: User, profileId: string | null): boolean {
  // Profile.id IS the auth user_id — direct comparison is safe
  return profileId !== null && profileId === user.id;
}

// POST /api/wallets - Create new wallet
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const rateLimitResult = await rateLimitWriteAsync(user.id);
    if (!rateLimitResult.success) { return apiRateLimited('Too many wallet creation requests. Please slow down.', retryAfterSeconds(rateLimitResult)); }

    const rawBody = await request.json();
    const { response } = await createWallet(supabase, user, rawBody);
    return applyRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    return handleSupabaseError('create wallet', error);
  }
});
