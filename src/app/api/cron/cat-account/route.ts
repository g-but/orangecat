/**
 * Cat Account Invariant Cron Route
 *
 * Schedule: systemd timer `orangecat-cron@cat-account.timer` on bitbaum, daily.
 *
 * Asserts that the Cat has an account. `@cat` is already tokenized and linked by
 * utils/markdown.tsx, so if the profile row ever goes missing, every mention of
 * the Cat across the platform silently resolves to nobody. Re-asserting it
 * daily makes that self-healing instead of a support ticket.
 *
 * Cheap when it is a no-op, which is almost always: one indexed lookup.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { ensureCatAccount } from '@/services/mentions/cat-account';
import { logger } from '@/utils/logger';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';
import { verifyCronSecret } from '@/lib/api/cronAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }
  try {
    const account = await ensureCatAccount(createAdminClient());
    if (!account) {
      // Loud rather than silent: a missing Cat account breaks every @cat.
      logger.error('Cat account could not be established', {}, 'CronCatAccount');
      return apiError('Cat account unavailable', 'INTERNAL_ERROR', 500);
    }
    return apiSuccess({ id: account.id, username: account.username });
  } catch (error) {
    logger.error('Cat account check crashed', { error }, 'CronCatAccount');
    return apiError('Cat account check failed', 'INTERNAL_ERROR', 500);
  }
}
