import { DATABASE_TABLES } from '@/config/database-tables';
import type { AnySupabaseClient } from '@/lib/supabase/types';

export interface EntityOwner {
  id: string; // actor or profile ID (for wallet lookup)
  user_id: string; // auth.users ID (for self-purchase detection)
  username: string | null;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Fetch the owner/creator profile for a public entity.
 * Handles both actor_id (actors table) and user_id/created_by (profiles table).
 */
export async function fetchEntityOwner(
  supabase: AnySupabaseClient,
  entity: { actor_id?: string | null; user_id?: string | null; created_by?: string | null }
): Promise<EntityOwner | null> {
  // Try actors table if actor_id is present — join profiles for user actors
  if (entity.actor_id) {
    const { data: actorData } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select(`
        id, actor_type, user_id, group_id,
        profiles:user_id (username, name, avatar_url)
      `)
      .eq('id', entity.actor_id)
      .maybeSingle();
    if (actorData) {
      type ActorRow = { id: string; user_id: string | null; profiles?: { username: string | null; name: string | null; avatar_url: string | null } };
      const actor = actorData as unknown as ActorRow;
      const profile = actor.profiles;
      return {
        id: actor.id,
        user_id: actor.user_id || '',
        username: profile?.username || null,
        name: profile?.name || null,
        avatar_url: profile?.avatar_url || null,
      };
    }
  }

  // Fallback to profiles table
  const profileId = entity.user_id || entity.created_by;
  if (profileId) {
    const { data: profileData } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username, name, avatar_url')
      .eq('id', profileId)
      .maybeSingle();
    if (profileData) {
      const profile = profileData as Record<string, string | null>;
      return {
        id: profileId,
        user_id: profileId,
        username: profile.username,
        name: profile.name,
        avatar_url: profile.avatar_url,
      };
    }
  }

  return null;
}
