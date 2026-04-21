import { NextRequest } from 'next/server';
import { apiBadRequest, apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
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
    if (event === 'SIGNED_OUT' || !session) {
      await supabase.auth.signOut();
      return apiSuccess({ success: true });
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
      return apiBadRequest(error.message);
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
