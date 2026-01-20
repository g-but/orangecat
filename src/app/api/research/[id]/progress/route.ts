import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserWriteLimit, RateLimitError } from '@/lib/api/rateLimiting';

// Helper to extract ID from URL
function extractIdFromUrl(url: string): string {
  const segments = new URL(url).pathname.split('/');
  const idx = segments.findIndex(s => s === 'research');
  return segments[idx + 1] || '';
}

// GET /api/research/[id]/progress - Get progress updates
export const GET = compose(
  withRateLimit('read')
)(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();

    // Check if research entity exists and is accessible
    const { data: entity, error: entityError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('research_entities') as any)
      .select('id, user_id, is_public')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Check access permissions
    if (!entity.is_public && (!user || user.id !== entity.user_id)) {
      return apiUnauthorized('This research entity is private');
    }

    // Get progress updates
    const { data: updates, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('research_progress_updates') as any)
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
export const POST = compose(
  withRateLimit('write')
)(async (request: NextRequest) => {
  const id = extractIdFromUrl(request.url);
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Check if user owns this research entity
    const { data: entity, error: entityError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('research_entities') as any)
      .select('id, user_id, transparency_level')
      .eq('id', id)
      .single();

    if (entityError) {
      if (entityError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw entityError;
    }

    if (entity.user_id !== user.id) {
      return apiUnauthorized('You can only post progress updates for your own research entities');
    }

    // Rate limit check
    let rl: RateLimitResult;
    try {
      rl = await enforceUserWriteLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        return apiRateLimited('Too many updates. Please slow down.', retryAfter);
      }
      throw e;
    }

    const { title, description, milestone_achieved, funding_released, attachments } = await request.json();

    if (!title || !description) {
      return apiUnauthorized('Title and description are required');
    }

    // Create progress update
    const { data: update, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('research_progress_updates') as any)
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

    // Update research entity metrics if milestone achieved
    if (milestone_achieved) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_research_completion', {
        research_entity_id: id,
        percentage_increase: 10 // Assume 10% progress per milestone
      });
    }

    logger.info('Research progress update created', {
      researchEntityId: id,
      updateId: update.id,
      userId: user.id,
      milestoneAchieved: milestone_achieved
    });

    return applyRateLimitHeaders(apiSuccess(update, { status: 201 }), rl);
  } catch (error) {
    return handleApiError(error);
  }
});
