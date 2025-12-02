import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { projectSchema, type ProjectData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fix N+1 query: Use JOIN to fetch profiles in a single query
    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        profiles!inner(id, username, name, avatar_url, email)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiInternalError('Failed to fetch projects', { details: error.message });
    }

    // Transform response: Supabase returns nested profiles array, flatten it
    const projectsWithProfiles = (projects || []).map(project => ({
      ...project,
      raised_amount: project.raised_amount ?? 0,
      // Supabase returns profiles as array with JOIN, extract first element
      profiles: Array.isArray(project.profiles) ? project.profiles[0] : project.profiles,
    }));

    // Add cache headers for GET requests
    // Cache for 60 seconds, allow stale-while-revalidate for 5 minutes
    return apiSuccess(projectsWithProfiles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limiting check - 30 writes per minute per user
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('Project creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many project creation requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Build insert payload based on current simplified schema (user_id, title, etc.)
    const insertPayload = {
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      goal_amount: validatedData.goal_amount ?? null,
      currency: validatedData.currency ?? 'SATS',
      funding_purpose: validatedData.funding_purpose ?? null,
      bitcoin_address: validatedData.bitcoin_address ?? null,
      lightning_address: validatedData.lightning_address ?? null,
      website_url: validatedData.website_url ?? null,
      category: validatedData.category ?? null,
      tags: validatedData.tags ?? [],
      status: 'draft', // Projects start as draft, must be explicitly published to become 'active'
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('Project creation failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    // Audit log project creation
    await auditSuccess(AUDIT_ACTIONS.PROJECT_CREATED, user.id, 'project', project.id, {
      title: project.title,
      category: project.category,
      goalAmount: project.goal_amount,
      currency: project.currency,
    });

    logger.info('Project created successfully', { userId: user.id, projectId: project.id });
    return apiSuccess(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid project data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}
