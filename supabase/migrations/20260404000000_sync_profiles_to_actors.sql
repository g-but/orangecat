-- Phase 0A: Profile-to-Actor Sync Trigger
--
-- Problem: profiles and actors store duplicate identity fields (display_name,
-- avatar_url, slug/username). When a user updates their profile, the actor
-- row keeps stale data, causing entities to show old owner info.
--
-- Solution: Database trigger that syncs profile changes to the user's actor.
-- This makes profiles the SSOT for identity, with actors as a derived cache.

CREATE OR REPLACE FUNCTION sync_profile_to_actor()
RETURNS trigger AS $$
BEGIN
  UPDATE actors SET
    display_name = COALESCE(NEW.name, NEW.username, 'User'),
    avatar_url = NEW.avatar_url,
    slug = NEW.username,
    updated_at = now()
  WHERE user_id = NEW.id AND actor_type = 'user';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_to_actor ON profiles;
CREATE TRIGGER trg_sync_profile_to_actor
  AFTER UPDATE OF name, username, avatar_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_actor();
