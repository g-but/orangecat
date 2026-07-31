-- Hardens the maker profile: a public profile should be able to clearly
-- express (1) what they do — profiles.bio, already exists — (2) the current
-- status of their work, and (3) concrete ways others can help. (2) and (3)
-- had no column to live in; this adds them.
--
-- Value lists are the SSOT in src/config/maker-status.ts
-- (MAKER_STATUS_VALUES, HELP_WANTED_VALUES) — the CHECK constraints below
-- must be kept in sync with that file. Idempotent — safe if a box already
-- has the columns.
--
-- migration-safety: contract-ok the DROP CONSTRAINT IF EXISTS statements only
-- re-create constraints on the current_status/help_wanted columns this very
-- migration adds. They are brand-new columns the previous release never reads
-- or writes, so an auto-rollback to that release runs fine against this schema —
-- nothing it uses is dropped or renamed.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_status TEXT,
  ADD COLUMN IF NOT EXISTS help_wanted TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_current_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_current_status_check
  CHECK (
    current_status IS NULL
    OR current_status = ANY (ARRAY[
      'exploring_ideas',
      'actively_building',
      'shipped_live',
      'seeking_funding',
      'seeking_collaborators',
      'paused'
    ]::text[])
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_help_wanted_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_help_wanted_check
  CHECK (
    help_wanted <@ ARRAY[
      'funding',
      'collaborators',
      'feedback',
      'users_customers',
      'mentorship',
      'job_opportunities',
      'press_coverage',
      'volunteers'
    ]::text[]
  );

COMMENT ON COLUMN public.profiles.current_status IS 'Maker-facing status of their work — see MAKER_STATUS_VALUES in src/config/maker-status.ts';
COMMENT ON COLUMN public.profiles.help_wanted IS 'Concrete ways others can help this maker — see HELP_WANTED_VALUES in src/config/maker-status.ts';
