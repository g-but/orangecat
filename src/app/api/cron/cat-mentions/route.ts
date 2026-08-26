/**
 * Cat Mention Worker Cron Route
 *
 * Schedule: systemd timer `orangecat-cron@cat-mentions.timer` on bitbaum,
 * every minute.
 *
 * Answers queued @cat mentions. The timer is the DURABILITY path, not the
 * latency path: the write that created the mention also kicks a run, so a reply
 * normally arrives in seconds. This tick is what guarantees the question is
 * still answered when that process died mid-thought.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { runCatMentions } from '@/services/mentions/worker';
import { logger } from '@/utils/logger';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';
import { verifyCronSecret } from '@/lib/api/cronAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }
  try {
    return apiSuccess(await runCatMentions(createAdminClient()));
  } catch (error) {
    logger.error('Cat mention run crashed', { error }, 'CronCatMentions');
    return apiError('Mention run failed', 'INTERNAL_ERROR', 500);
  }
}
