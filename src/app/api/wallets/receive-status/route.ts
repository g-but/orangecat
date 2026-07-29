/**
 * GET /api/wallets/receive-status — owner-only: can I actually be paid right
 * now, and via which rail? Answered by the same resolution a payer's request
 * runs, so the wallets page can never claim a capability the payment path
 * doesn't have.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { APP_DOMAIN } from '@/config/brand';
import { getOwnerReceiveStatus } from '@/domain/wallets/receiveStatus';
import { logger } from '@/utils/logger';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const [{ data: profile }, status] = await Promise.all([
      supabase.from(DATABASE_TABLES.PROFILES).select('username').eq('id', user.id).maybeSingle(),
      getOwnerReceiveStatus(user.id),
    ]);

    const username = (profile as { username?: string | null } | null)?.username ?? null;

    return apiSuccess({
      username,
      // Null when the account has no username yet — there is no address to show.
      lightningAddress: username ? `${username}@${APP_DOMAIN}` : null,
      ...status,
    });
  } catch (error) {
    logger.error('Failed to resolve owner receive status', { error }, 'Wallets');
    return apiInternalError('Could not check your receiving setup.');
  }
});
