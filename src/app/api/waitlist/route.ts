import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiValidationError, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim();
    const source = (body.source || 'channel_page').toString();
    const referrer = (body.referrer || '').toString();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiValidationError('Please enter a valid email address', { field: 'email' });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await (supabase.from('channel_waitlist') as any).insert({
      email,
      user_id: user?.id || null,
      source,
      referrer: referrer || request.headers.get('referer') || null,
    });

    if (error) {
      logger.warn('Waitlist insert failed', { error: error.message });
      return apiValidationError('Failed to join waitlist', { details: error.message });
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

