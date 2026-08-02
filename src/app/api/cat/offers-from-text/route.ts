/**
 * POST /api/cat/offers-from-text  — body: { text }
 *
 * The deterministic "paste who you are → get monetizable offerings" seam.
 * Every part of this already existed but only fired reactively inside a chat
 * turn: the onboarding box just seeded a Cat conversation and hoped the model
 * called suggest_offers. This chains the built pieces synchronously —
 * persist the bio, extract the economic profile, and reason over it — so a
 * pasted bio comes back as concrete, typed offers the user can create in one
 * click.
 *
 * Reuses: generateOffers (offer-engine.ts) for the grounded proposals — the
 * pasted text is persisted as the bio AND passed as `focus`, so offers are
 * grounded in it either way. Returns [] on thin input / model failure — the UI
 * degrades to "talk to your Cat instead".
 */

import { NextResponse } from 'next/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateOffers } from '@/services/cat/offer-engine';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const MAX_TEXT = 4000;

export async function POST(request: Request) {
  const auth = await createServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Every call triggers an LLM completion — per-user write limit.
  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const text = typeof (body as any)?.text === 'string' ? (body as any).text.trim() : '';
  if (!text) {
    return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
  }
  const clamped = text.slice(0, MAX_TEXT);

  const db = createAdminClient() as any;

  // Persist the bio so the offer engine's stored-context path (and future
  // sessions) see it. Best-effort — the pasted text is also passed to
  // generateOffers as `focus` so offers are grounded even if this write fails.
  try {
    await db
      .from(DATABASE_TABLES.PROFILES)
      .update({ bio: clamped, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  } catch (err) {
    logger.warn('offers-from-text: bio persist failed (non-fatal)', { err }, 'OffersFromText');
  }

  try {
    const offers = await generateOffers(db, user.id, { focus: clamped, count: 4 });
    return NextResponse.json({ success: true, offers });
  } catch (err) {
    logger.error('offers-from-text: generateOffers failed', err, 'OffersFromText');
    // Not a hard error for the user — the UI falls back to opening the Cat chat.
    return NextResponse.json({ success: true, offers: [] });
  }
}
