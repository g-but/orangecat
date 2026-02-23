import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiNotFound,
  apiUnauthorized,
  handleApiError,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { getTableName } from '@/config/entity-registry';

// GET /api/research/[id] - Get specific research entity
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const tableName = getTableName('research');
    const { data: entity, error } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any
    )
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw error;
    }

    // Check if user can view this entity
    if (!entity.is_public && (!user || user.id !== entity.user_id)) {
      return apiUnauthorized('This research entity is private');
    }

    // Get additional data
    const [{ data: progressUpdates }, { data: votes }, { data: contributions }] = await Promise.all(
      [
        (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.RESEARCH_PROGRESS_UPDATES) as any
        )
          .select('*')
          .eq('research_entity_id', params.id)
          .order('created_at', { ascending: false }),
        (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.RESEARCH_VOTES) as any
        )
          .select('*')
          .eq('research_entity_id', params.id),
        (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.RESEARCH_CONTRIBUTIONS) as any
        )
          .select('*')
          .eq('research_entity_id', params.id)
          .order('created_at', { ascending: false }),
      ]
    );

    const enrichedEntity = {
      ...entity,
      progress_updates: progressUpdates || [],
      votes: votes || [],
      contributions: contributions || [],
    };

    return apiSuccess(enrichedEntity);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/research/[id] - Update research entity
export async function PUT(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const updates = await _request.json();

    // Check ownership
    const tableName = getTableName('research');
    const { data: existing, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any
    )
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw fetchError;
    }

    if (existing.user_id !== user.id) {
      return apiUnauthorized('You can only update your own research entities');
    }

    // Update the entity
    const { data: entity, error: updateError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any
    )
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    logger.info('Research entity updated', {
      researchEntityId: params.id,
      userId: user.id,
    });

    return apiSuccess(entity);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/research/[id] - Delete research entity
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Check ownership
    const tableName = getTableName('research');
    const { data: existing, error: fetchError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any
    )
      .select('user_id, funding_raised_sats')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return apiNotFound('Research entity not found');
      }
      throw fetchError;
    }

    if (existing.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own research entities');
    }

    // Prevent deletion if funding has been raised (protect contributors)
    if (existing.funding_raised_sats > 0) {
      return apiUnauthorized('Cannot delete research entity with funding. Archive instead.');
    }

    // Delete the entity (cascading deletes will handle related records)
    const { error: deleteError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(tableName) as any
    )
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      throw deleteError;
    }

    logger.info('Research entity deleted', {
      researchEntityId: params.id,
      userId: user.id,
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
