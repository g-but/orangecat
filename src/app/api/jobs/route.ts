/**
 * Public Job Postings API
 *
 * GET /api/jobs - Browse public job postings
 * 
 * Follows Network State Development Guide - Job Postings feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { getPublicJobPostings } from '@/services/groups/queries/proposals';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const location = searchParams.get('location') || undefined;
    const job_type = searchParams.get('job_type') || undefined;

    const result = await getPublicJobPostings({ limit, offset, location, job_type });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return apiSuccess({
      jobs: result.proposals,
      total: result.total,
    });
  } catch (error) {
    logger.error('Error in GET /api/jobs:', error);
    return handleApiError(error);
  }
}

