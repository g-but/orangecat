/**
 * Actor Service
 *
 * Unified service for managing actors (users and groups).
 * Provides ownership checks and actor information.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created actor service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import type { Actor } from './types/actor';

/**
 * Get actor by ID
 */
export async function getActor(actorId: string): Promise<Actor | null> {
  try {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('id', actorId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get actor', error, 'Actors');
      return null;
    }

    return data as Actor | null;
  } catch (error) {
    logger.error('Exception getting actor', error, 'Actors');
    return null;
  }
}

/**
 * Get actor by user ID
 */
export async function getActorByUser(userId: string): Promise<Actor | null> {
  try {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('actor_type', 'user')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get actor by user', error, 'Actors');
      return null;
    }

    return data as Actor | null;
  } catch (error) {
    logger.error('Exception getting actor by user', error, 'Actors');
    return null;
  }
}

/**
 * Get actor by group ID
 */
export async function getActorByGroup(groupId: string): Promise<Actor | null> {
  try {
    const { data, error } = await supabase
      .from('actors')
      .select('*')
      .eq('actor_type', 'group')
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get actor by group', error, 'Actors');
      return null;
    }

    return data as Actor | null;
  } catch (error) {
    logger.error('Exception getting actor by group', error, 'Actors');
    return null;
  }
}

/**
 * Check if user owns or has access to entity
 */
export async function checkOwnership(
  entity: { actor_id: string | null },
  userId: string
): Promise<boolean> {
  try {
    if (!entity.actor_id) {
      return false;
    }

    const actor = await getActor(entity.actor_id);
    if (!actor) {
      return false;
    }

    // If actor is a user, check direct ownership
    if (actor.actor_type === 'user') {
      return actor.user_id === userId;
    }

    // If actor is a group, check membership
    if (actor.actor_type === 'group') {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', actor.group_id!)
        .eq('user_id', userId)
        .maybeSingle();

      return !!membership;
    }

    return false;
  } catch (error) {
    logger.error('Exception checking ownership', error, 'Actors');
    return false;
  }
}

/**
 * Get actor display name
 */
export async function getActorDisplayName(actorId: string): Promise<string> {
  try {
    const actor = await getActor(actorId);
    return actor?.display_name || 'Unknown';
  } catch (error) {
    logger.error('Exception getting actor display name', error, 'Actors');
    return 'Unknown';
  }
}
