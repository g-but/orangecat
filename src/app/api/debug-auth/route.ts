import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    logger.info('=== DEBUG AUTH GET ===');
    logger.info('Request headers:', Object.fromEntries(request.headers.entries()));

    const supabase = await createServerClient();
    logger.info('Supabase client created');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    logger.info('User:', user);
    logger.info('Auth error:', authError);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    logger.info('Session:', session);
    logger.info('Session error:', sessionError);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      sessionError: sessionError?.message,
      hasSession: !!session,
      hasUser: !!user,
    });
  } catch (error) {
    logger.error('Debug auth error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('=== DEBUG AUTH POST ===');
    logger.info('Request headers:', Object.fromEntries(request.headers.entries()));

    const supabase = await createServerClient();
    logger.info('Supabase client created');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    logger.info('User:', user);
    logger.info('Auth error:', authError);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    logger.info('Session:', session);
    logger.info('Session error:', sessionError);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message,
      sessionError: sessionError?.message,
      hasSession: !!session,
      hasUser: !!user,
    });
  } catch (error) {
    logger.error('Debug auth error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}


