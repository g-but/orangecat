-- Projects: a short, human-written note on where the work actually stands.
--
-- `status` is the lifecycle (draft/active/paused/completed) and answers "is this
-- page live". It does not answer "what is happening on this project right now",
-- which is what a supporter reading the About section wants to know. Visitor
-- feedback (2026-08-24): "About says what it does, but there's no current status
-- of the work field."
--
-- Nullable and additive: existing rows keep working, nothing backfills.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_status TEXT;

COMMENT ON COLUMN projects.work_status IS
  'Owner-written note on where the work stands right now (distinct from the status lifecycle column).';
