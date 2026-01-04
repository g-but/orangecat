import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
    }

    // Create server client and set the session
    const supabase = await createServerClient();

    // First, get the current user to verify the token works
    const { data: currentUser, error: verifyError } = await supabase.auth.getUser(accessToken);
    if (verifyError || !currentUser.user) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }

    // Set the session in the server client (this should set cookies)
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session) {
      return NextResponse.json({ error: 'Failed to establish session' }, { status: 400 });
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Auth sync error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
