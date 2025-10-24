import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { projectSchema, type ProjectData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';

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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiInternalError('Failed to fetch projects', { details: error.message });
    }

    return apiSuccess(projects || []);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (stricter for POST)
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Map validation schema fields to database columns
    const dbData = {
      title: validatedData.title,
      description: validatedData.description,
      goal_amount: validatedData.goal_amount,
      currency: validatedData.currency,
      funding_purpose: validatedData.funding_purpose,
      bitcoin_address: validatedData.bitcoin_address,
      lightning_address: validatedData.lightning_address,
      category: validatedData.category,
      tags: validatedData.tags,
      user_id: user.id, // Database uses user_id, not creator_id
      status: 'active', // Set to active immediately for MVP
    };

    const { data: project, error } = await supabase
      .from('projects')
      .insert(dbData)
      .select('*')
      .single();

    if (error) {
      return apiInternalError('Failed to create project', { details: error.message });
    }

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
