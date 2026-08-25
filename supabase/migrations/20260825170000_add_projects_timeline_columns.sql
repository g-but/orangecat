-- Projects collect a timeline and have nowhere to put it.
--
-- `start_date` and `target_completion` are asked for by the project create form
-- (src/config/entity-configs/project-config.ts), validated by projectSchema
-- (src/lib/validation/projects.ts), mapped by the API
-- (src/app/api/projects/[id]/route.ts, commonFieldMappings.dateField), and
-- explained by guidance copy (src/lib/entity-guidance/project-guidance.ts).
-- Neither has ever existed as a column — not in the baseline schema, not in any
-- later migration.
--
-- This is not merely a field that displays nowhere. It is unstorable, and the
-- write fails loudly: buildUpdatePayload omits null/undefined, so the bug only
-- fires when a user ACTUALLY FILLS THE FIELD IN, at which point PostgREST
-- rejects the whole payload and the project save fails. Verified against
-- production 2026-08-25 with a PATCH scoped to a UUID that matches no row:
--
--   target_completion -> 400 PGRST204 (column not found)
--   start_date        -> 400 PGRST204 (column not found)
--   work_status       -> 204          (control: a real column succeeds)
--
-- TEXT, not TIMESTAMPTZ, and deliberately so. Both are `optionalText()` in the
-- Zod schema and `normalizeDate` passes strings through untouched, so the form
-- can and does submit free text — "end of Q3" is a legitimate answer for a
-- project deadline. A timestamptz column would reject exactly the input the
-- schema promises to accept, trading one write failure for another. The reader
-- side already handles both shapes: ProjectSummaryRail formats a parseable value
-- as a date and otherwise shows the creator's own words.
--
-- Nullable with no default: every existing row keeps its current meaning, and an
-- absent value renders nothing rather than an empty row.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date text,
  ADD COLUMN IF NOT EXISTS target_completion text;

COMMENT ON COLUMN public.projects.start_date IS
  'When the creator says work begins. Free text (schema is optionalText): may be an ISO date or a phrase like "once funded".';

COMMENT ON COLUMN public.projects.target_completion IS
  'When the creator says work will be done — the milestone a backer is funding toward. Free text (schema is optionalText): may be an ISO date or a phrase like "end of Q3".';
