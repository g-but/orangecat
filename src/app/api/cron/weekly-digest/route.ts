/**
 * Weekly Digest Cron Route
 *
 * Vercel Cron: runs every Monday at 8am UTC
 * vercel.json: { "path": "/api/cron/weekly-digest", "schedule": "0 8 * * 1" }
 *
 * Fetches all users who should receive a weekly digest, builds
 * the digest data, and sends via the notification email service.
 * Processes users in batches of 50 to stay within Vercel's 5-minute limit.
 *
 * Created: 2026-03-28
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { buildWeeklyDigest } from '@/services/notifications/digestBuilder';
import { NotificationEmailService } from '@/services/notifications/emailService';
import { logger } from '@/utils/logger';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const LOG_SOURCE = 'CronWeeklyDigest';
const BATCH_SIZE = 50;

/**
 * Verify the request is from Vercel Cron via the CRON_SECRET header.
 */
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }

  const startTime = Date.now();
  const admin = createAdminClient();
  const emailService = new NotificationEmailService();

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Fetch all user IDs who should receive a weekly digest.
    // Users with digest_frequency = 'weekly' OR users with no preference row (default is weekly).
    // Step 1: Get users who explicitly have weekly preferences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: explicitWeekly } = await (
      admin.from(DATABASE_TABLES.NOTIFICATION_PREFERENCES) as any
    )
      .select('user_id')
      .eq('digest_frequency', 'weekly')
      .eq('progress_emails', true);

    const explicitWeeklyIds = new Set(
      (explicitWeekly ?? []).map((row: { user_id: string }) => row.user_id)
    );

    // Step 2: Get all user IDs that have a preferences row (any frequency)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allPrefs } = await (
      admin.from(DATABASE_TABLES.NOTIFICATION_PREFERENCES) as any
    ).select('user_id');

    const usersWithPrefs = new Set((allPrefs ?? []).map((row: { user_id: string }) => row.user_id));

    // Step 3: Get all auth user IDs
    // Use profiles table as proxy (every user has a profile)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allProfiles } = await (admin.from(DATABASE_TABLES.PROFILES) as any).select('id');

    const allUserIds = (allProfiles ?? []).map((row: { id: string }) => row.id);

    // Combine: explicit weekly + users without preferences (default = weekly)
    const userIdsToProcess: string[] = [];
    for (const userId of allUserIds) {
      if (explicitWeeklyIds.has(userId)) {
        userIdsToProcess.push(userId);
      } else if (!usersWithPrefs.has(userId)) {
        // No preferences row = defaults to weekly
        userIdsToProcess.push(userId);
      }
    }

    logger.info(
      `Weekly digest: ${userIdsToProcess.length} users to process`,
      { total: userIdsToProcess.length },
      LOG_SOURCE
    );

    // Process in batches
    for (let i = 0; i < userIdsToProcess.length; i += BATCH_SIZE) {
      const batch = userIdsToProcess.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async userId => {
          processed++;

          // Build digest
          const digestData = await buildWeeklyDigest(userId);

          if (!digestData.hasContent) {
            skipped++;
            return { userId, status: 'skipped' as const };
          }

          // Send email
          const result = await emailService.sendNotificationEmail({
            userId,
            type: 'weekly_digest',
            data: {
              stats: digestData.stats,
              topEntities: digestData.topEntities,
              suggestions: digestData.suggestions,
            },
          });

          if (result.sent) {
            sent++;
            return { userId, status: 'sent' as const };
          } else {
            skipped++;
            return { userId, status: 'skipped' as const, reason: result.reason };
          }
        })
      );

      // Count failures from rejected promises
      for (const result of results) {
        if (result.status === 'rejected') {
          failed++;
          logger.error(
            'Weekly digest failed for user in batch',
            { error: result.reason?.message ?? result.reason },
            LOG_SOURCE
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      'Weekly digest cron completed',
      { processed, sent, skipped, failed, durationMs: duration },
      LOG_SOURCE
    );

    return apiSuccess({ processed, sent, skipped, failed, durationMs: duration });
  } catch (error) {
    logger.error(
      'Weekly digest cron failed',
      { error: error instanceof Error ? error.message : error },
      LOG_SOURCE
    );

    return apiError('Internal error', 'INTERNAL_ERROR', 500);
  }
}
