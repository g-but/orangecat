/**
 * Email Log Cleanup Cron Route
 *
 * Vercel Cron: runs weekly on Sunday at 2am UTC
 * vercel.json: { "path": "/api/cron/email-cleanup", "schedule": "0 2 * * 0" }
 *
 * Deletes notification_email_log entries older than 90 days
 * to prevent unbounded table growth.
 *
 * Created: 2026-03-28
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute is plenty for cleanup

const LOG_SOURCE = 'CronEmailCleanup';
const RETENTION_DAYS = 90;

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Count entries to be deleted (for reporting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin.from(DATABASE_TABLES.NOTIFICATION_EMAIL_LOG) as any)
      .select('*', { count: 'exact', head: true })
      .lt('sent_at', cutoffDate.toISOString());

    // Delete old log entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from(DATABASE_TABLES.NOTIFICATION_EMAIL_LOG) as any)
      .delete()
      .lt('sent_at', cutoffDate.toISOString());

    if (error) {
      logger.error('Email log cleanup failed', { error }, LOG_SOURCE);
      return Response.json({ success: false, error: 'Cleanup query failed' }, { status: 500 });
    }

    const deleted = count ?? 0;

    logger.info(
      'Email log cleanup completed',
      { deleted, cutoffDate: cutoffDate.toISOString() },
      LOG_SOURCE
    );

    return Response.json({
      success: true,
      deleted,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    logger.error(
      'Email log cleanup cron failed',
      { error: error instanceof Error ? error.message : error },
      LOG_SOURCE
    );

    return Response.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
