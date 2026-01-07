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
import { withRateLimit } from '@/lib/api/withRateLimit';
import { rateLimitWrite } from '@/lib/rate-limit';

// GET /api/research-entities/[id]/progress - Get progress updates
export const GET = withRateLimit('read')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createServerClient();

    // Check if research entity exists and is accessible
    const { data: entity, error: entityError } = await supabase
      .from('research_entities')
      .select('id, user_id, is_public')
      .eq('id', params.id)
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
    const { data: updates, error } = await supabase
      .from('research_progress_updates')
      .select('*')
      .eq('research_entity_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {throw error;}

    return apiSuccess(updates || []);
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/research-entities/[id]/progress - Create progress update
export const POST = withRateLimit('write')(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Check if user owns this research entity
    const { data: entity, error: entityError } = await supabase
      .from('research_entities')
      .select('id, user_id, transparency_level')
      .eq('id', params.id)
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
    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many updates. Please slow down.', retryAfter);
    }

    const { title, description, milestone_achieved, funding_released, attachments } = await request.json();

    if (!title || !description) {
      return apiUnauthorized('Title and description are required');
    }

    // Create progress update
    const { data: update, error } = await supabase
      .from('research_progress_updates')
      .insert({
        research_entity_id: params.id,
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
      await supabase.rpc('increment_research_completion', {
        research_entity_id: params.id,
        percentage_increase: 10 // Assume 10% progress per milestone
      });
    }

    logger.info('Research progress update created', {
      researchEntityId: params.id,
      updateId: update.id,
      userId: user.id,
      milestoneAchieved: milestone_achieved
    });

    return apiSuccess(update, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});