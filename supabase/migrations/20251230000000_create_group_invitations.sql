-- =============================================
-- GROUP INVITATIONS SYSTEM
--
-- Enables pending invitations for groups:
-- - Direct user invitations (user_id)
-- - Link/token invitations (for sharing)
-- - Email invitations (for non-users)
-- =============================================

-- Step 1: Create group_invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

  -- Invitation target (one of these should be set)
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Direct user invitation
  email text, -- Email invitation for non-users
  token text UNIQUE, -- Shareable link token

  -- Invitation details
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  message text, -- Optional personal message from inviter

  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),

  -- Metadata
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT invitation_target_check CHECK (
    (user_id IS NOT NULL AND email IS NULL AND token IS NULL) OR
    (user_id IS NULL AND email IS NOT NULL AND token IS NULL) OR
    (user_id IS NULL AND email IS NULL AND token IS NOT NULL) OR
    (user_id IS NOT NULL AND token IS NOT NULL) -- User + shareable link combo
  )
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_group_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_user ON group_invitations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_invitations_email ON group_invitations(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON group_invitations(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_by ON group_invitations(invited_by);

-- Step 3: Enable RLS
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Invited users can view their invitations
CREATE POLICY "Users can view their invitations" ON group_invitations
  FOR SELECT USING (user_id = auth.uid());

-- Group admins/founders can view all invitations for their groups
CREATE POLICY "Admins can view group invitations" ON group_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invitations.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

-- Anyone can view invitations by token (for link invites)
CREATE POLICY "Token invitations are viewable" ON group_invitations
  FOR SELECT USING (token IS NOT NULL AND status = 'pending');

-- Admins/founders can create invitations
CREATE POLICY "Admins can create invitations" ON group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invitations.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

-- Invited users can respond to their invitations
CREATE POLICY "Users can respond to their invitations" ON group_invitations
  FOR UPDATE USING (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- Admins can revoke invitations
CREATE POLICY "Admins can revoke invitations" ON group_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invitations.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('founder', 'admin')
    )
  );

-- Step 5: Helper function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(24), 'base64');
END;
$$;

-- Step 6: Function to accept invitation
CREATE OR REPLACE FUNCTION accept_group_invitation(invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv RECORD;
  result jsonb;
BEGIN
  -- Get invitation
  SELECT * INTO inv FROM group_invitations WHERE id = invitation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Check if pending
  IF inv.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is no longer pending');
  END IF;

  -- Check if expired
  IF inv.expires_at < now() THEN
    UPDATE group_invitations SET status = 'expired' WHERE id = invitation_id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Check authorization (user_id matches OR token-based)
  IF inv.user_id IS NOT NULL AND inv.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation is for another user');
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = inv.group_id AND user_id = COALESCE(inv.user_id, auth.uid())
  ) THEN
    -- Update invitation status anyway
    UPDATE group_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = invitation_id;

    RETURN jsonb_build_object('success', true, 'already_member', true, 'group_id', inv.group_id);
  END IF;

  -- Add as member
  INSERT INTO group_members (group_id, user_id, role, invited_by)
  VALUES (inv.group_id, COALESCE(inv.user_id, auth.uid()), inv.role, inv.invited_by);

  -- Update invitation status
  UPDATE group_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = invitation_id;

  RETURN jsonb_build_object('success', true, 'group_id', inv.group_id);
END;
$$;

-- Step 7: Function to decline invitation
CREATE OR REPLACE FUNCTION decline_group_invitation(invitation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inv RECORD;
BEGIN
  -- Get invitation
  SELECT * INTO inv FROM group_invitations WHERE id = invitation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  -- Check if pending
  IF inv.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is no longer pending');
  END IF;

  -- Check authorization
  IF inv.user_id IS NOT NULL AND inv.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation is for another user');
  END IF;

  -- Update status
  UPDATE group_invitations
  SET status = 'declined', responded_at = now()
  WHERE id = invitation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Step 8: Function to get pending invitations for a user
CREATE OR REPLACE FUNCTION get_user_pending_invitations(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  group_id uuid,
  group_name text,
  group_slug text,
  group_avatar_url text,
  role text,
  message text,
  inviter_id uuid,
  inviter_name text,
  inviter_avatar_url text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    gi.id,
    gi.group_id,
    g.name as group_name,
    g.slug as group_slug,
    g.avatar_url as group_avatar_url,
    gi.role,
    gi.message,
    gi.invited_by as inviter_id,
    p.name as inviter_name,
    p.avatar_url as inviter_avatar_url,
    gi.expires_at,
    gi.created_at
  FROM group_invitations gi
  JOIN groups g ON g.id = gi.group_id
  LEFT JOIN profiles p ON p.id = gi.invited_by
  WHERE gi.user_id = user_uuid
    AND gi.status = 'pending'
    AND gi.expires_at > now()
  ORDER BY gi.created_at DESC;
$$;

-- Step 9: Cleanup job for expired invitations (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE group_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- =============================================
-- MIGRATION COMPLETE
--
-- Created:
-- - group_invitations table
-- - RLS policies for secure access
-- - Helper functions for invitation workflow
--
-- Usage:
-- - Create invitation: INSERT INTO group_invitations
-- - Accept: SELECT accept_group_invitation(invitation_id)
-- - Decline: SELECT decline_group_invitation(invitation_id)
-- - Get pending: SELECT * FROM get_user_pending_invitations()
-- =============================================
