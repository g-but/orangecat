import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { profileSchema, normalizeProfileData, type ProfileData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Attempt to bootstrap the missing profile and re-fetch
      await ensureProfileRecord(supabase, user);
      const { data: bootstrappedProfile, error: retryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (retryError || !bootstrappedProfile) {
        return apiNotFound('Profile not found');
      }

      return respondWithProfile(supabase, user, bootstrappedProfile, request);
    }

    return respondWithProfile(supabase, user, profile, request);
  } catch (error) {
    return handleApiError(error);
  }
}

type SupabaseServer = Awaited<ReturnType<typeof createServerClient>>;

async function respondWithProfile(
  supabase: SupabaseServer,
  user: any,
  profile: any,
  request: NextRequest
) {
  // Only fetch project count if explicitly requested via query param
  // This makes auth flow faster by avoiding expensive count query
  const includeStats = request.nextUrl.searchParams.get('include_stats') === 'true';

  if (includeStats) {
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return apiSuccess(
      {
        ...profile,
        project_count: projectCount || 0,
      },
      {
        cache: 'SHORT', // Cache for 1 minute
      }
    );
  }

  // Return profile without expensive stats for fast auth
  // Use short cache since profile data changes infrequently
  return apiSuccess(profile, {
    cache: 'SHORT', // Cache for 1 minute
  });
}

async function ensureProfileRecord(supabase: SupabaseServer, user: any) {
  const rawEmail: string | null = typeof user.email === 'string' ? user.email : null;
  const emailName = rawEmail && rawEmail.includes('@') ? rawEmail.split('@')[0] : null;
  const username = emailName && emailName.length > 0
    ? emailName
    : `user_${user.id?.toString().slice(0, 8) || 'unknown'}`;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    (emailName && emailName.length > 0 ? emailName : null) ||
    'User';

  try {
    await supabase.from('profiles').insert({
      id: user.id,
      username,
      name,
      email: user.email,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return;
    }
    throw error;
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    logger.info('Profile update request', { userId: user.id, fields: Object.keys(body) });

    // Check username uniqueness before validation if username is being updated
    if (body.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', body.username.trim())
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        logger.warn('Username already taken', { username: body.username, userId: user.id });
        return apiValidationError('Username is already taken', { field: 'username' });
      }
    }

    // Normalize and validate the data
    const normalizedBody = normalizeProfileData(body);

    let validatedData;
    try {
      validatedData = profileSchema.parse(normalizedBody);
      logger.debug('Profile validation passed', { userId: user.id });
    } catch (zodError) {
      logger.warn('Profile validation failed', { userId: user.id, error: zodError });
      throw zodError;
    }

    // Only persist fields that are known to exist on the profiles table.
    // This avoids accidental errors if the validation schema contains
    // fields that are not yet migrated in the database.
    const allowedFields = [
      'username',
      'name',
      'bio',
      'email',
      'contact_email',
      'location_country',
      'location_city',
      'location_zip',
      'location_search',
      // Allow saving extra context/flags for location privacy/grouping
      'location_context',
      'latitude',
      'longitude',
      'location',
      'avatar_url',
      'banner_url',
      'website',
      'social_links',
      'phone',
      'bitcoin_address',
      'lightning_address',
    ];

    const dataToSave = Object.fromEntries(
      Object.entries(validatedData as any).filter(([key]) => allowedFields.includes(key))
    );
    logger.debug('Profile update data prepared', {
      userId: user.id,
      fields: Object.keys(dataToSave),
    });

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...dataToSave,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('Profile update failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return apiValidationError('Failed to update profile', { details: error.message });
    }

    logger.info('Profile updated successfully', { userId: user.id });
    return apiSuccess(profile);
  } catch (error) {
    logger.error('Profile update error', { error });

    // Provide specific error messages for Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      const firstError = zodError.errors?.[0];
      const fieldName = firstError?.path?.join('.') || 'field';
      const message = firstError?.message || 'Invalid profile data';

      return apiValidationError(`${fieldName}: ${message}`);
    }
    return handleApiError(error);
  }
}
