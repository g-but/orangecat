-- Fix recursive RLS policy on conversation_participants by using a SECURITY DEFINER helper
-- Idempotent: creates function if missing, recreates policy referencing the function

DO $$
BEGIN
  -- Create or replace helper function (SECURITY DEFINER) used in policies
  CREATE OR REPLACE FUNCTION can_user_view_participants(p_conversation_id uuid, p_user_id uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  allowed boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
      AND cp.is_active = true
  ) INTO allowed;
  RETURN allowed;
END;
$$;

  -- Ensure owner is the table owner so SECURITY DEFINER has proper privileges
  -- (optional: Supabase usually creates objects owned by the authenticated role)

  -- Drop old recursive policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can view conversation participants'
      AND tablename = 'conversation_participants'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view conversation participants" ON conversation_participants';
  END IF;

  -- Recreate policy using the helper function (non-recursive)
  EXECUTE $$
    CREATE POLICY "Users can view conversation participants"
    ON conversation_participants FOR SELECT
    USING (
      can_user_view_participants(conversation_participants.conversation_id, auth.uid())
    )
  $$;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_user_view_participants IS 'Checks whether the given user participates (active) in the given conversation (used in RLS policies to avoid recursion)';

