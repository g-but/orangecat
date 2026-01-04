import { NextRequest } from 'next/server';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { projectSchema } from '@/lib/validation';
import { createServerClient } from '@/lib/supabase/server';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { getPagination } from '@/lib/api/query';
import { listProjectsPage, createProject } from '@/domain/projects/service';
import { calculatePage, getCacheControl } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';

// GET /api/projects - Get all projects
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const { items, total } = await listProjectsPage(limit, offset);
    return apiSuccess(items, {
      page: calculatePage(offset, limit),
      limit,
      total,
      headers: { 'Cache-Control': getCacheControl(false) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/projects - Create new project
export const POST = createEntityPostHandler({
  entityType: 'project',
  schema: projectSchema,
  createEntity: async (userId, data, supabase) => {
    return await createProject(userId, data);
  },
});
