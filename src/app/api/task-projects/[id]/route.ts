/**
 * Single Task Project API
 *
 * GET /api/task-projects/[id] - Get a project with its tasks
 * PATCH /api/task-projects/[id] - Update a project
 * DELETE /api/task-projects/[id] - Delete a project
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  apiSuccess,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { taskProjectUpdateSchema } from '@/lib/schemas/tasks';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Type for project ownership check
interface ProjectOwnership {
  created_by: string;
}

/**
 * GET /api/task-projects/[id]
 *
 * Get a single project with its tasks
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized('Authentication required');
    }

    // Fetch project with tasks
    const { data: project, error } = await supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .select(
        `
        *,
        tasks:tasks(
          id,
          title,
          category,
          priority,
          current_status,
          task_type,
          is_completed
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Project not found');
      }
      logger.error('Failed to fetch task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to fetch project');
    }

    return apiSuccess({ project });
  } catch (err) {
    logger.error('Exception in GET /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
}

/**
 * PATCH /api/task-projects/[id]
 *
 * Update a project
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized('Authentication required');
    }

    // Verify ownership
    const { data: projectData, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return apiNotFound('Project not found');
      }
      logger.error(
        'Failed to fetch project for update',
        { error: fetchError, id },
        'TaskProjectsAPI'
      );
      return apiInternalError();
    }

    const existingProject = projectData as ProjectOwnership;

    if (existingProject.created_by !== user.id) {
      return apiForbidden('Only the creator can edit this project');
    }

    // Parse and validate body
    const body = await request.json();
    const result = taskProjectUpdateSchema.safeParse(body);

    if (!result.success) {
      return apiValidationError('Validation failed', result.error.flatten());
    }

    const updateData = result.data;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (updateData.title !== undefined) {
      updates.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      updates.description = updateData.description || null;
    }
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
    }
    if (updateData.target_date !== undefined) {
      updates.target_date = updateData.target_date || null;
    }

    // Update project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to update task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to update project');
    }

    return apiSuccess({ project });
  } catch (err) {
    logger.error('Exception in PATCH /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
}

/**
 * DELETE /api/task-projects/[id]
 *
 * Delete a project (tasks will have project_id set to null)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized('Authentication required');
    }

    // Verify ownership
    const { data: deleteProjectData, error: fetchError } = await supabase
      .from(DATABASE_TABLES.TASK_PROJECTS)
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return apiNotFound('Project not found');
      }
      logger.error(
        'Failed to fetch project for deletion',
        { error: fetchError, id },
        'TaskProjectsAPI'
      );
      return apiInternalError();
    }

    const deleteProject = deleteProjectData as ProjectOwnership;

    if (deleteProject.created_by !== user.id) {
      return apiForbidden('Only the creator can delete this project');
    }

    // Delete project (tasks will have project_id set to null via ON DELETE SET NULL)
    const { error } = await supabase.from(DATABASE_TABLES.TASK_PROJECTS).delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete task project', { error, id }, 'TaskProjectsAPI');
      return apiInternalError('Failed to delete project');
    }

    return apiSuccess(null);
  } catch (err) {
    logger.error('Exception in DELETE /api/task-projects/[id]', { error: err }, 'TaskProjectsAPI');
    return apiInternalError();
  }
}
