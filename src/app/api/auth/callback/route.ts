import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { event, session } = body;

    // Handle sign out
    if (event === 'SIGNED_OUT' || !session) {
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }

    // Validate session structure
    if (!session.access_token || !session.refresh_token) {
      logger.warn(
        'Invalid session structure in auth callback',
        {
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
          event,
        },
        'Auth'
      );
      return NextResponse.json({ error: 'Invalid session: missing tokens' }, { status: 400 });
    }

    // Set session on server
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) {
      logger.error(
        'Failed to set session on server',
        {
          error: error.message,
          errorCode: error.status,
          event,
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
        },
        'Auth'
      );
      return NextResponse.json({ error: error.message, code: error.status }, { status: 400 });
    }

    logger.debug(
      'Session synced to server successfully',
      {
        event,
        hasUser: !!data?.user,
        userId: data?.user?.id,
      },
      'Auth'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      'Unexpected error in auth callback',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Auth'
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
