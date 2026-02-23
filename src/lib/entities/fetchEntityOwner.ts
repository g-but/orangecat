import { DATABASE_TABLES } from '@/config/database-tables';

export interface EntityOwner {
  username: string | null;
  name: string | null;
  avatar_url: string | null;
}

/**
 * Fetch the owner/creator profile for a public entity.
 * Handles both actor_id (actors table) and user_id/organizer_id (profiles table).
 */
export async function fetchEntityOwner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  entity: { actor_id?: string | null; user_id?: string | null; organizer_id?: string | null }
): Promise<EntityOwner | null> {
  // Try actors table if actor_id is present
  if (entity.actor_id) {
    const { data: actorData } = await supabase
      .from(DATABASE_TABLES.ACTORS)
      .select('username, display_name, avatar_url')
      .eq('id', entity.actor_id)
      .maybeSingle();
    if (actorData) {
      return {
        username: (actorData as Record<string, string | null>).username,
        name: (actorData as Record<string, string | null>).display_name,
        avatar_url: (actorData as Record<string, string | null>).avatar_url,
      };
    }
  }

  // Fallback to profiles table
  const profileId = entity.organizer_id || entity.user_id;
  if (profileId) {
    const { data: profileData } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username, name, avatar_url')
      .eq('id', profileId)
      .maybeSingle();
    if (profileData) {
      const profile = profileData as Record<string, string | null>;
      return { username: profile.username, name: profile.name, avatar_url: profile.avatar_url };
    }
  }

  return null;
}
