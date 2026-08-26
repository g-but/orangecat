-- Make the case-insensitive handle a column, so it can actually be queried.
--
-- 20260826110000 added a UNIQUE index on `lower(username)`. That enforces the
-- constraint correctly, but it is a functional index and PostgREST can only
-- filter on columns — so resolving a batch of mentions case-insensitively had no
-- usable query. The alternatives were both worse:
--
--   * `.in('username', …)` is case-SENSITIVE, so `@Alice` would resolve to
--     nobody while `alice` exists.
--   * `or=(username.ilike.a,username.ilike.b,…)` treats `_` as a wildcard, and
--     `_` is a legal username character — `bob_smith` would match `bobXsmith`.
--     Escaping that per candidate is a footgun in a security-adjacent lookup.
--
-- A STORED generated column is the plain answer: Postgres maintains it, it can
-- never drift from `username`, it indexes as an ordinary column, and it removes
-- the per-row expression evaluation the functional index needed.
--
-- The UNIQUE index moves onto the column, keeping exactly the guarantee
-- 20260826110000 established — two accounts may not differ only in case — so
-- nothing is loosened here. The functional index is then redundant and dropped.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_lower text
  GENERATED ALWAYS AS (lower(username)) STORED;

COMMENT ON COLUMN public.profiles.username_lower IS
  'lower(username), maintained by Postgres. The queryable form of a handle: mention resolution matches on this so @Alice and @alice are the same person.';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (username_lower);

-- Superseded by the index on the generated column above: same guarantee, and
-- keeping both would mean two indexes maintained for one constraint.
DROP INDEX IF EXISTS public.profiles_username_lower_key;

NOTIFY pgrst, 'reload schema';
