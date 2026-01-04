/**
 * Actor Types
 *
 * Type definitions for the unified actor system.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Created actor types
 */

export type ActorType = 'user' | 'group';

export interface Actor {
  id: string;
  actor_type: ActorType;
  user_id: string | null;
  group_id: string | null;
  display_name: string;
  avatar_url: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}


