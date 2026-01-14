import { projectSchema } from '@/lib/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { logger } from '@/utils/logger';
import { createEntityCrudHandlers } from '@/lib/api/entityCrudHandler';
import {
  createUpdatePayloadBuilder,
  commonFieldMappings,
  entityTransforms,
} from '@/lib/api/buildUpdatePayload';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_TABLES } from '@/config/database-tables';

// Post-process GET: Fetch profile and add to response
async function postProcessProjectGet(
  project: Record<string, unknown>,
  userId: string | null,
  supabase: SupabaseClient
): Promise<Record<string, unknown>> {
  let profile = null;
  const projectUserId = project.user_id as string | undefined;

  if (projectUserId) {
    const { data: profileData, error: profileError } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id, username, name, avatar_url, email')
      .eq('id', projectUserId)
      .maybeSingle();

    if (profileError) {
      logger.warn(
        'Error fetching profile for project',
        {
          projectId: project.id,
          userId: projectUserId,
          error: profileError,
        },
        'GET /api/projects/[id]'
      );
    } else if (profileData) {
      profile = profileData;
    } else {
      logger.warn(
        'Profile not found for project creator',
        {
          projectId: project.id,
          userId: projectUserId,
        },
        'GET /api/projects/[id]'
      );
    }
  }

  return {
    ...project,
    raised_amount: (project.raised_amount as number) ?? 0,
    profiles: profile,
  };
}

// Post-process PUT: Audit logging
async function postProcessProjectPut(
  project: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, userId, 'project', project.id as string, {
    action: 'update',
    updatedFields: Object.keys(project),
    title: project.title as string,
  });
}

// Post-process DELETE: Audit logging
async function postProcessProjectDelete(
  project: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, userId, 'project', project.id as string, {
    action: 'delete',
    title: project.title as string,
    category: project.category as string,
  });
}

// Build update payload from validated project data
const buildProjectUpdatePayload = createUpdatePayloadBuilder([
  { from: 'title' },
  { from: 'description', transform: entityTransforms.emptyStringToNull },
  { from: 'goal_amount' },
  // Currency: only include if explicitly provided (don't override existing value)
  // Currency is for display/input only - all transactions are in BTC
  { from: 'currency' },
  { from: 'funding_purpose', transform: entityTransforms.emptyStringToNull },
  { from: 'bitcoin_address', transform: entityTransforms.emptyStringToNull },
  { from: 'lightning_address', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.urlField('website_url'),
  { from: 'category', transform: entityTransforms.emptyStringToNull },
  commonFieldMappings.arrayField('tags', []),
  commonFieldMappings.dateField('start_date'), // Normalize date fields
  commonFieldMappings.dateField('target_completion'),
]);

// Create handlers using generic CRUD factory
const { GET, PUT, DELETE } = createEntityCrudHandlers({
  entityType: 'project',
  schema: projectSchema,
  buildUpdatePayload: buildProjectUpdatePayload,
  requireActiveStatus: false, // Projects don't have status field
  postProcessGet: postProcessProjectGet,
  postProcessPut: postProcessProjectPut,
  postProcessDelete: postProcessProjectDelete,
  getCacheControl: () => 'public, s-maxage=60, stale-while-revalidate=300',
});

export { GET, PUT, DELETE };
