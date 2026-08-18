-- Fix profiles whose public username is a full email address, and close off
-- the write path that let it happen again.
--
-- Root cause: an earlier version of public.handle_new_user() inserted
-- NEW.email verbatim as username instead of split_part(NEW.email, '@', 1).
-- scripts/fix-handle-new-user-function.sql already corrected the trigger
-- (also folded into the CREATE FUNCTION in 20240101000001_baseline_public_schema.sql),
-- but the profiles created under the buggy version were never backfilled —
-- their username (a public, crawlable value: /profiles/<username>) is still
-- their real email address in production today.
--
-- This migration:
--   1. Renames every affected profile's username to the local part
--      (before '@'), de-duplicating against existing usernames the same way
--      the app's own uniqueness check does (base, base1, base2, ...).
--   2. Adds a CHECK constraint so no future write path — a regressed
--      trigger, a script, a manual fix — can reintroduce an '@' into a
--      username again.
--
-- scripts/fix-username-emails.js — an unexecuted script that did #1 but not
-- #2 — is deleted alongside this migration.

DO $$
DECLARE
  rec RECORD;
  base_username text;
  candidate text;
  suffix int;
BEGIN
  FOR rec IN
    SELECT id, username FROM public.profiles WHERE username LIKE '%@%'
  LOOP
    -- Local part only, then strip anything the app's own username regex
    -- (^[a-zA-Z0-9_-]+$, src/lib/validation/base.ts) wouldn't accept — a
    -- local part can legally contain characters (+, ., etc.) usernames here
    -- can't.
    base_username := regexp_replace(split_part(rec.username, '@', 1), '[^a-zA-Z0-9_-]', '', 'g');
    IF base_username = '' THEN
      base_username := 'user_' || substring(rec.id::text, 1, 8);
    END IF;

    candidate := base_username;
    suffix := 0;
    WHILE EXISTS (
      SELECT 1 FROM public.profiles WHERE username = candidate AND id <> rec.id
    ) LOOP
      suffix := suffix + 1;
      candidate := base_username || suffix::text;
    END LOOP;

    UPDATE public.profiles
    SET username = candidate, updated_at = timezone('utc'::text, now())
    WHERE id = rec.id;

    RAISE NOTICE 'profiles: renamed % -> % (id %)', rec.username, candidate, rec.id;
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_no_at_check CHECK (username !~ '@');
