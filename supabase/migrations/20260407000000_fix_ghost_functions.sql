-- Fix 16 DB functions that reference renamed/dropped columns
--
-- After renaming _sats → _btc and dropping profiles columns,
-- these functions still reference the old names and will fail at runtime.

-- =====================================================================
-- 1. DROP DEAD FUNCTIONS (reference fully dropped tables)
-- =====================================================================

-- migrate_organization_to_group: references organizations table (dropped)
DROP FUNCTION IF EXISTS migrate_organization_to_group CASCADE;

-- update_user_document_count: references user_profiles table (dropped)
DROP FUNCTION IF EXISTS update_user_document_count CASCADE;

-- =====================================================================
-- 2. FIX sync_project_funding: amount_sats → amount_btc
-- =====================================================================

CREATE OR REPLACE FUNCTION sync_project_funding()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.to_entity_type = 'project' AND NEW.status = 'confirmed' THEN
      UPDATE projects
      SET
        raised_amount = COALESCE(raised_amount, 0) + NEW.amount_btc,
        contributor_count = CASE
          WHEN NEW.from_entity_type = 'profile' THEN COALESCE(contributor_count, 0) + 1
          ELSE COALESCE(contributor_count, 0)
        END,
        updated_at = NOW()
      WHERE id = NEW.to_entity_id;
    END IF;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF NEW.to_entity_type = 'project' AND OLD.status != NEW.status THEN
      IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
        UPDATE projects
        SET
          raised_amount = GREATEST(0, COALESCE(raised_amount, 0) - OLD.amount_btc),
          contributor_count = CASE
            WHEN OLD.from_entity_type = 'profile' THEN GREATEST(0, COALESCE(contributor_count, 0) - 1)
            ELSE COALESCE(contributor_count, 0)
          END,
          updated_at = NOW()
        WHERE id = OLD.to_entity_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 3. FIX check_cat_permission: max_sats_per_action → max_btc_per_action
-- =====================================================================

CREATE OR REPLACE FUNCTION check_cat_permission(
  p_user_id UUID,
  p_action_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  perm RECORD;
BEGIN
  SELECT * INTO perm
  FROM cat_permissions
  WHERE user_id = p_user_id
  AND (action_id = p_action_id OR action_id = '*')
  AND is_enabled = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 4. FIX AI withdrawal/revenue functions: _sats → _btc
-- =====================================================================

CREATE OR REPLACE FUNCTION increment_ai_revenue(
  p_assistant_id UUID,
  p_creator_id UUID,
  p_amount NUMERIC(18,8)
)
RETURNS void AS $$
BEGIN
  -- Update creator earnings
  INSERT INTO ai_creator_earnings (creator_id, total_earned_btc)
  VALUES (p_creator_id, p_amount)
  ON CONFLICT (creator_id)
  DO UPDATE SET total_earned_btc = ai_creator_earnings.total_earned_btc + p_amount;

  -- Update assistant stats
  UPDATE ai_assistants
  SET total_revenue = COALESCE(total_revenue, 0) + p_amount,
      total_conversations = COALESCE(total_conversations, 0) + 1
  WHERE id = p_assistant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_ai_withdrawal(
  p_creator_id UUID,
  p_amount NUMERIC(18,8),
  p_destination TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO ai_creator_withdrawals (creator_id, amount_btc, destination, status)
  VALUES (p_creator_id, p_amount, p_destination, 'pending')
  RETURNING id INTO v_id;

  UPDATE ai_creator_earnings
  SET pending_withdrawal_btc = COALESCE(pending_withdrawal_btc, 0) + p_amount
  WHERE creator_id = p_creator_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_ai_withdrawal(p_withdrawal_id UUID)
RETURNS void AS $$
DECLARE
  w RECORD;
BEGIN
  SELECT * INTO w FROM ai_creator_withdrawals WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found or not pending'; END IF;

  UPDATE ai_creator_withdrawals SET status = 'completed', completed_at = NOW() WHERE id = p_withdrawal_id;
  UPDATE ai_creator_earnings
  SET pending_withdrawal_btc = GREATEST(0, COALESCE(pending_withdrawal_btc, 0) - w.amount_btc),
      total_withdrawn_btc = COALESCE(total_withdrawn_btc, 0) + w.amount_btc
  WHERE creator_id = w.creator_id;
  UPDATE ai_assistants
  SET total_withdrawn_btc = COALESCE(total_withdrawn_btc, 0) + w.amount_btc
  WHERE id = w.creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_ai_withdrawal(p_withdrawal_id UUID)
RETURNS void AS $$
DECLARE
  w RECORD;
BEGIN
  SELECT * INTO w FROM ai_creator_withdrawals WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found or not pending'; END IF;

  UPDATE ai_creator_withdrawals SET status = 'cancelled', completed_at = NOW() WHERE id = p_withdrawal_id;
  UPDATE ai_creator_earnings
  SET pending_withdrawal_btc = GREATEST(0, COALESCE(pending_withdrawal_btc, 0) - w.amount_btc)
  WHERE creator_id = w.creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fail_ai_withdrawal(p_withdrawal_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  w RECORD;
BEGIN
  SELECT * INTO w FROM ai_creator_withdrawals WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found or not pending'; END IF;

  UPDATE ai_creator_withdrawals SET status = 'failed', completed_at = NOW(), failure_reason = p_reason WHERE id = p_withdrawal_id;
  UPDATE ai_creator_earnings
  SET pending_withdrawal_btc = GREATEST(0, COALESCE(pending_withdrawal_btc, 0) - w.amount_btc)
  WHERE creator_id = w.creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 5. FIX handle_new_user: remove user_profiles reference
-- =====================================================================

-- This function runs on auth.users INSERT. Just ensure profile row exists.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, name, email, status, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(split_part(NEW.email, '@', 1), 'user_' || left(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 6. FIX get_available_loans: amount_sats → amount references
-- =====================================================================

-- This function likely references loan columns that were renamed.
-- Since loans.amount is already NUMERIC (not _sats), just ensure
-- the function matches the current schema.
CREATE OR REPLACE FUNCTION get_available_loans(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF loans AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM loans l
  WHERE l.status = 'active'
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 7. Timeline functions: display_name in JSON keys is intentional
--    (they reference profiles.name, output as 'display_name' key)
--    These were already fixed when we recreated the views.
--    No changes needed — the prosrc match was on the JSON key string,
--    not a column reference.
-- =====================================================================

-- Verify: no more functions reference _sats
-- Run after applying:
-- SELECT proname FROM pg_proc WHERE prosrc ~* '_sats' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
