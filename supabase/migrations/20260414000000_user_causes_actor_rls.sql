-- Migrate user_causes RLS policies from user_id to actor_id
--
-- Background: The actor_id column was backfilled from user_id in migration
-- 20260226000000_backfill_actor_ids.sql. Application code already uses actor_id
-- exclusively (via entity-registry userIdField: 'actor_id'). The old policies
-- used auth.uid() = user_id which is no longer correct for the actor-based model.
-- New policies check actor_id membership via the actors table.

-- Drop the four old user_id-based policies
DROP POLICY IF EXISTS "Public causes are viewable by everyone" ON user_causes;
DROP POLICY IF EXISTS "Users can insert their own causes" ON user_causes;
DROP POLICY IF EXISTS "Users can update their own causes" ON user_causes;
DROP POLICY IF EXISTS "Users can delete their own causes" ON user_causes;

-- Recreate policies using actor_id
-- SELECT: public active causes visible to all (unchanged), own draft/paused causes visible to owner
CREATE POLICY "Public causes are viewable by everyone" ON user_causes
  FOR SELECT USING (
    status = 'active'
    OR actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own causes" ON user_causes
  FOR INSERT WITH CHECK (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own causes" ON user_causes
  FOR UPDATE USING (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own causes" ON user_causes
  FOR DELETE USING (
    actor_id IN (SELECT id FROM actors WHERE user_id = auth.uid())
  );
