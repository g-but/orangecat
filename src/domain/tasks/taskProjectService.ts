/**
 * Task Project Service
 *
 * Shared helpers for the task-projects API routes.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

/**
 * Verify the caller owns the task project.
 * Returns 'not_found' | 'forbidden' | 'ok'.
 */
export async function verifyTaskProjectOwner(
  supabase: AnyClient,
  id: string,
  userId: string
): Promise<'not_found' | 'forbidden' | 'ok'> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.TASK_PROJECTS)
    .select('created_by')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return 'not_found';
    logger.error('Failed to fetch task project for ownership check', { error, id }, 'TaskProjectsAPI');
    return 'not_found';
  }

  return data.created_by === userId ? 'ok' : 'forbidden';
}

/**
 * Build the update object for PATCH from validated data.
 */
export function buildTaskProjectUpdates(updateData: {
  title?: string;
  description?: string | null;
  status?: string;
  target_date?: string | null;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (updateData.title !== undefined) updates.title = updateData.title;
  if (updateData.description !== undefined) updates.description = updateData.description || null;
  if (updateData.status !== undefined) updates.status = updateData.status;
  if (updateData.target_date !== undefined) updates.target_date = updateData.target_date || null;
  return updates;
}
