-- Two accounts may currently differ only in capitalisation.
--
-- `profiles_username_key` is a plain btree UNIQUE index on `username`, so
-- Postgres considers 'cat' and 'Cat' distinct rows. The application check does
-- not close the gap either: ProfileWriter.checkUsernameUniqueness compares with
-- `.eq('username', ...)`, which is likewise case-sensitive — and it runs in the
-- browser, so it is a courtesy, not an enforcement.
--
-- That matters more than it looks, because `@handle` is already tokenized and
-- linked by utils/markdown.tsx. A handle is not just a profile address; it is
-- what every mention of that name points at. Two accounts that differ only in
-- case are indistinguishable to someone reading a mention, which makes
-- impersonation a matter of pressing shift.
--
-- Safe to add now: production has ZERO case collisions today (checked
-- 2026-08-26, 91 profiles, `SELECT count(*) FROM (SELECT lower(username) FROM
-- profiles GROUP BY 1 HAVING count(*) > 1) x` = 0), so no existing row has to be
-- renamed. The index is created first and only then relied upon — if a
-- collision ever did exist, this migration fails and the deploy aborts with the
-- live release untouched, which is the correct outcome.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username));

COMMENT ON INDEX public.profiles_username_lower_key IS
  'Usernames are unique case-insensitively: @Cat and @cat must not be two people. Added 2026-08-26.';

-- `profiles_username_idx` is a non-unique btree on exactly the column already
-- covered by the unique index `profiles_username_key`. It can serve no lookup
-- the unique index cannot, so it has only ever cost write throughput and disk.
DROP INDEX IF EXISTS public.profiles_username_idx;
