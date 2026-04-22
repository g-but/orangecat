import { NextRequest } from 'next/server';
import { withAuth, withOptionalAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { z } from 'zod';

const progressUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  milestone_achieved: z.boolean().optional(),
  funding_released: z.number().min(0).optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/research/[id]/progress - Get progress updates
export const GET = withOptionalAuth(async (request, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  try {
    const { user, supabase } = request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: entity, error: entityError } = await db
      .from(DATABASE_TABLES.RESEARCH_ENTITIES)
      .select('id, user_id, is_public')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }

    if (!entity.is_public && (!user || user.id !== entity.user_id)) {
      return apiUnauthorized('This research entity is private');
    }

    const { data: updates, error } = await db
      .from(DATABASE_TABLES.RESEARCH_PROGRESS_UPDATES)
      .select('*')
      .eq('research_entity_id', id)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    return apiSuccess(updates || []);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research/[id]/progress - Create progress update
export const POST = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'research ID'));
  if (idValidation) {return idValidation;}
  const { user, supabase } = request;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: entity, error: entityError } = await db
      .from(DATABASE_TABLES.RESEARCH_ENTITIES)
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {return apiNotFound('Research entity not found');}
      throw entityError;
    }
    if (entity.user_id !== user.id) {
      return apiUnauthorized('You can only post progress updates for your own research entities');
    }

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {return apiRateLimited('Too many updates. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));}

    const rawBody = await (request as NextRequest).json();
    const parsed = progressUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {return apiBadRequest(parsed.error.errors[0]?.message || 'Invalid progress update data');}
    const { title, description, milestone_achieved, funding_released, attachments } = parsed.data;

    const { data: update, error } = await db
      .from(DATABASE_TABLES.RESEARCH_PROGRESS_UPDATES)
      .insert({
        research_entity_id: id,
        user_id: user.id,
        title,
        description,
        milestone_achieved: milestone_achieved ?? false,
        funding_released: funding_released ?? 0,
        attachments: attachments ?? [],
      })
      .select()
      .single();

    if (error) {throw error;}

    if (milestone_achieved) {
      await db.rpc('increment_research_completion', {
        research_entity_id: id,
        percentage_increase: 10,
      });
    }

    return apiSuccess(update, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
