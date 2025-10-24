import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { projectSchema } from '@/lib/validation';

// GET /api/projects/[id] - Get specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: project, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        profiles:user_id (
          id,
          username,
          name,
          avatar_url
        ),
        donations (
          id,
          amount,
          currency,
          status,
          anonymous,
          message,
          created_at,
          profiles:donor_id (
            id,
            username,
            name,
            avatar_url
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !project) {
      return apiNotFound('Project not found');
    }

    return apiSuccess(project);
  } catch (error) {
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
      return apiInternalError('Failed to update project', { details: error.message });
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
      return apiInternalError('Failed to delete project', { details: error.message });
    }

    return apiSuccess({ message: 'Project deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
