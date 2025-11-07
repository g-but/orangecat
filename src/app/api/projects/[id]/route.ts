import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { projectSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

// GET /api/projects/[id] - Get specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const supabase = await createServerClient();

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return apiNotFound('Invalid project ID');
    }

    // Fetch project first
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (projectError || !project) {
      if (projectError) {
        return handleSupabaseError(projectError);
      }
      return apiNotFound('Project not found');
    }

    // Fetch profile separately (more reliable than JOIN without explicit FK)
    let profile = null;
    if (project.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, email')
        .eq('id', project.user_id)
        .maybeSingle();

      if (profileError) {
        // Log but don't fail - project should still be returned
        logger.warn(
          'Error fetching profile for project',
          {
            projectId: id,
            userId: project.user_id,
            error: profileError,
          },
          'GET /api/projects/[id]'
        );
      } else if (profileData) {
        profile = profileData;
      } else {
        // Profile doesn't exist - log for debugging
        logger.warn(
          'Profile not found for project creator',
          {
            projectId: id,
            userId: project.user_id,
          },
          'GET /api/projects/[id]'
        );
      }
    }

    const projectWithProfile = {
      ...project,
      raised_amount: project.raised_amount ?? 0,
      profiles: profile,
    };

    // Cache project data for 60 seconds (projects don't change frequently)
    return apiSuccess(projectWithProfile, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error(
      'Exception in GET /api/projects/[id]',
      { projectId: id, error },
      'GET /api/projects/[id]'
    );
    return handleApiError(error);
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting check (stricter for PUT)
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

    const { id } = await params;
    const body = await request.json();

    // Validate input data
    const validatedData = projectSchema.parse(body);

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return apiNotFound('Project not found');
    }

    if (existingProject.user_id !== user.id) {
      return apiUnauthorized('You can only update your own projects');
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error);
    }

    return apiSuccess(project);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return apiValidationError('Invalid project data');
    }
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      return apiNotFound('Project not found');
    }

    if (existingProject.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own projects');
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      return handleSupabaseError(error);
    }

    return apiSuccess({ message: 'Project deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
