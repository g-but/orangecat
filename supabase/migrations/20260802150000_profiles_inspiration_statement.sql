-- profiles.inspiration_statement — the ProfileWizard's "what drives you" field.
--
-- The wizard has collected this field since the wizard shipped and the public
-- profile reads it, but the column never existed: the API's hand-written
-- allow-list silently dropped it (along with currency and background) before
-- the UPDATE, so no save ever errored. This adds the missing column; the
-- companion code change derives the allow-list from profileSchema so the
-- schema and the API can never drift apart again.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS inspiration_statement TEXT;

COMMENT ON COLUMN public.profiles.inspiration_statement IS
  'ProfileWizard "inspiration" field: what drives this maker. Nullable free text.';
