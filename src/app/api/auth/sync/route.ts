import { NextRequest } from 'next/server';
import { logger } from '@/utils/logger';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiBadRequest,
  apiUnauthorized,
  apiSuccess,
  apiInternalError,
} from '@/lib/api/standardResponse';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return apiBadRequest('No access token provided');
    }

    // Create server client and set the session
    const supabase = await createServerClient();

    // First, get the current user to verify the token works
    const { data: currentUser, error: verifyError } = await supabase.auth.getUser(accessToken);
    if (verifyError || !currentUser.user) {
      return apiUnauthorized('Invalid access token');
    }

    // Set the session in the server client (this should set cookies)
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || null,
    });

    if (error) {
      return apiBadRequest(error.message);
    }

    if (!data.session) {
      return apiBadRequest('Failed to establish session');
    }

    // Return success with user data
    return apiSuccess({
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    logger.error('Auth sync error:', error);
    return apiInternalError(error instanceof Error ? error.message : 'Unknown error');
  }
}
