import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiValidationError, apiRateLimited, handleApiError, apiBadRequest } from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().max(100).optional(),
  referrer: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request);
    if (!rl.success) {return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    const supabase = await createServerClient();
    const body = await request.json().catch(() => ({}));

    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid request data');}
    const { email, source, referrer } = parsed.data;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(DATABASE_TABLES.CHANNEL_WAITLIST) as any).insert({
      email,
      user_id: user?.id || null,
      source: source ?? 'channel_page',
      referrer: referrer ?? request.headers.get('referer') ?? null,
    });

    if (error) {
      logger.warn('Waitlist insert failed', { error: error.message });
      return apiValidationError('Failed to join waitlist. This email may already be registered.');
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
