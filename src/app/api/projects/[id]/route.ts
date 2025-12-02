import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { projectSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

// GET /api/projects/[id] - Get specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // Validate project ID
    const idValidation = getValidationError(validateUUID(id, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();

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
        .select('id, username, name, avatar_url, email')
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
    const { id } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(id, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

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

    const body = await request.json();

    // Validate input data
    const validatedData = projectSchema.parse(body);

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      logger.error('Project not found for update', { projectId: id, userId: user.id });
      return apiNotFound('Project not found');
    }

    if (existingProject.user_id !== user.id) {
      logger.warn('Unauthorized project update attempt', {
        projectId: id,
        userId: user.id,
        ownerId: existingProject.user_id,
      });
      return apiForbidden('You can only update your own projects');
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
      logger.error('Failed to update project', {
        projectId: id,
        userId: user.id,
        error: error.message,
      });
      return handleSupabaseError(error);
    }

    // Audit log project update
    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', id, {
      action: 'update',
      updatedFields: Object.keys(validatedData),
      title: project.title,
    });

    logger.info('Project updated successfully', { projectId: id, userId: user.id });
    return apiSuccess(project);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return apiValidationError('Invalid project data');
    }
    logger.error('Unexpected error updating project', { error });
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate project ID
    const idValidation = getValidationError(validateUUID(id, 'project ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id, title, category')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      logger.error('Project not found for deletion', { projectId: id, userId: user.id });
      return apiNotFound('Project not found');
    }

    if (existingProject.user_id !== user.id) {
      logger.warn('Unauthorized project deletion attempt', {
        projectId: id,
        userId: user.id,
        ownerId: existingProject.user_id,
      });
      return apiForbidden('You can only delete your own projects');
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete project', {
        projectId: id,
        userId: user.id,
        error: error.message,
      });
      return handleSupabaseError(error);
    }

    // Audit log project deletion
    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', id, {
      action: 'delete',
      title: existingProject.title,
      category: existingProject.category,
    });

    logger.info('Project deleted successfully', { projectId: id, userId: user.id });
    return apiSuccess({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Unexpected error deleting project', { error });
    return handleApiError(error);
  }
}
