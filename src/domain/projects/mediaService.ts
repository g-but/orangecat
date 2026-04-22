/**
 * Project Media Service
 *
 * Business logic for creating project media records.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const MAX_MEDIA_PER_PROJECT = 3;

export type SaveMediaResult =
  | { ok: true; media: Record<string, unknown> }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' | 'COUNT_EXCEEDED' | 'DB_ERROR'; message: string };

export async function saveProjectMedia(
  supabase: AnyClient,
  projectId: string,
  userId: string,
  path: string,
  altText: string | undefined
): Promise<SaveMediaResult> {
  const { data: project } = await supabase
    .from(getTableName('project'))
    .select('user_id')
    .eq('id', projectId)
    .single();

  if (!project) return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  if (project.user_id !== userId) return { ok: false, code: 'FORBIDDEN', message: 'You can only upload media to your own projects' };

  const { count, error: countError } = await supabase
    .from(DATABASE_TABLES.PROJECT_MEDIA)
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (countError) {
    logger.error('Failed to check media count', { projectId, userId, error: countError.message });
    return { ok: false, code: 'DB_ERROR', message: 'Failed to check media count' };
  }

  if (count !== null && count >= MAX_MEDIA_PER_PROJECT) {
    return { ok: false, code: 'COUNT_EXCEEDED', message: `Maximum ${MAX_MEDIA_PER_PROJECT} images per project` };
  }

  // Find the first available position (0, 1, or 2)
  const { data: existing } = await supabase
    .from(DATABASE_TABLES.PROJECT_MEDIA)
    .select('position')
    .eq('project_id', projectId);

  const taken = new Set((existing || []).map((m: { position: number }) => m.position));
  const nextPosition = [0, 1, 2].find(i => !taken.has(i)) ?? 0;

  const { data: media, error } = await supabase
    .from(DATABASE_TABLES.PROJECT_MEDIA)
    .insert({ project_id: projectId, storage_path: path, position: nextPosition, alt_text: altText })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create media record', { projectId, userId, error: error.message });
    return { ok: false, code: 'DB_ERROR', message: 'Failed to create media record' };
  }

  await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, userId, 'project', projectId, {
    action: 'media_upload',
    mediaId: media.id,
    position: nextPosition,
    path,
  });

  return { ok: true, media: media as Record<string, unknown> };
}
