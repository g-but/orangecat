export interface Profile {
  id: string; // Primary key, matches auth.users.id
  username?: string | null;
  display_name?: string | null; // Matches form and a clean schema version
  bio?: string | null;
  avatar_url?: string | null;
  website?: string | null;    // Confirmed by logs to be in profile state
  email?: string | null;      // From original user-provided type & some migrations
  bitcoin_address?: string | null; // From form data
  lightning_address?: string | null; // Present in some schema versions
  created_at: string;
  updated_at: string;
  // Removed: full_name, user_id
} 