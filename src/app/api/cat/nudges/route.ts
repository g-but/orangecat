/**
 * GET  /api/cat/nudges   — the user's active proactive nudges (regenerated if stale)
 * POST /api/cat/nudges   — { action: 'dismiss', id }  → hide a nudge (won't return)
 *
 * Nudges are cached in user_nudges and regenerated when the profile changed or
 * the cache is older than ~24h. Dismissed nudges never reappear (dedupe_key).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateNudges } from '@/services/cat/nudges';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const STALE_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const auth = await createServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient() as any;

  const { data: existing } = await db
    .from(DATABASE_TABLES.USER_NUDGES)
    .select('id, nudge_type, title, body, cta_label, cta_url, score, generated_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('score', { ascending: false });

  // Staleness: regenerate if none, older than 24h, or the profile changed since.
  const newest = existing?.[0]?.generated_at ? new Date(existing[0].generated_at).getTime() : 0;
  let stale = !existing?.length || Date.now() - newest > STALE_MS;
  if (!stale) {
    const { data: prof } = await db
      .from(DATABASE_TABLES.PROFILES)
      .select('updated_at')
      .eq('id', user.id)
      .maybeSingle();
    if (prof?.updated_at && new Date(prof.updated_at).getTime() > newest) {
      stale = true;
    }
  }

  if (!stale) {
    return NextResponse.json({ success: true, nudges: existing, cached: true });
  }

  // Regenerate.
  try {
    const fresh = await generateNudges(db, user.id);
    const { data: dismissedRows } = await db
      .from(DATABASE_TABLES.USER_NUDGES)
      .select('dedupe_key')
      .eq('user_id', user.id)
      .eq('status', 'dismissed');
    const dismissed = new Set((dismissedRows ?? []).map((r: any) => r.dedupe_key));
    const toStore = fresh.filter(n => !dismissed.has(n.dedupe_key));

    await db
      .from(DATABASE_TABLES.USER_NUDGES)
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'active');
    if (toStore.length > 0) {
      await db.from(DATABASE_TABLES.USER_NUDGES).upsert(
        toStore.map(n => ({
          user_id: user.id,
          nudge_type: n.nudge_type,
          title: n.title,
          body: n.body,
          cta_label: n.cta_label,
          cta_url: n.cta_url,
          dedupe_key: n.dedupe_key,
          score: n.score,
          status: 'active',
          generated_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,dedupe_key' }
      );
    }

    const { data: stored } = await db
      .from(DATABASE_TABLES.USER_NUDGES)
      .select('id, nudge_type, title, body, cta_label, cta_url, score, generated_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('score', { ascending: false });
    return NextResponse.json({ success: true, nudges: stored ?? [], cached: false });
  } catch (err) {
    logger.error('nudges generation failed', { err }, 'Nudges');
    return NextResponse.json({ success: true, nudges: existing ?? [], cached: true });
  }
}

export async function POST(request: Request) {
  const auth = await createServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }
  const body = await request.json().catch(() => ({}));
  if (body?.action !== 'dismiss' || !body?.id) {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
  const db = createAdminClient() as any;
  await db
    .from(DATABASE_TABLES.USER_NUDGES)
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('id', body.id);
  return NextResponse.json({ success: true });
}
