/**
 * Tell the operator when a user's Cat turn failed outright.
 *
 * Until now a total provider-chain failure was logged server-side and shown to
 * the user, and that was all — nobody was told. The only standing signal was
 * the nightly eval, which runs against a test account and can pass at 03:00
 * while real users are being turned away at noon. Six real accounts were failed
 * in June 2026 and nothing surfaced it; see failed-turn.ts.
 *
 * Deliberately quiet: one unread row per failure CODE, bumping `occurrences`,
 * mirroring the coalescing the eval harness already uses. A capacity outage
 * affects every user at once, so stacking one row per affected request would
 * bury the signal it is meant to raise.
 */
import { getAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

/** Recipient of operational alerts. Same default as scripts/eval-cat.mjs. */
const OPS_NOTIFY_USER_ID = process.env.OPS_NOTIFY_USER_ID || 'cec88bc9-557f-452b-92f1-e093092fecd6';

const SOURCE = 'cat/chat';

interface FailureAlertParams {
  /** Whose turn failed. Resolved to a username so the alert can be triaged. */
  userId: string;
  /** Structured error code already shown to the client (e.g. ALL_PROVIDERS_DOWN). */
  code: string;
  provider?: string;
  model?: string;
}

function describe(username: string | null, { code, provider, model }: FailureAlertParams): string {
  const who = username ? `@${username}` : 'someone';
  const link = [provider, model].filter(Boolean).join('/');
  return `${who} asked Cat something and got nothing back (${code}${link ? ` on ${link}` : ''}).`;
}

/**
 * Fire-and-forget. Never throws and never blocks the response: a chat that
 * already failed must not fail differently because the alert could not be
 * written.
 */
export async function alertCatChatFailure(params: FailureAlertParams): Promise<void> {
  try {
    const supabase = getAdminClient();

    // Name the person. "someone got nothing back" cannot be triaged: the whole
    // question this alert exists to answer is whether a REAL user was turned
    // away or whether it was our own eval / founder account. One indexed
    // lookup, on a request that has already failed.
    const { data: profile } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username')
      .eq('id', params.userId)
      .maybeSingle();

    const message = describe(profile?.username ?? null, params);
    const question = `Help me with this notification: ${params.code} — "${message}" What does it mean and what should I do?`;

    const { data: existing } = await supabase
      .from(DATABASE_TABLES.NOTIFICATIONS)
      .select('id, metadata')
      .eq('user_id', OPS_NOTIFY_USER_ID)
      .eq('type', 'system')
      .eq('is_read', false)
      .eq('metadata->>source', SOURCE)
      .eq('metadata->>title', params.code)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const metadata = {
      title: params.code,
      source: SOURCE,
      provider: params.provider ?? null,
      model: params.model ?? null,
      lastFailedUserId: params.userId,
      lastSeenAt: new Date().toISOString(),
    };

    if (existing) {
      const prev = (existing.metadata ?? {}) as { occurrences?: number };
      await supabase
        .from(DATABASE_TABLES.NOTIFICATIONS)
        .update({
          message,
          action_url: `/dashboard/cat?q=${encodeURIComponent(question)}`,
          metadata: { ...metadata, occurrences: (Number(prev.occurrences) || 1) + 1 },
        })
        .eq('id', existing.id);
      return;
    }

    await supabase.from(DATABASE_TABLES.NOTIFICATIONS).insert({
      user_id: OPS_NOTIFY_USER_ID,
      type: 'system',
      message,
      action_url: `/dashboard/cat?q=${encodeURIComponent(question)}`,
      metadata: { ...metadata, occurrences: 1 },
      is_read: false,
    });
  } catch (err) {
    logger.warn('Failed to raise Cat failure alert', { err }, 'cat/chat');
  }
}
