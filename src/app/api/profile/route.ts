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

      return respondWithProfile(supabase, user, bootstrappedProfile);
    }

    return respondWithProfile(supabase, user, profile);
  } catch (error) {
    return handleApiError(error);
  }
}

async function respondWithProfile(
  supabase: ReturnType<typeof createServerClient>,
  user: any,
  profile: any
) {
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const profileWithCounts = {
    ...profile,
    project_count: projectCount || 0,
  };

  return apiSuccess(profileWithCounts);
}

async function ensureProfileRecord(supabase: ReturnType<typeof createServerClient>, user: any) {
  const username =
    user.email && user.email.includes('@')
      ? user.email.split('@')[0]
      : `user_${user.id?.toString().slice(0, 8) || 'unknown'}`;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    (user.email && user.email.split('@')[0]) ||
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

    // Check username uniqueness before validation if username is being updated
    if (body.username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', body.username.trim())
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        return apiValidationError('Username is already taken', { field: 'username' });
      }
    }

    // Normalize and validate the data
    const normalizedBody = normalizeProfileData(body);
    const validatedData = profileSchema.parse(normalizedBody);

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return apiValidationError('Failed to update profile', { details: error.message });
    }

    return apiSuccess(profile);
  } catch (error) {
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
