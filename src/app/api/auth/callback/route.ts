import { NextRequest } from 'next/server';
import { apiBadRequest, apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Unauthenticated session mutation — per-IP limit against token-stuffing.
    const rl = await rateLimit(request);
    if (!rl.success) {
      return createRateLimitResponse(rl);
    }

    const supabase = await createServerClient();

    // Safely parse JSON with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error(
        'Failed to parse request body in auth callback',
        {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          contentType: request.headers.get('content-type'),
        },
        'Auth'
      );
      return apiBadRequest('Invalid request body');
    }

    const { event, session } = body;

    // Handle sign out
    if (event === 'SIGNED_OUT') {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        logger.error('Sign-out failed on server', { error: signOutError.message, event }, 'Auth');
        return apiInternalError('Sign-out failed. Please try again.');
      }
      return apiSuccess({ success: true });
    }

    // Reject non-SIGNED_OUT events that arrive without a session payload —
    // previously this fell into the SIGNED_OUT branch and silently destroyed
    // the user's existing session while returning 200.
    if (!session) {
      logger.warn('Auth callback received non-SIGNED_OUT event without session', { event }, 'Auth');
      return apiBadRequest(`Missing session payload for event '${event}'`);
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
      return apiBadRequest('Invalid session: missing tokens');
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
      return apiBadRequest('Failed to establish session. Please try signing in again.');
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

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error(
      'Unexpected error in auth callback',
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Auth'
    );
    return apiInternalError('Authentication failed. Please try again.');
  }
}
