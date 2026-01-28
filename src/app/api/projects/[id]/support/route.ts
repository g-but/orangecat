/**
 * Project Support API Route
 *
 * Handles project support operations (donations, signatures, messages, reactions).
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored POST to use withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import projectSupportService from '@/services/projects/support';
import {
  supportProjectSchema,
  supportFiltersSchema,
  supportPaginationSchema,
} from '@/services/projects/support/validation';
import { logger } from '@/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/support - Get project support list
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters = {
      support_type: searchParams.get('support_type') || undefined,
      is_anonymous:
        searchParams.get('is_anonymous') === 'true'
          ? true
          : searchParams.get('is_anonymous') === 'false'
            ? false
            : undefined,
      user_id: searchParams.get('user_id') || undefined,
    };

    // Parse pagination
    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Validate filters and pagination
    const filtersValidation = supportFiltersSchema.safeParse(filters);
    const paginationValidation = supportPaginationSchema.safeParse(pagination);

    if (!filtersValidation.success || !paginationValidation.success) {
      return NextResponse.json(
        { error: 'Invalid filters or pagination parameters' },
        { status: 400 }
      );
    }

    // Get project support
    const result = await projectSupportService.getProjectSupport(
      projectId,
      filtersValidation.data,
      paginationValidation.data
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in GET /api/projects/[id]/support:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/support - Create project support
export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { id: projectId } = await context.params;

    const body = await request.json();

    // Validate request
    const validationResult = supportProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Create support
    const result = await projectSupportService.createProjectSupport(
      projectId,
      validationResult.data
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create support' },
        { status: 500 }
      );
    }

    return NextResponse.json({ support: result.support }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/projects/[id]/support:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
