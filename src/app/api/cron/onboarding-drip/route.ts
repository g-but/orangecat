/**
 * Onboarding Drip Cron Route
 *
 * Vercel Cron: runs daily at 9am UTC
 * vercel.json: { "path": "/api/cron/onboarding-drip", "schedule": "0 9 * * *" }
 *
 * Fetches users created in the last 8 days (covers the day 0-7 drip window),
 * determines which onboarding email each should receive, and sends it.
 * Processes in batches of 50 to stay within Vercel's 5-minute limit.
 *
 * Created: 2026-03-28
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getNextOnboardingEmail } from '@/services/notifications/onboardingEngine';
import { NotificationEmailService } from '@/services/notifications/emailService';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const LOG_SOURCE = 'CronOnboardingDrip';
const BATCH_SIZE = 50;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();
  const admin = createAdminClient();
  const emailService = new NotificationEmailService();

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Fetch users created in the last 8 days (covers day 0 through day 7)
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    // Use admin.auth to list recent users
    // Supabase admin.auth.admin.listUsers supports pagination but not date filtering,
    // so we query profiles table (created_at mirrors auth user creation)
    const { data: recentUsers, error: fetchError } = await admin
      .from('profiles')
      .select('id')
      .gte('created_at', eightDaysAgo.toISOString());

    if (fetchError) {
      logger.error('Failed to fetch recent users', { error: fetchError }, LOG_SOURCE);
      return Response.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }

    const userIds = (recentUsers ?? []).map((row: { id: string }) => row.id);

    logger.info(
      `Onboarding drip: ${userIds.length} recent users to evaluate`,
      { total: userIds.length },
      LOG_SOURCE
    );

    // Process in batches
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async userId => {
          processed++;

          // Determine which onboarding email (if any) is needed
          const email = await getNextOnboardingEmail(userId);

          if (!email) {
            skipped++;
            return { userId, status: 'skipped' as const };
          }

          // Send the email
          const result = await emailService.sendNotificationEmail({
            userId,
            type: email.type,
            data: email.data,
          });

          if (result.sent) {
            sent++;
            return { userId, status: 'sent' as const, type: email.type };
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
            'Onboarding drip failed for user in batch',
            { error: result.reason?.message ?? result.reason },
            LOG_SOURCE
          );
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      'Onboarding drip cron completed',
      { processed, sent, skipped, failed, durationMs: duration },
      LOG_SOURCE
    );

    return Response.json({
      success: true,
      processed,
      sent,
      skipped,
      failed,
      durationMs: duration,
    });
  } catch (error) {
    logger.error(
      'Onboarding drip cron failed',
      { error: error instanceof Error ? error.message : error },
      LOG_SOURCE
    );

    return Response.json(
      {
        success: false,
        error: 'Internal error',
        processed,
        sent,
        skipped,
        failed,
      },
      { status: 500 }
    );
  }
}
