import { NextRequest } from 'next/server';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { withRequestId } from '@/lib/api/withRequestId';
import { withZodBody } from '@/lib/api/withZod';
import { projectSchema } from '@/lib/validation';
import { createServerClient } from '@/lib/supabase/server';
import { rateLimitWrite } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiUnauthorized,
  handleApiError,
  apiRateLimited,
  apiValidationError,
} from '@/lib/api/standardResponse';
import { getPagination } from '@/lib/api/query';
import { listProjectsPage, createProject } from '@/domain/projects/service';

// GET /api/projects - Get all projects
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const { items, total } = await listProjectsPage(limit, offset);
    return apiSuccess(items, {
      page: Math.floor(offset / limit) + 1,
      limit,
      total,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/projects - Create new project
export const POST = compose(
  withRequestId(),
  withZodBody(projectSchema)
)(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return apiUnauthorized();
    }

    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      logger.warn('Project creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many project creation requests. Please slow down.', retryAfter);
    }

    const project = await createProject(user.id, ctx.body);
    logger.info('Project created successfully', { userId: user.id, projectId: project.id });
    return apiSuccess(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error as any).name === 'ZodError') {
      const zodError: any = error;
      return apiValidationError('Invalid project data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
});
