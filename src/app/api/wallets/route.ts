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
import { applyRateLimitHeaders, rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { apiSuccess, apiRateLimited } from '@/lib/api/standardResponse';
import { validateOneOfIds, getValidationError } from '@/lib/api/validation';
import { getTableName } from '@/config/entity-registry';
import { getAdminClient } from '@/lib/supabase/admin';
import { WALLET_CLIENT_COLUMNS } from '@/config/database-tables';
import { redactExtendedKeys } from '@/lib/wallets/publicWallet';
import { createWallet } from '@/domain/wallets/createWallet';

// Public wallet fields (safe to return without auth).
//
// `address_or_xpub` holds two very different things. A plain address is meant
// to be shared — it is how someone pays you. An EXTENDED PUBLIC KEY is not an
// address but the key addresses are derived FROM, so publishing it hands any
// visitor every past and future address of that wallet, and its whole balance
// history. The payments domain already treats it that way (walletResolutionService:
// "it must never be handed to a payer verbatim"); this listing did not, and served
// real zpubs to anonymous callers through the admin client. Non-owner responses are
// redacted below — see redactExtendedKeys.
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
    if (validationError) {
      return validationError;
    }

    const isOwner = user ? isProfileOwner(user, profileId) : false;
    const selectFields = isOwner ? WALLET_CLIENT_COLUMNS : PUBLIC_WALLET_FIELDS;

    // Wallet rows are owner-readable only at the RLS level; the public wallet
    // listing (profile wallets tab) is served through this route's CURATED
    // field list via service role — the API is the one public surface, so raw
    // PostgREST can no longer enumerate balances or other wallet internals.
    const db = isOwner ? supabase : (getAdminClient() as unknown as typeof supabase);

    let query = db
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

    // The owner sees their own key; nobody else does.
    // The select uses a runtime column list, so postgrest infers a loose row
    // type here; the redaction only reads address_or_xpub.
    const rows = isOwner
      ? data || []
      : redactExtendedKeys((data || []) as unknown as Array<Record<string, unknown>>);

    return apiSuccess(rows, { cache: 'SHORT' });
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
    if (!rateLimitResult.success) {
      return apiRateLimited(
        'Too many wallet creation requests. Please slow down.',
        retryAfterSeconds(rateLimitResult)
      );
    }

    // Malformed JSON becomes null → walletCreateSchema (the validation SSOT,
    // applied inside createWallet) rejects it with a 400 instead of a 500.
    const rawBody = await request.json().catch(() => null);
    const { response } = await createWallet(supabase, user, rawBody);
    return applyRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    return handleSupabaseError('create wallet', error);
  }
});
