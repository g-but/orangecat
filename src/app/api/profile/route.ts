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
import { ProfileServerService } from '@/services/profile/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { DATABASE_TABLES } from '@/config/database-tables';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

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

    // Use ProfileServerService instead of direct database access
    const { data: profile, error: profileError } = await ProfileServerService.getProfile(
      supabase,
      user.id
    );

    if (profileError || !profile) {
      // Attempt to bootstrap the missing profile and re-fetch
      const { data: bootstrappedProfile, error: ensureError } =
        await ProfileServerService.ensureProfile(supabase, user.id, user.email, user.user_metadata);

      if (ensureError || !bootstrappedProfile) {
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
  user: User,
  profile: ProfileRow,
  request: NextRequest
) {
  // Only fetch project count if explicitly requested via query param
  // This makes auth flow faster by avoiding expensive count query
  const includeStats = request.nextUrl.searchParams.get('include_stats') === 'true';

  if (includeStats) {
    const projectCount = await ProfileServerService.getProjectCount(supabase, user.id);

    return apiSuccess(
      {
        ...profile,
        project_count: projectCount,
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

// ensureProfileRecord function removed - now using ProfileServerService.ensureProfile

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
      const isAvailable = await ProfileServerService.checkUsernameAvailability(
        supabase,
        body.username,
        user.id
      );

      if (!isAvailable) {
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
      Object.entries(validatedData as Record<string, unknown>).filter(([key]) => allowedFields.includes(key))
    );
    logger.debug('Profile update data prepared', {
      userId: user.id,
      fields: Object.keys(dataToSave),
    });

    // Use ProfileServerService for update (we'll need to add an update method)
    // For now, keeping direct update but this should be refactored to use service
    const { data: profile, error } = await (supabase
      .from(DATABASE_TABLES.PROFILES) as any)
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
      interface ZodErrorShape {
        errors?: Array<{ path?: (string | number)[]; message?: string }>;
      }
      const zodError = error as Error & ZodErrorShape;
      const firstError = zodError.errors?.[0];
      const fieldName = firstError?.path?.join('.') || 'field';
      const message = firstError?.message || 'Invalid profile data';

      return apiValidationError(`${fieldName}: ${message}`);
    }
    return handleApiError(error);
  }
}
