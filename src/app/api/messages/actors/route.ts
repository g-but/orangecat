/**
 * Messaging Actors API
 *
 * GET /api/messages/actors - Get actors the user can send messages as
 *
 * Returns:
 * - User's personal actor (always)
 * - Group actors (if user is admin/moderator of the group)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

interface MessagingActor {
  actor_id: string;
  actor_type: 'user' | 'group';
  display_name: string;
  avatar_url: string | null;
  is_personal: boolean;
}

// Actor row shape from database
interface ActorRow {
  id: string;
  actor_type: string;
  display_name: string | null;
  avatar_url: string | null;
}

// Group membership row with nested group
interface GroupMembershipRow {
  group_id: string;
  role: string;
  groups: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    actor_id: string | null;
  } | null;
}

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { user } = req;
    const admin = createAdminClient();

    const actors: MessagingActor[] = [];

    // 1. Get user's personal actor
    const { data: personalActorData, error: personalError } = await admin
      .from(DATABASE_TABLES.ACTORS)
      .select('id, actor_type, display_name, avatar_url')
      .eq('user_id', user.id)
      .eq('actor_type', 'user')
      .maybeSingle();

    if (personalError) {
      logger.error(
        'Error fetching personal actor',
        { error: personalError, userId: user.id },
        'MessagingActors'
      );
    }

    const personalActor = personalActorData as ActorRow | null;
    if (personalActor) {
      actors.push({
        actor_id: personalActor.id,
        actor_type: 'user',
        display_name: personalActor.display_name || 'You',
        avatar_url: personalActor.avatar_url,
        is_personal: true,
      });
    }

    // 2. Get group actors where user is admin/moderator
    const { data: groupMemberships, error: groupError } = await admin
      .from(DATABASE_TABLES.GROUP_MEMBERS)
      .select(
        `
        group_id,
        role,
        groups:group_id (
          id,
          name,
          avatar_url,
          actor_id
        )
      `
      )
      .eq('user_id', user.id)
      .in('role', ['founder', 'admin', 'moderator']);

    if (groupError) {
      logger.error(
        'Error fetching group memberships',
        { error: groupError, userId: user.id },
        'MessagingActors'
      );
    }

    const memberships = (groupMemberships || []) as GroupMembershipRow[];
    if (memberships.length > 0) {
      // Batch query: collect all actor IDs, fetch in one query
      const actorIds = memberships.map(m => m.groups?.actor_id).filter((id): id is string => !!id);

      if (actorIds.length > 0) {
        const { data: groupActors } = await admin
          .from(DATABASE_TABLES.ACTORS)
          .select('id, actor_type, display_name, avatar_url')
          .in('id', actorIds);

        const actorMap = new Map((groupActors as ActorRow[] | null)?.map(a => [a.id, a]) ?? []);

        for (const membership of memberships) {
          const group = membership.groups;
          if (group?.actor_id) {
            const groupActor = actorMap.get(group.actor_id);
            if (groupActor) {
              actors.push({
                actor_id: groupActor.id,
                actor_type: 'group',
                display_name: groupActor.display_name || group.name || 'Group',
                avatar_url: groupActor.avatar_url || group.avatar_url,
                is_personal: false,
              });
            }
          }
        }
      }
    }

    return apiSuccess({ actors });
  } catch (error) {
    logger.error('Messaging actors API error', { error }, 'MessagingActors');
    return handleApiError(error);
  }
});
