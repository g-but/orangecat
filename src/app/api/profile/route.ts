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
      return apiNotFound('Profile not found');
    }

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
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
