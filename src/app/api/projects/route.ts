import { NextRequest } from 'next/server';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { projectSchema, type ProjectData } from '@/lib/validation';
import { handleApiError, apiSuccess } from '@/lib/api/standardResponse';
import { getPagination, resolveOwnerFilter } from '@/lib/api/query';
import { listProjectsPage, createProject } from '@/domain/projects/service';
import { calculatePage, getCacheControl } from '@/lib/api/helpers';
import { createEntityPostHandler } from '@/lib/api/entityPostHandler';
import { getAuthenticatedUserId, shouldIncludeDrafts } from '@/lib/api/authHelpers';

// GET /api/projects - Get all projects
//
// Accepts `?user_id=<uuid>` or `?username=<handle>` to scope the list to one
// owner. An unknown handle returns an EMPTY page — never the unfiltered list;
// see resolveOwnerFilter for why that distinction is load-bearing.
//
// Security: when an owner is requested, only return drafts if the
// authenticated user IS that owner. Without this guard, anonymous callers can
// enumerate any user's drafts by passing their UUID. The actor lookup
// downstream resolves the UUID to actor_id, which then becomes a public
// data window for that owner.
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const { userId: requestedUserId, unresolved } = await resolveOwnerFilter(request.url);
    if (unresolved) {
      // The caller asked for one person's projects and that person does not
      // exist. Answering with everyone's would be a wrong answer, not a
      // broader one.
      return apiSuccess([], {
        page: calculatePage(offset, limit),
        limit,
        total: 0,
        headers: { 'Cache-Control': getCacheControl(false) },
      });
    }
    const authenticatedUserId = await getAuthenticatedUserId();
    const includeOwnDrafts = await shouldIncludeDrafts(
      requestedUserId ?? null,
      authenticatedUserId
    );
    const { items, total } = await listProjectsPage(
      limit,
      offset,
      requestedUserId,
      includeOwnDrafts
    );
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
  useActorOwnership: true,
  createEntity: async (userId, data, supabase) => {
    // Pass the handler-chosen client through so bearer-auth writes use the
    // service-role client (RLS can't apply without a Supabase session). The
    // handler already enforced auth + scope + actor ownership.
    return await createProject(userId, data as unknown as ProjectData, supabase);
  },
});
