import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiBadRequest,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';

function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research');
  return segments[idx + 1] || '';
}

// GET /api/research/[id]/progress - Get progress updates
export const GET = compose(withRateLimit('read'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
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

    const { data: { user } } = await supabase.auth.getUser();
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
export const POST = compose(withRateLimit('write'))(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {return apiUnauthorized();}

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

    const { title, description, milestone_achieved, funding_released, attachments } = await request.json();
    if (!title || !description) {return apiBadRequest('Title and description are required');}

    const { data: update, error } = await db
      .from(DATABASE_TABLES.RESEARCH_PROGRESS_UPDATES)
      .insert({
        research_entity_id: id,
        user_id: user.id,
        title,
        description,
        milestone_achieved: milestone_achieved || false,
        funding_released: funding_released || 0,
        attachments: attachments || [],
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
