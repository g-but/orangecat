import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { projectSchema, type ProjectData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiInternalError('Failed to fetch projects', { details: error.message });
    }

    // Fetch profiles for all projects
    const projectsWithProfiles = await Promise.all(
      (projects || []).map(async project => {
        let profile = null;
        if (project.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, name, avatar_url')
            .eq('id', project.user_id)
            .single();
          profile = profileData;
        }

        return {
          ...project,
          raised_amount: project.raised_amount ?? 0,
          profiles: profile,
        };
      })
    );

    return apiSuccess(projectsWithProfiles);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (stricter for POST)
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Build insert payload based on current simplified schema (user_id, title, etc.)
    const insertPayload = {
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      goal_amount: validatedData.goal_amount ?? null,
      currency: validatedData.currency ?? 'SATS',
      funding_purpose: validatedData.funding_purpose ?? null,
      bitcoin_address: validatedData.bitcoin_address ?? null,
      lightning_address: validatedData.lightning_address ?? null,
      category: validatedData.category ?? null,
      tags: validatedData.tags ?? [],
      status: 'active',
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      try {
        console.error('[API] /api/projects insert error:', error);
      } catch {}
      return handleSupabaseError(error);
    }

    return apiSuccess(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid project data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}
